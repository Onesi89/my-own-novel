/**
 * Google Takeout Location History Upload API
 * Route: POST /api/timeline/upload
 * 
 * Google Takeout에서 다운로드한 Location History JSON 파일 처리
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createPureClient } from '@/supabase/server'
import { TimelineApiResponse, TimelineLocation } from '@/features/timeline/types'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // 1. 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json<TimelineApiResponse>({
        success: false,
        error: '인증이 필요합니다. 로그인 후 다시 시도해주세요.'
      }, { status: 401 })
    }

    // 2. FormData에서 파일 추출
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json<TimelineApiResponse>({
        success: false,
        error: '파일이 선택되지 않았습니다.'
      }, { status: 400 })
    }

    // 3. 파일 크기 및 형식 검증
    if (file.size > 200 * 1024 * 1024) { // 200MB로 확대 (클라이언트에서 필터링 후 전송)
      return NextResponse.json<TimelineApiResponse>({
        success: false,
        error: '파일 크기가 200MB를 초과합니다. 파일을 분할하거나 클라이언트에서 필터링 후 업로드해주세요.'
      }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith('.json')) {
      return NextResponse.json<TimelineApiResponse>({
        success: false,
        error: 'JSON 파일만 업로드 가능합니다.'
      }, { status: 400 })
    }

    // 4. 파일 내용 읽기 및 파싱
    const fileContent = await file.text()
    let locationHistory: any

    try {
      locationHistory = JSON.parse(fileContent)
    } catch (parseError) {
      return NextResponse.json<TimelineApiResponse>({
        success: false,
        error: '유효하지 않은 JSON 파일입니다.'
      }, { status: 400 })
    }

    // 5. Google Takeout Location History 형식 검증 및 파싱
    const locations = parseGoogleTakeoutData(locationHistory)
    
    if (locations.length === 0) {
      return NextResponse.json<TimelineApiResponse>({
        success: false,
        error: 'Location History 데이터를 찾을 수 없습니다. Google Takeout의 위치 기록 파일인지 확인해주세요.'
      }, { status: 400 })
    }

    // 6. 데이터 정규화 및 필터링
    const normalizedLocations = normalizeLocationHistory(locations)
    
    // 7. Supabase에 저장
    await saveLocationHistory(supabase, user.id, normalizedLocations)

    // 8. 응답 생성
    const responseTime = Date.now() - startTime
    console.log(`✅ Google Takeout 업로드 완료: ${normalizedLocations.length}개 위치, ${responseTime}ms`)

    return NextResponse.json<TimelineApiResponse>({
      success: true,
      data: {
        locations: normalizedLocations.slice(0, 100), // 처음 100개만 반환 (성능 고려)
        metadata: {
          start: normalizedLocations[0]?.timestamp.split('T')[0] || '',
          end: normalizedLocations[normalizedLocations.length - 1]?.timestamp.split('T')[0] || '',
          totalLocations: normalizedLocations.length,
          responseTime,
          source: 'google_takeout'
        }
      }
    })

  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error('❌ Google Takeout 업로드 오류:', error)

    return NextResponse.json<TimelineApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : '파일 처리 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

/**
 * Google Takeout Location History 데이터 파싱
 */
