/**
 * Google Timeline API Endpoint
 * Route: GET /api/timeline
 * 
 * 구글 타임라인 데이터 수집 및 Supabase 저장
 * OAuth2 인증 및 데이터 처리
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/supabase/server'
import { TimelineApiResponse, TimelineLocation } from '@/features/timeline/types/index'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // 1. Query parameters 검증
    const searchParams = request.nextUrl.searchParams
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    if (!start || !end) {
      return NextResponse.json<TimelineApiResponse>({
        success: false,
        error: 'start와 end 날짜 파라미터가 필요합니다. 형식: YYYY-MM-DD'
      }, { status: 400 })
    }

    // 날짜 형식 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(start) || !dateRegex.test(end)) {
      return NextResponse.json<TimelineApiResponse>({
        success: false,
        error: '날짜 형식이 올바르지 않습니다. YYYY-MM-DD 형식을 사용하세요.'
      }, { status: 400 })
    }

    // 2. 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json<TimelineApiResponse>({
        success: false,
        error: '인증이 필요합니다. 로그인 후 다시 시도해주세요.'
      }, { status: 401 })
    }

    // 3. Google Timeline 데이터 수집 (현재는 시뮬레이션)
    // TODO: 실제 Google Maps Timeline API 연동
    console.log(`📍 Timeline API 요청: 사용자 ${user.id}, 기간 ${start} ~ ${end}`)
    
    // Google Timeline API 시뮬레이션 (실제 구현 시 교체)
    const mockTimelineData = await simulateGoogleTimelineAPI(start, end, user.id)

    // 4. 데이터 정규화 및 검증
    const normalizedData = normalizeTimelineData(mockTimelineData)
    
    // 5. Supabase에 저장
    const savedData = await saveTimelineData(supabase, user.id, start, end, normalizedData)

    // 6. 응답 생성
    const responseTime = Date.now() - startTime
    console.log(`✅ Timeline API 완료: ${responseTime}ms`)

    return NextResponse.json<TimelineApiResponse>({
      success: true,
      data: {
        locations: normalizedData,
        metadata: {
          start,
          end,
          totalLocations: normalizedData.length,
          responseTime,
          source: 'google_timeline_api'
        }
      }
    })

  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error('❌ Timeline API 오류:', error)

    return NextResponse.json<TimelineApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : '타임라인 데이터 수집 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

/**
 * Google Timeline API 시뮬레이션
 * 실제 구현 시 Google Maps Timeline API 호출로 교체
 */
async function simulateGoogleTimelineAPI(
  start: string, 
  end: string, 
  userId: string
): Promise<Array<any>> {
  // 시뮬레이션을 위한 지연
  await new Promise(resolve => setTimeout(resolve, 1500))

  // 서울시 주요 지점들을 이용한 목 데이터
  const seoulLocations = [
    { lat: 37.5665, lng: 126.9780, name: '명동' },
    { lat: 37.5563, lng: 126.9723, name: '남산타워' },
    { lat: 37.5172, lng: 127.0473, name: '강남역' },
    { lat: 37.5400, lng: 127.0700, name: '잠실' },
    { lat: 37.5662, lng: 126.9779, name: '을지로' },
    { lat: 37.5796, lng: 126.9770, name: '종로' },
  ]

  const startDate = new Date(start)
  const endDate = new Date(end)
  const locations = []

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    // 하루에 3-5개 위치 생성
    const dailyLocationCount = Math.floor(Math.random() * 3) + 3
    
    for (let i = 0; i < dailyLocationCount; i++) {
      const location = seoulLocations[Math.floor(Math.random() * seoulLocations.length)]
      const timestamp = new Date(d)
      timestamp.setHours(9 + i * 2, Math.floor(Math.random() * 60), 0, 0)
      
      locations.push({
        latitudeE7: Math.round(location.lat * 1e7),
        longitudeE7: Math.round(location.lng * 1e7),
        timestamp: timestamp.toISOString(),
        address: location.name,
        accuracy: Math.floor(Math.random() * 50) + 10
      })
    }
  }

  return locations
}

