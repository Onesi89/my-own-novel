/**
 * Timeline Types
 * FSD: features/timeline/types
 * 
 * Google Timeline API 및 타임라인 데이터 타입 정의
 */

// 기본 위치 데이터 인터페이스
export interface TimelineLocation {
  id: string
  latitude: number
  longitude: number
  timestamp: string
  address?: string
  accuracy?: number
  duration?: number // 체류 시간 (분)
  // 추가 메타데이터 (원본 데이터에서 추출)
  segmentType?: 'timelinePath' | 'segmentStart' | 'segmentEnd' | 'place_visit' | 'activity_segment'
  placeId?: string // Google Place ID (있는 경우)
  activityType?: string // 활동 유형 (있는 경우)
  confidence?: number // 데이터 신뢰도
}

// Timeline API 응답 타입
export interface TimelineApiResponse {
  success: boolean
  data?: {
    locations: TimelineLocation[]
    metadata: {
      start: string
      end: string
      totalLocations: number
      responseTime?: number
      source?: string
    }
  }
  error?: string
}

// Timeline 요청 파라미터
export interface TimelineRequest {
  start: string  // YYYY-MM-DD
  end: string    // YYYY-MM-DD
}

// Google Takeout semanticSegments 형식 (실제 데이터 형식)
export interface GoogleTakeoutData {
  semanticSegments?: Array<{
    startTime?: string
    endTime?: string
    timelinePath?: Array<{
      point: string // "37.4797273°, 126.9150743°" 형식
      time: string
    }>
    visit?: {
      topCandidate?: {
        placeId?: string
        probability?: number
      }
      hierarchyLevel?: number
    }
    activities?: Array<{
      activityType?: string
      probability?: number
    }>
  }>
}

// Google Timeline API 원본 응답 (참고용 - timelineObjects 형식)
export interface GoogleTimelineResponse {
  timelineObjects?: Array<{
    activitySegment?: {
      startLocation?: {
        latitudeE7: number
        longitudeE7: number
      }
      endLocation?: {
        latitudeE7: number
        longitudeE7: number
      }
      duration?: {
        startTimestamp: string
        endTimestamp: string
      }
      activityType?: string
      confidence?: string
    }
    placeVisit?: {
      location?: {
        latitudeE7: number
        longitudeE7: number
        address?: string
        name?: string
        placeId?: string
      }
      duration?: {
        startTimestamp: string
        endTimestamp: string
      }
      placeConfidence?: string
    }
  }>
}

// Supabase 저장용 Timeline 데이터 (개선된 스키마)
export interface TimelineData {
  id?: string
  user_id: string
  timeline_date: string // 대표 날짜
  start_date?: string
  end_date?: string
  raw_data: any // 원본 JSON 데이터
  processed_locations?: TimelineLocation[] // 정규화된 위치 데이터
  location_count?: number
  source?: 'google_takeout' | 'simulation' | 'manual_input' | 'unknown'
  metadata?: any // 추가 메타데이터
  data_quality?: any // 데이터 품질 정보
  created_at: string
  updated_at: string
}

// 장소 방문 정보
export interface PlaceVisit {
  id?: string
  timeline_id: string
  user_id: string
  
  // 장소 정보
  place_name?: string
  place_address?: string
  place_id?: string // Google Place ID
  latitude: number
  longitude: number
  
  // 방문 시간 정보
  arrival_time: string
  departure_time?: string
  duration_minutes?: number // 체류 시간 (분)
  
  // 방문 유형 및 신뢰도
  visit_type?: 'home' | 'work' | 'transit' | 'leisure' | 'shopping' | 'dining' | 'unknown'
  confidence_level?: number // 0.0 ~ 1.0
  
  // 이동 정보
  travel_distance_meters?: number // 이전 장소에서의 이동 거리
  travel_duration_minutes?: number // 이동 시간
  travel_mode?: 'walking' | 'driving' | 'transit' | 'cycling' | 'running' | 'unknown'
  
  // 메타데이터
  segment_type?: string
  raw_segment_data?: any
  
  created_at: string
  updated_at: string
}

// 이동 경로 정보
export interface MovementPath {
  id?: string
  timeline_id: string
  user_id: string
  
  // 이동 시간 정보
  start_time: string
  end_time: string
  duration_minutes: number
  
  // 경로 정보
  path_points: Array<{
    lat: number
    lng: number
    time: string
  }>
  total_distance_meters?: number
  average_speed_kmh?: number
  
  // 시작/종료 위치
  start_latitude: number
  start_longitude: number
  end_latitude: number
  end_longitude: number
  
  // 이동 수단 및 신뢰도
  transport_mode?: 'walking' | 'driving' | 'transit' | 'cycling' | 'running' | 'unknown'
  confidence_level?: number
  
  // 메타데이터
  segment_type?: string
  raw_segment_data?: any
  
  created_at: string
  updated_at: string
}

// Timeline 동기화 상태 (사용 안함 - 기존 스키마에서 제거됨)
export interface TimelineSyncStatus {
  id?: string
  user_id: string
  last_sync_date?: string
  last_sync_time: string
  sync_status: 'pending' | 'success' | 'error'
  sync_type?: 'takeout' | 'simulation' | 'manual'
  error_message?: string
  metadata?: any
  created_at: string
  updated_at: string
}

// Timeline API 에러 타입
export interface TimelineApiError {
  code: string
  message: string
  details?: any
}

// 날짜 범위 타입 (기존 useMainPage와 호환)
export type DateRange = 'today' | 'yesterday' | 'week' | 'month' | 'custom'

// Timeline 설정
export interface TimelineSettings {
  autoSync: boolean
  syncInterval: number // 분 단위
  maxHistoryDays: number
  enableLocationSharing: boolean
  preferredDataSource: 'google_takeout' | 'simulation' | 'manual'
  enablePlaceVisitDetection: boolean
  enableMovementPathTracking: boolean
  minimumStayDurationMinutes: number // 장소 방문 인식 최소 체류 시간
}

// 데이터 및 분석 결과
export interface TimelineAnalytics {
  totalLocations: number
  totalPlaceVisits: number
  totalMovementPaths: number
  dateRange: {
    start: string
    end: string
    days: number
  }
  topVisitedPlaces: Array<{
    place_name: string
    visit_count: number
    total_duration_minutes: number
  }>
  movementSummary: {
    total_distance_km: number
    total_travel_time_minutes: number
    most_used_transport_mode: string
  }
  dailyActivity: Array<{
    date: string
    place_visits: number
    movement_paths: number
    total_distance_km: number
  }>
}