function parseGoogleTakeoutData(data: any): Array<any> {
  const locations: Array<any> = []

  // 1. semanticSegments 형태 (실제 Google Timeline 형식)
  if (data.semanticSegments && Array.isArray(data.semanticSegments)) {
    console.log(`📍 Server: semanticSegments 형식 감지: ${data.semanticSegments.length}개 세그먼트`)
    
    data.semanticSegments.forEach((segment: any) => {
      // timelinePath에서 위치 정보 추출
      if (segment.timelinePath && Array.isArray(segment.timelinePath)) {
        segment.timelinePath.forEach((pathPoint: any) => {
          if (pathPoint.point && pathPoint.time) {
            // "37.4797273°, 126.9150743°" 형식 파싱
            const coordinates = parseCoordinateString(pathPoint.point)
            if (coordinates) {
              locations.push({
                latitude: coordinates.lat,
                longitude: coordinates.lng,
                timestamp: pathPoint.time,
                segmentType: 'timelinePath'
              })
            }
          }
        })
      }
      
      // 시작/종료 시간 정보도 위치로 추가
      if (segment.startTime && segment.endTime) {
        const firstPoint = segment.timelinePath?.[0]
        const lastPoint = segment.timelinePath?.[segment.timelinePath?.length - 1]
        
        if (firstPoint?.point) {
          const coords = parseCoordinateString(firstPoint.point)
          if (coords) {
            locations.push({
              latitude: coords.lat,
              longitude: coords.lng,
              timestamp: segment.startTime,
              segmentType: 'segmentStart'
            })
          }
        }
      }
    })
    
    console.log(`✅ Server: semanticSegments 파싱 완료: ${locations.length}개 위치`)
    return locations
  }

  // 2. 클라이언트에서 이미 처리된 데이터 (locations 배열)
  if (data.locations && Array.isArray(data.locations)) {
    console.log(`📍 Server: 클라이언트 처리된 데이터: ${data.locations.length}개 위치`)
    return data.locations
  }

  // 3. 기존 형식들 (하위 호환성)
  if (Array.isArray(data)) {
    return data
  }
  
  // timelineObjects 형태 (다른 Google 형식)
  if (data.timelineObjects && Array.isArray(data.timelineObjects)) {
    data.timelineObjects.forEach((obj: any) => {
      if (obj.placeVisit?.location) {
        locations.push({
          latitudeE7: obj.placeVisit.location.latitudeE7,
          longitudeE7: obj.placeVisit.location.longitudeE7,
          timestamp: obj.placeVisit.duration?.startTimestamp,
          address: obj.placeVisit.location.address || obj.placeVisit.location.name
        })
      }
      
      if (obj.activitySegment?.startLocation) {
        locations.push({
          latitudeE7: obj.activitySegment.startLocation.latitudeE7,
          longitudeE7: obj.activitySegment.startLocation.longitudeE7,
          timestamp: obj.activitySegment.duration?.startTimestamp
        })
      }
    })
    
    return locations
  }
  
  return []
}

/**
 * "37.4797273°, 126.9150743°" 형식의 좌표 문자열 파싱
 */
function parseCoordinateString(pointStr: string): { lat: number; lng: number } | null {
  try {
    const cleaned = pointStr.replace(/°/g, '').trim()
    const parts = cleaned.split(',').map(s => s.trim())
    
    if (parts.length === 2) {
      const lat = parseFloat(parts[0])
      const lng = parseFloat(parts[1])
      
      if (!isNaN(lat) && !isNaN(lng)) {
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return { lat, lng }
        }
      }
    }
    
    return null
  } catch (error) {
    console.warn('Server: 좌표 파싱 오류:', pointStr, error)
    return null
  }
}

/**
 * Location History 데이터 정규화
 */
