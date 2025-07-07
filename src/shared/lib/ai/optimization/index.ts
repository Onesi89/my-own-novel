/**
 * AI 최적화 모듈 메인 인덱스
 * FSD: shared/lib/ai/optimization
 */

export { OptimizedAIService } from './optimizedAIService'
export * from './types'
export * from './cache'
export * from './compression'
export * from './choices'

import { OptimizedAIService } from './optimizedAIService'
import { OptimizationConfig } from './types'

// 기본 설정
export const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  cache: {
    enabled: true,
    memoryTtl: 60000, // 1분
    dbTtl: 24, // 24시간
    maxMemorySize: 100
  },
  compression: {
    enabled: true,
    targetReduction: 30, // 30% 압축
    preserveQuality: true
  },
  choices: {
    enabled: true,
    maxChoices: 3,
    enforceLimit: true
  },
  cost: {
    enabled: true,
    preferredProvider: 'auto'
  }
}

// 팩토리 함수
export function createOptimizedAIService(config?: Partial<OptimizationConfig>): OptimizedAIService {
  const finalConfig = { ...DEFAULT_OPTIMIZATION_CONFIG, ...config }
  return new OptimizedAIService(finalConfig)
}

// 개발 환경용 설정
export const DEVELOPMENT_CONFIG: OptimizationConfig = {
  cache: {
    enabled: true,
    memoryTtl: 30000, // 30초
    dbTtl: 1, // 1시간
    maxMemorySize: 50
  },
  compression: {
    enabled: false, // 개발 시 비활성화
    targetReduction: 0,
    preserveQuality: true
  },
  choices: {
    enabled: true,
    maxChoices: 3,
    enforceLimit: false // 개발 시 유연하게
  },
  cost: {
    enabled: false, // 개발 시 비활성화
    preferredProvider: 'gemini'
  }
}

// 프로덕션 환경용 설정
export const PRODUCTION_CONFIG: OptimizationConfig = {
  cache: {
    enabled: true,
    memoryTtl: 120000, // 2분
    dbTtl: 48, // 48시간
    maxMemorySize: 200
  },
  compression: {
    enabled: true,
    targetReduction: 40, // 더 높은 압축률
    preserveQuality: true
  },
  choices: {
    enabled: true,
    maxChoices: 3, // 더 제한적
    enforceLimit: true
  },
  cost: {
    enabled: true,
    maxDailyCost: 10.0, // $10 일일 한도
    preferredProvider: 'auto'
  }
}