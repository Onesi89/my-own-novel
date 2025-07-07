/**
 * 프롬프트 압축 모듈
 * FSD: shared/lib/ai/optimization/compression
 */

export { PromptCompressor } from './promptCompressor'
export { TokenEstimator } from './tokenEstimator'
export { QualityValidator } from './qualityValidator'

import { PromptCompressor } from './promptCompressor'
import { TokenEstimator } from './tokenEstimator'
import { QualityValidator } from './qualityValidator'
import { CompressionStrategy } from '../types'

export interface CompressionConfig {
  targetReduction: number  // 목표 압축률 (0-100)
  preserveQuality: boolean
  minQualityScore: number  // 최소 품질 점수 (0-1)
}

export function createCompressor(config: CompressionConfig): CompressionStrategy {
  const tokenEstimator = new TokenEstimator()
  const qualityValidator = new QualityValidator()
  
  return new PromptCompressor(tokenEstimator, qualityValidator, config)
}