/**
 * 클라이언트 사이드 Google Takeout 파일 처리
 * 대용량 파일을 브라우저에서 먼저 필터링
 */

import { TimelineLocation } from '../types'

export interface FileProcessingOptions {
  startDate?: string // YYYY-MM-DD
  endDate?: string   // YYYY-MM-DD
  maxLocations?: number // 최대 위치 개수 제한
}

export interface ProcessingResult {
  success: boolean
  data?: {
    locations: TimelineLocation[]
    metadata: {
      originalCount: number
      filteredCount: number
      dateRange: string
      processingTime: number
    }
  }
  error?: string
}

/**
 * 브라우저에서 대용량 Google Takeout 파일 처리
 */
export async function processGoogleTakeoutFile(
  file: File, 
  options: FileProcessingOptions = {}
): Promise<ProcessingResult> {
  const startTime = Date.now()
  
  try {
    console.log(`📂 클라이언트 파일 처리 시작: ${file.name} (${Math.round(file.size / 1024 / 1024)}MB)`)

    // 1. 파일 크기 검증
    if (file.size > 500 * 1024 * 1024) { // 500MB 브라우저 제한
      return {
        success: false,
        error: '파일이 너무 큽니다 (500MB 초과). 더 작은 파일로 시도해주세요.'
      }
    }

    // 2. 파일 읽기
    const text = await file.text()
    let data: any

    try {
      data = JSON.parse(text)
    } catch (parseError) {
      return {
        success: false,
        error: '유효하지 않은 JSON 파일입니다.'
      }
    }

    // 3. Google Takeout 형식 감지 및 파싱
    const rawLocations = parseGoogleTakeoutData(data)
    
    if (rawLocations.length === 0) {
      return {
        success: false,
        error: 'Location History 데이터를 찾을 수 없습니다.'
      }
    }

    console.log(`📍 원본 위치 개수: ${rawLocations.length}`)

    // 4. 날짜 필터링
    const filteredLocations = filterLocationsByDate(rawLocations, options)
    console.log(`📅 날짜 필터링 후: ${filteredLocations.length}`)

    // 5. 데이터 정규화
    const normalizedLocations = normalizeLocationHistory(filteredLocations)
    
    // 6. 개수 제한 적용
    const finalLocations = options.maxLocations 
      ? normalizedLocations.slice(0, options.maxLocations)
      : normalizedLocations

    const processingTime = Date.now() - startTime
    console.log(`✅ 클라이언트 처리 완료: ${finalLocations.length}개 위치, ${processingTime}ms`)

    return {
      success: true,
      data: {
        locations: finalLocations,
        metadata: {
          originalCount: rawLocations.length,
          filteredCount: finalLocations.length,
          dateRange: options.startDate && options.endDate 
            ? `${options.startDate} ~ ${options.endDate}`
            : '전체 기간',
          processingTime
        }
      }
    }

  } catch (error) {
    console.error('❌ 클라이언트 파일 처리 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '파일 처리 중 오류가 발생했습니다.'
    }
  }
}

/**
 * Google Takeout 데이터 형식 감지 및 파싱
 */