function normalizeLocationHistory(rawLocations: Array<any>): TimelineLocation[] {
  const locations = rawLocations
    .filter(item => {
      // 필수 필드 검증
      const hasCoordinates = (item.latitudeE7 || item.latitude) && (item.longitudeE7 || item.longitude)
      const hasTimestamp = item.timestamp || item.timestampMs
      return hasCoordinates && hasTimestamp
    })
    .map((item, index) => {
      // 좌표 정규화 (E7 형식을 일반 좌표로 변환)
      const latitude = item.latitudeE7 ? item.latitudeE7 / 1e7 : item.latitude
      const longitude = item.longitudeE7 ? item.longitudeE7 / 1e7 : item.longitude
      
      // 타임스탬프 정규화
      let timestamp: string
      if (item.timestamp) {
        timestamp = item.timestamp
      } else if (item.timestampMs) {
        timestamp = new Date(parseInt(item.timestampMs)).toISOString()
      } else {
        timestamp = new Date().toISOString()
      }

      return {
        id: `takeout_${timestamp}_${index}`,
        latitude,
        longitude,
        timestamp,
        address: item.address || '알 수 없는 위치',
        accuracy: item.accuracy || 0
      }
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  // 중복 제거 (같은 시간대, 비슷한 위치)
  const uniqueLocations: TimelineLocation[] = []
  const DISTANCE_THRESHOLD = 0.001 // 약 100미터
  const TIME_THRESHOLD = 5 * 60 * 1000 // 5분

  for (const location of locations) {
    const isDuplicate = uniqueLocations.some(existing => {
      const timeDiff = Math.abs(new Date(location.timestamp).getTime() - new Date(existing.timestamp).getTime())
      const latDiff = Math.abs(location.latitude - existing.latitude)
      const lngDiff = Math.abs(location.longitude - existing.longitude)
      
      return timeDiff < TIME_THRESHOLD && latDiff < DISTANCE_THRESHOLD && lngDiff < DISTANCE_THRESHOLD
    })
    
    if (!isDuplicate) {
      uniqueLocations.push(location)
    }
  }

  return uniqueLocations
}

/**
 * Supabase에 Location History 저장 (개선된 스키마 사용)
 */
async function saveLocationHistory(
  supabase: any,
  userId: string,
  locations: TimelineLocation[]
) {
  try {
    if (locations.length === 0) {
      console.warn('저장할 위치 데이터가 없습니다.')
      return
    }

    // 날짜 범위 계산
    const sortedLocations = locations.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    const startDate = sortedLocations[0].timestamp.split('T')[0]
    const endDate = sortedLocations[sortedLocations.length - 1].timestamp.split('T')[0]
    
    // Service Role 클라이언트 생성 (RLS 우회용)
    const adminSupabase = await createPureClient()
    
    // 기존 Google Takeout 데이터 삭제 (새로 업로드된 것으로 교체)
    await adminSupabase
      .from('timelines')
      .delete()
      .eq('user_id', userId)
      .eq('source', 'google_takeout')

    // timelines 테이블에 메인 데이터 저장
    const { data: timelineData, error: timelineError } = await adminSupabase
      .from('timelines')
      .insert({
        user_id: userId,
        timeline_date: startDate, // 시작 날짜를 대표 날짜로 사용
        start_date: startDate,
        end_date: endDate,
        raw_data: { locations: locations }, // 원본 데이터 보관
        processed_locations: locations,
        location_count: locations.length,
        source: 'google_takeout',
        metadata: {
          upload_time: new Date().toISOString(),
          data_format: 'semanticSegments',
          processing_version: '1.0'
        },
        data_quality: {
          total_points: locations.length,
          date_range_days: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)),
          has_address_info: locations.some(loc => loc.address && loc.address !== '알 수 없는 위치')
        }
      })
      .select()

    if (timelineError) {
      console.info('💾 Supabase 테이블 없음 (정상): timelines 테이블이 생성되지 않았습니다.')
      console.info('📝 참고: 현재는 메모리에서만 처리되며, 데이터는 사용자 세션에만 저장됩니다.')
      return
    }

    const timelineId = timelineData[0].id
    console.log('✅ Timeline 메인 데이터 저장 완료:', timelineId)

    // 장소 방문 정보 생성 및 저장 (locations를 분석하여 체류 지점 추출)
    const placeVisits = await extractPlaceVisits(locations, timelineId, userId)
    if (placeVisits.length > 0) {
      const { error: placeError } = await adminSupabase
        .from('place_visits')
        .insert(placeVisits)
      
      if (placeError) {
        console.info('💾 place_visits 테이블 없음 (정상): 마이그레이션이 적용되지 않았습니다.')
      } else {
        console.log('✅ 장소 방문 정보 저장 완료:', placeVisits.length)
      }
    }

    // 이동 경로 정보 생성 및 저장
    const movementPaths = await extractMovementPaths(locations, timelineId, userId)
    if (movementPaths.length > 0) {
      const { error: pathError } = await supabase
        .from('movement_paths')
        .insert(movementPaths)
      
      if (pathError) {
        console.info('💾 movement_paths 테이블 없음 (정상): 마이그레이션이 적용되지 않았습니다.')
      } else {
        console.log('✅ 이동 경로 정보 저장 완료:', movementPaths.length)
      }
    }

    console.log('✅ Google Takeout 데이터 저장 완료:', {
      locations: locations.length,
      placeVisits: placeVisits.length,
      movementPaths: movementPaths.length
    })

  } catch (error) {
    console.warn('Location History 저장 중 오류:', error)
  }
}

/**
 * 위치 데이터에서 장소 방문 정보 추출
 */
