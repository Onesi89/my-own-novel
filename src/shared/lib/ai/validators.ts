/**
 * AI 서비스 유효성 검사 함수들
 * FSD: shared/lib/ai
 */

import { StoryPreferences, RouteContext, DEFAULT_TOKEN_LIMITS } from './types'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateStoryPreferences(preferences: StoryPreferences): ValidationResult {
  const errors: string[] = []

  // 장르 검증
  const validGenres = ['SF', 'romance', 'comedy', 'mystery', 'drama', 'adventure']
  if (!validGenres.includes(preferences.genre)) {
    errors.push(`Invalid genre: ${preferences.genre}. Must be one of: ${validGenres.join(', ')}`)
  }

  // 스타일 검증
  const validStyles = ['first_person', 'third_person']
  if (!validStyles.includes(preferences.style)) {
    errors.push(`Invalid style: ${preferences.style}. Must be one of: ${validStyles.join(', ')}`)
  }

  // 톤 검증
  const validTones = ['light', 'serious', 'adventurous', 'mysterious', 'romantic']
  if (!validTones.includes(preferences.tone)) {
    errors.push(`Invalid tone: ${preferences.tone}. Must be one of: ${validTones.join(', ')}`)
  }

  // 길이 검증
  const validLengths = [5000, 6000, 7000]
  if (!validLengths.includes(preferences.length)) {
    errors.push(`Invalid length: ${preferences.length}. Must be one of: ${validLengths.join(', ')}`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateRoutes(routes: RouteContext[]): ValidationResult {
  const errors: string[] = []

  if (!routes || routes.length === 0) {
    errors.push('At least one route is required')
    return { isValid: false, errors }
  }

  if (routes.length > 5) {
    errors.push('Maximum 5 routes allowed')
  }

  routes.forEach((route, index) => {
    if (!route.id) {
      errors.push(`Route ${index + 1}: ID is required`)
    }

    if (!route.address || route.address.trim().length === 0) {
      errors.push(`Route ${index + 1}: Address is required`)
    }

    if (!route.timestamp) {
      errors.push(`Route ${index + 1}: Timestamp is required`)
    } else {
      const date = new Date(route.timestamp)
      if (isNaN(date.getTime())) {
        errors.push(`Route ${index + 1}: Invalid timestamp format`)
      }
    }

    if (route.duration !== undefined) {
      if (route.duration < 0 || route.duration > 1440) { // 0분 ~ 24시간
        errors.push(`Route ${index + 1}: Duration must be between 0 and 1440 minutes`)
      }
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateTokenUsage(
  requestTokens: number,
  userDailyUsage: number,
  monthlyUsage: number
): ValidationResult {
  const errors: string[] = []

  if (requestTokens > DEFAULT_TOKEN_LIMITS.maxTokensPerRequest) {
    errors.push(`Request exceeds maximum tokens: ${requestTokens} > ${DEFAULT_TOKEN_LIMITS.maxTokensPerRequest}`)
  }

  if (userDailyUsage >= DEFAULT_TOKEN_LIMITS.dailyLimitPerUser) {
    errors.push(`Daily limit exceeded: ${userDailyUsage} >= ${DEFAULT_TOKEN_LIMITS.dailyLimitPerUser}`)
  }

  // 월 예산은 달러 기준으로 대략적으로 계산 (1000 토큰 ≈ $0.01)
  const estimatedCost = monthlyUsage * 0.00001
  if (estimatedCost >= DEFAULT_TOKEN_LIMITS.monthlyBudget) {
    errors.push(`Monthly budget exceeded: $${estimatedCost.toFixed(2)} >= $${DEFAULT_TOKEN_LIMITS.monthlyBudget}`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateApiResponse(response: any): ValidationResult {
  const errors: string[] = []

  if (!response) {
    errors.push('Response is null or undefined')
    return { isValid: false, errors }
  }

  if (typeof response.success !== 'boolean') {
    errors.push('Response must have a boolean success field')
  }

  if (response.success && !response.data) {
    errors.push('Successful response must have data')
  }

  if (!response.success && !response.error) {
    errors.push('Failed response must have error message')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}