function parseGoogleTakeoutData(data: any): Array<any> {
  const locations: Array<any> = []

  // 1. semanticSegments 형태 (실제 Google Timeline 형식)
  if (data.semanticSegments && Array.isArray(data.semanticSegments)) {
    console.log(`📍 semanticSegments 형식 감지: ${data.semanticSegments.length}개 세그먼트`)
    
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
      
      // 시작/종료 시간 정보도 위치로 추가 (필요시)
      if (segment.startTime && segment.endTime) {
        // 첫 번째와 마지막 timelinePath 점 사용
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
        
        if (lastPoint?.point && lastPoint !== firstPoint) {
          const coords = parseCoordinateString(lastPoint.point)
          if (coords) {
            locations.push({
              latitude: coords.lat,
              longitude: coords.lng,
              timestamp: segment.endTime,
              segmentType: 'segmentEnd'
            })
          }
        }
      }
    })
    
    console.log(`✅ semanticSegments 파싱 완료: ${locations.length}개 위치`)
    return locations
  }

  // 2. 기존 locations 배열 형태
  if (Array.isArray(data)) {
    return data
  }
  
  if (data.locations && Array.isArray(data.locations)) {
    return data.locations
  }
  
  // 3. timelineObjects 형태 (다른 Google 형식)
  if (data.timelineObjects && Array.isArray(data.timelineObjects)) {
    data.timelineObjects.forEach((obj: any) => {
      if (obj.placeVisit?.location) {
        locations.push({
          latitudeE7: obj.placeVisit.location.latitudeE7,
          longitudeE7: obj.placeVisit.location.longitudeE7,
          timestamp: obj.placeVisit.duration?.startTimestamp,
          address: obj.placeVisit.location.address || obj.placeVisit.location.name,
          placeId: obj.placeVisit.location.placeId
        })
      }
      
      if (obj.activitySegment?.startLocation) {
        locations.push({
          latitudeE7: obj.activitySegment.startLocation.latitudeE7,
          longitudeE7: obj.activitySegment.startLocation.longitudeE7,
          timestamp: obj.activitySegment.duration?.startTimestamp,
          activity: obj.activitySegment.activityType
        })
      }
    })
    
    return locations
  }
  
  console.warn('⚠️ 지원되지 않는 Google Takeout 형식')
  return []
}

/**
 * "37.4797273°, 126.9150743°" 형식의 좌표 문자열 파싱
 */
function parseCoordinateString(pointStr: string): { lat: number; lng: number } | null {
  try {
    // "37.4797273°, 126.9150743°" -> ["37.4797273", "126.9150743"]
    const cleaned = pointStr.replace(/°/g, '').trim()
    const parts = cleaned.split(',').map(s => s.trim())
    
    if (parts.length === 2) {
      const lat = parseFloat(parts[0])
      const lng = parseFloat(parts[1])
      
      if (!isNaN(lat) && !isNaN(lng)) {
        // 좌표 유효성 검사
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return { lat, lng }
        }
      }
    }
    
    return null
  } catch (error) {
    console.warn('좌표 파싱 오류:', pointStr, error)
    return null
  }
}

/**
 * 날짜 기준으로 위치 데이터 필터링
 */
function filterLocationsByDate(
  locations: Array<any>, 
  options: FileProcessingOptions
): Array<any> {
  if (!options.startDate && !options.endDate) {
    return locations
  }

  const startTime = options.startDate ? new Date(options.startDate).getTime() : 0
  const endTime = options.endDate ? new Date(options.endDate + 'T23:59:59').getTime() : Date.now()

  return locations.filter(location => {
    let timestamp: number

    if (location.timestamp) {
      timestamp = new Date(location.timestamp).getTime()
    } else if (location.timestampMs) {
      timestamp = parseInt(location.timestampMs)
    } else {
      return false // 타임스탬프 없는 데이터 제외
    }

    return timestamp >= startTime && timestamp <= endTime
  })
}

/**
 * 위치 데이터 정규화 (기존 로직과 동일)
 */
function normalizeLocationHistory(rawLocations: Array<any>): TimelineLocation[] {
  const locations = rawLocations
    .filter(item => {
      const hasCoordinates = (item.latitudeE7 || item.latitude) && (item.longitudeE7 || item.longitude)
      const hasTimestamp = item.timestamp || item.timestampMs
      return hasCoordinates && hasTimestamp
    })
    .map((item, index) => {
      const latitude = item.latitudeE7 ? item.latitudeE7 / 1e7 : item.latitude
      const longitude = item.longitudeE7 ? item.longitudeE7 / 1e7 : item.longitude
      
      let timestamp: string
      if (item.timestamp) {
        timestamp = item.timestamp
      } else if (item.timestampMs) {
        timestamp = new Date(parseInt(item.timestampMs)).toISOString()
      } else {
        timestamp = new Date().toISOString()
      }

      return {
        id: `client_${timestamp}_${index}`,
        latitude,
        longitude,
        timestamp,
        address: item.address || '알 수 없는 위치',
        accuracy: item.accuracy || 0
      }
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  // 중복 제거 (기존 로직과 동일)
  const uniqueLocations: TimelineLocation[] = []
  const DISTANCE_THRESHOLD = 0.001
  const TIME_THRESHOLD = 5 * 60 * 1000

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