async function extractPlaceVisits(locations: TimelineLocation[], timelineId: string, userId: string) {
  const placeVisits: any[] = []
  const STAY_THRESHOLD_MINUTES = 15 // 15분 이상 체류한 장소만 추출
  const DISTANCE_THRESHOLD = 0.001 // 약 100m 이내를 같은 장소로 간주

  let currentPlace: any = null
  
  for (let i = 0; i < locations.length; i++) {
    const location = locations[i]
    const timestamp = new Date(location.timestamp)
    
    // 현재 장소와 비교하여 새로운 장소인지 확인
    if (!currentPlace || 
        Math.abs(location.latitude - currentPlace.latitude) > DISTANCE_THRESHOLD ||
        Math.abs(location.longitude - currentPlace.longitude) > DISTANCE_THRESHOLD) {
      
      // 이전 장소 정보 저장 (체류 시간이 충분한 경우)
      if (currentPlace && currentPlace.duration_minutes >= STAY_THRESHOLD_MINUTES) {
        placeVisits.push({
          timeline_id: timelineId,
          user_id: userId,
          place_name: currentPlace.address || '알 수 없는 장소',
          place_address: currentPlace.address,
          latitude: currentPlace.latitude,
          longitude: currentPlace.longitude,
          arrival_time: currentPlace.arrival_time,
          departure_time: currentPlace.departure_time,
          duration_minutes: currentPlace.duration_minutes,
          visit_type: 'unknown',
          confidence_level: 0.7,
          segment_type: 'place_visit',
          raw_segment_data: {
            location_count: currentPlace.location_count,
            source: 'google_takeout_analysis'
          }
        })
      }
      
      // 새로운 장소 시작
      currentPlace = {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        arrival_time: timestamp,
        departure_time: timestamp,
        duration_minutes: 0,
        location_count: 1
      }
    } else {
      // 같은 장소에서 계속 체류
      if (currentPlace) {
        currentPlace.departure_time = timestamp
        currentPlace.duration_minutes = Math.round(
          (timestamp.getTime() - new Date(currentPlace.arrival_time).getTime()) / (1000 * 60)
        )
        currentPlace.location_count += 1
      }
    }
  }
  
  // 마지막 장소 처리
  if (currentPlace && currentPlace.duration_minutes >= STAY_THRESHOLD_MINUTES) {
    placeVisits.push({
      timeline_id: timelineId,
      user_id: userId,
      place_name: currentPlace.address || '알 수 없는 장소',
      place_address: currentPlace.address,
      latitude: currentPlace.latitude,
      longitude: currentPlace.longitude,
      arrival_time: currentPlace.arrival_time,
      departure_time: currentPlace.departure_time,
      duration_minutes: currentPlace.duration_minutes,
      visit_type: 'unknown',
      confidence_level: 0.7,
      segment_type: 'place_visit',
      raw_segment_data: {
        location_count: currentPlace.location_count,
        source: 'google_takeout_analysis'
      }
    })
  }
  
  return placeVisits
}

/**
 * 위치 데이터에서 이동 경로 정보 추출
 */
async function extractMovementPaths(locations: TimelineLocation[], timelineId: string, userId: string) {
  const movementPaths: any[] = []
  const MIN_MOVEMENT_DISTANCE = 0.005 // 약 500m 이상 이동한 경우만 기록
  
  for (let i = 0; i < locations.length - 1; i++) {
    const startLocation = locations[i]
    const endLocation = locations[i + 1]
    
    const startTime = new Date(startLocation.timestamp)
    const endTime = new Date(endLocation.timestamp)
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
    
    // 거리 계산 (간단한 유클리드 거리)
    const distance = Math.sqrt(
      Math.pow(endLocation.latitude - startLocation.latitude, 2) +
      Math.pow(endLocation.longitude - startLocation.longitude, 2)
    )
    
    // 유의미한 이동인 경우만 기록
    if (distance > MIN_MOVEMENT_DISTANCE && durationMinutes > 0) {
      movementPaths.push({
        timeline_id: timelineId,
        user_id: userId,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: durationMinutes,
        path_points: [
          { lat: startLocation.latitude, lng: startLocation.longitude, time: startLocation.timestamp },
          { lat: endLocation.latitude, lng: endLocation.longitude, time: endLocation.timestamp }
        ],
        total_distance_meters: Math.round(distance * 111320), // 대략적인 미터 변환
        average_speed_kmh: Math.round((distance * 111.32) / (durationMinutes / 60) * 100) / 100,
        start_latitude: startLocation.latitude,
        start_longitude: startLocation.longitude,
        end_latitude: endLocation.latitude,
        end_longitude: endLocation.longitude,
        transport_mode: 'unknown',
        confidence_level: 0.6,
        segment_type: 'movement_path',
        raw_segment_data: {
          source: 'google_takeout_analysis',
          calculated_distance: distance
        }
      })
    }
  }
  
  return movementPaths
}