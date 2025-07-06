/**
 * AI 서비스 유틸리티 함수들
 * FSD: shared/lib/ai
 */

import { RouteContext } from './types'

/**
 * 프롬프트 최적화 - 불필요한 공백 제거 및 압축
 */
export function optimizePrompt(prompt: string): string {
  return prompt
    .replace(/\s+/g, ' ')           // 다중 공백을 단일 공백으로
    .replace(/\n\s*\n/g, '\n')      // 다중 개행을 단일 개행으로
    .trim()                         // 앞뒤 공백 제거
}

/**
 * 경로 데이터 압축 - 토큰 절약을 위한 핵심 정보만 추출
 */
export function compressRouteData(routes: RouteContext[]): RouteContext[] {
  return routes.map(route => ({
    id: route.id,
    address: truncateText(route.address, 50),
    timestamp: route.timestamp,
    duration: route.duration,
    customInfo: route.customInfo ? {
      customName: route.customInfo.customName ? 
        truncateText(route.customInfo.customName, 30) : undefined,
      category: route.customInfo.category,
      description: route.customInfo.description ? 
        truncateText(route.customInfo.description, 100) : undefined
    } : undefined
  }))
}

/**
 * 텍스트 자르기 (토큰 절약)
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * 대략적인 토큰 수 계산 (정확하지 않지만 추정용)
 */
export function estimateTokenCount(text: string): number {
  // 영어: 대략 4글자당 1토큰
  // 한글: 대략 2글자당 1토큰
  const englishChars = (text.match(/[a-zA-Z]/g) || []).length
  const koreanChars = (text.match(/[가-힣]/g) || []).length
  const otherChars = text.length - englishChars - koreanChars
  
  return Math.ceil(
    englishChars / 4 + 
    koreanChars / 2 + 
    otherChars / 3
  )
}

/**
 * 경로 데이터를 자연어로 변환
 */
export function routesToNaturalLanguage(routes: RouteContext[]): string {
  return routes.map((route, index) => {
    const time = new Date(route.timestamp).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    const name = route.customInfo?.customName || route.address
    const duration = route.duration ? `${route.duration}분간 머무름` : ''
    const description = route.customInfo?.description || ''
    
    let result = `${index + 1}. ${time}에 ${name}`
    if (duration) result += ` (${duration})`
    if (description) result += ` - ${description}`
    
    return result
  }).join('\n')
}

/**
 * 재시도 로직 (지수 백오프)
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt === maxRetries - 1) {
        throw lastError
      }
      
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

/**
 * 소설 길이 추정 (글자 수 기준)
 */
export function estimateReadingTime(wordCount: number): number {
  // 한국어 기준: 분당 약 300-400자 읽기 가능
  const wordsPerMinute = 350
  return Math.ceil(wordCount / wordsPerMinute)
}

/**
 * 응답 시간 측정 데코레이터
 */
export function measureResponseTime<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now()
    try {
      const result = await fn(...args)
      const endTime = Date.now()
      
      console.log(`AI API call completed in ${endTime - startTime}ms`)
      return result
    } catch (error) {
      const endTime = Date.now()
      console.error(`AI API call failed after ${endTime - startTime}ms:`, error)
      throw error
    }
  }) as T
}

/**
 * 프롬프트 템플릿 헬퍼
 */
export function buildPromptTemplate(
  template: string,
  variables: Record<string, string | number>
): string {
  let result = template
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`
    result = result.replace(new RegExp(placeholder, 'g'), String(value))
  })
  
  return result
}

/**
 * 안전한 JSON 파싱
 */
export function safeJsonParse<T>(text: string, defaultValue: T): T {
  try {
    return JSON.parse(text)
  } catch {
    return defaultValue
  }
}

/**
 * 토큰 비용 계산 (provider별 요금제 기준)
 */
export function calculateTokenCost(
  tokenUsage: {
    prompt: number
    completion: number
    total?: number
  },
  provider: 'claude' | 'gemini' = 'gemini'
): number {
  if (provider === 'gemini') {
    // Gemini 2.5 Flash 기준 (2024년 12월)
    const PROMPT_COST_PER_1M = 0.075    // $0.075 per 1M input tokens
    const COMPLETION_COST_PER_1M = 0.30  // $0.30 per 1M output tokens
    
    const promptCost = (tokenUsage.prompt / 1_000_000) * PROMPT_COST_PER_1M
    const completionCost = (tokenUsage.completion / 1_000_000) * COMPLETION_COST_PER_1M
    
    return promptCost + completionCost
  } else {
    // Claude 3.5 Sonnet 기준 (2024년 12월)
    const PROMPT_COST_PER_1K = 0.003    // $0.003 per 1K input tokens
    const COMPLETION_COST_PER_1K = 0.015 // $0.015 per 1K output tokens
    
    const promptCost = (tokenUsage.prompt / 1000) * PROMPT_COST_PER_1K
    const completionCost = (tokenUsage.completion / 1000) * COMPLETION_COST_PER_1K
    
    return promptCost + completionCost
  }
}