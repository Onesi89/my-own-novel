/**
 * Timeline API Client
 * FSD: features/timeline/api
 * 
 * Google Timeline API와의 클라이언트 사이드 통신
 */

import { TimelineApiResponse, TimelineRequest, TimelineLocation } from '../types'

/**
 * Google Takeout 파일 업로드
 */
export async function uploadGoogleTakeoutFile(file: File): Promise<TimelineApiResponse> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/timeline/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }))
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const data: TimelineApiResponse = await response.json()
    return data

  } catch (error) {
    console.error('Google Takeout 업로드 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '파일 업로드 중 오류가 발생했습니다.'
    }
  }
}

/**
 * Timeline 데이터 가져오기
 */
export async function fetchTimelineData({
  start,
  end
}: TimelineRequest): Promise<TimelineApiResponse> {
  try {
    const params = new URLSearchParams({
      start,
      end
    })

    const response = await fetch(`/api/timeline?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }))
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const data: TimelineApiResponse = await response.json()
    return data

  } catch (error) {
    console.error('Timeline API 호출 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.'
    }
  }
}

/**
 * 날짜 범위를 API 요청 형식으로 변환
 */
export function getDateRangeForRequest(range: 'today' | 'yesterday' | 'week' | 'month' | 'custom', customStart?: string, customEnd?: string): { start: string; end: string } {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const formatDate = (date: Date) => date.toISOString().split('T')[0]

  switch (range) {
    case 'today':
      return {
        start: formatDate(today),
        end: formatDate(today)
      }
    
    case 'yesterday':
      return {
        start: formatDate(yesterday),
        end: formatDate(yesterday)
      }
    
    case 'week':
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - 7)
      return {
        start: formatDate(weekStart),
        end: formatDate(today)
      }
    
    case 'month':
      const monthStart = new Date(today)
      monthStart.setDate(today.getDate() - 30)
      return {
        start: formatDate(monthStart),
        end: formatDate(today)
      }
    
    case 'custom':
      if (!customStart || !customEnd) {
        throw new Error('Custom 범위 사용 시 시작일과 종료일을 제공해야 합니다.')
      }
      return {
        start: customStart,
        end: customEnd
      }
    
    default:
      return {
        start: formatDate(today),
        end: formatDate(today)
      }
  }
}

/**
 * Timeline 데이터 유효성 검사
 */
export function validateTimelineData(locations: TimelineLocation[]): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!Array.isArray(locations)) {
    errors.push('위치 데이터가 배열 형식이 아닙니다.')
    return { isValid: false, errors }
  }

  if (locations.length === 0) {
    errors.push('위치 데이터가 비어있습니다.')
    return { isValid: false, errors }
  }

  locations.forEach((location, index) => {
    if (!location.id) {
      errors.push(`위치 ${index + 1}: ID가 누락되었습니다.`)
    }
    
    if (typeof location.latitude !== 'number' || isNaN(location.latitude)) {
      errors.push(`위치 ${index + 1}: 위도가 올바르지 않습니다.`)
    }
    
    if (typeof location.longitude !== 'number' || isNaN(location.longitude)) {
      errors.push(`위치 ${index + 1}: 경도가 올바르지 않습니다.`)
    }
    
    if (!location.timestamp || isNaN(new Date(location.timestamp).getTime())) {
      errors.push(`위치 ${index + 1}: 타임스탬프가 올바르지 않습니다.`)
    }
    
    // 위도 범위 검사 (-90 ~ 90)
    if (location.latitude < -90 || location.latitude > 90) {
      errors.push(`위치 ${index + 1}: 위도가 유효 범위를 벗어났습니다. (-90 ~ 90)`)
    }
    
    // 경도 범위 검사 (-180 ~ 180)
    if (location.longitude < -180 || location.longitude > 180) {
      errors.push(`위치 ${index + 1}: 경도가 유효 범위를 벗어났습니다. (-180 ~ 180)`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Timeline 데이터 통계 계산
 */
export function calculateTimelineStats(locations: TimelineLocation[]) {
  if (locations.length === 0) {
    return {
      totalLocations: 0,
      uniqueDays: 0,
      timeSpan: 0,
      averageAccuracy: 0
    }
  }

  const timestamps = locations.map(loc => new Date(loc.timestamp).getTime())
  const uniqueDays = new Set(
    locations.map(loc => new Date(loc.timestamp).toDateString())
  ).size

  const timeSpan = Math.max(...timestamps) - Math.min(...timestamps)
  const accuracies = locations.filter(loc => loc.accuracy).map(loc => loc.accuracy!)
  const averageAccuracy = accuracies.length > 0 
    ? accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length 
    : 0

  return {
    totalLocations: locations.length,
    uniqueDays,
    timeSpan, // milliseconds
    averageAccuracy: Math.round(averageAccuracy)
  }
}