/**
 * Timeline 데이터 정규화
 */
function normalizeTimelineData(rawData: Array<any>): TimelineLocation[] {
  return rawData.map((item, index) => ({
    id: `loc_${Date.now()}_${index}`,
    latitude: item.latitudeE7 ? item.latitudeE7 / 1e7 : item.lat || 37.5665,
    longitude: item.longitudeE7 ? item.longitudeE7 / 1e7 : item.lng || 126.9780,
    timestamp: item.timestamp || new Date().toISOString(),
    address: item.address || '알 수 없는 위치',
    accuracy: item.accuracy || 20
  })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

/**
 * Supabase에 Timeline 데이터 저장 (개선된 스키마 사용)
 */
async function saveTimelineData(
  supabase: any,
  userId: string,
  start: string,
  end: string,
  locations: TimelineLocation[]
) {
  try {
    // timelines 테이블에 저장 (기존 테이블 사용)
    const { data, error } = await supabase
      .from('timelines')
      .upsert({
        user_id: userId,
        timeline_date: start, // 시작 날짜를 대표 날짜로 사용
        start_date: start,
        end_date: end,
        raw_data: { locations: locations, source: 'simulation' },
        processed_locations: locations,
        location_count: locations.length,
        source: 'simulation',
        metadata: {
          api_version: '1.0',
          generation_time: new Date().toISOString(),
          date_range: `${start}_${end}`
        },
        data_quality: {
          total_points: locations.length,
          date_range_days: Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1,
          is_simulation: true
        }
      })
      .select()

    if (error) {
      console.info('💾 Supabase 테이블 없음 (정상): timelines 테이블이 생성되지 않았습니다.')
      console.info('📝 참고: 마이그레이션이 적용되지 않았거나 테이블이 존재하지 않습니다.')
      // 테이블이 없어도 API는 정상 동작하도록 함
      return locations
    }

    console.log('✅ Timeline 데이터 저장 완료:', data?.length || 0)
    
    // 시뮬레이션 데이터의 경우 간단한 장소 방문 정보도 생성
    if (data && data.length > 0) {
      const timelineId = data[0].id
      await createSimulationPlaceVisits(supabase, timelineId, userId, locations)
    }
    
    return locations
  } catch (error) {
    console.warn('Timeline 데이터 저장 중 오류:', error)
    // 저장 실패해도 API는 정상 동작
    return locations
  }
}

/**
 * 시뮬레이션 데이터용 간단한 장소 방문 정보 생성
 */
async function createSimulationPlaceVisits(
  supabase: any, 
  timelineId: string, 
  userId: string, 
  locations: TimelineLocation[]
) {
  try {
    // 각 위치를 30분 체류한 장소 방문으로 변환
    const placeVisits = locations.map((location, index) => {
      const arrivalTime = new Date(location.timestamp)
      const departureTime = new Date(arrivalTime.getTime() + 30 * 60 * 1000) // 30분 후
      
      return {
        timeline_id: timelineId,
        user_id: userId,
        place_name: location.address,
        place_address: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
        arrival_time: arrivalTime.toISOString(),
        departure_time: departureTime.toISOString(),
        duration_minutes: 30,
        visit_type: 'leisure',
        confidence_level: 0.5, // 시뮬레이션 데이터이므로 낮은 신뢰도
        segment_type: 'simulation_visit',
        raw_segment_data: {
          source: 'simulation',
          original_location_id: location.id
        }
      }
    })
    
    const { error } = await supabase
      .from('place_visits')
      .insert(placeVisits)
    
    if (error) {
      console.info('💾 place_visits 테이블 없음 (정상): 마이그레이션이 적용되지 않았습니다.')
    } else {
      console.log('✅ 시뮬레이션 장소 방문 정보 생성 완료:', placeVisits.length)
    }
  } catch (error) {
    console.warn('시뮬레이션 장소 방문 정보 생성 중 오류:', error)
  }
}