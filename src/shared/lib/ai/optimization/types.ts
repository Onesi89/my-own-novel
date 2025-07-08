/**
 * AI 최적화 모듈 타입 정의
 * FSD: shared/lib/ai/optimization
 */

import { AIResponse } from '../types'

// Re-export types that might be in different modules
export interface RouteContext {
  id: string
  address: string
  timestamp: string
  duration?: number
  customInfo?: {
    customName?: string
    category: string
    description?: string
  }
  story?: string
  choice?: string
}

export interface StoryPreferences {
  genre?: string
  style?: string
  mood?: string
  theme?: string
}

export interface OptimizationConfig {
  cache?: {
    enabled: boolean
    memoryTtl?: number  // milliseconds
    dbTtl?: number      // hours
    maxMemorySize?: number
  }
  compression?: {
    enabled: boolean
    targetReduction?: number  // percentage (0-100)
    preserveQuality?: boolean
  }
  choices?: {
    enabled: boolean
    maxChoices: 2 | 3
    enforceLimit?: boolean
  }
  cost?: {
    enabled: boolean
    maxDailyCost?: number
    preferredProvider?: 'gemini' | 'claude' | 'auto'
  }
}

export interface OptimizedAIResponse extends AIResponse {
  optimization: {
    cacheHit: boolean
    tokensSaved: number
    costSaved: number
    compressionRatio: number
    choicesLimited: boolean
    originalTokens: number
    finalTokens: number
    provider: string
  }
}

export interface CacheStrategy {
  get(key: string): Promise<CachedResponse | null>
  set(key: string, value: CachedResponse, ttl?: number): Promise<void>
  clear(): Promise<void>
  getStats(): Promise<CacheStats>
}

export interface CachedResponse {
  content: string
  choices: any[]
  tokenUsage: {
    prompt: number
    completion: number
    total: number
  }
  timestamp: number
  provider: string
  quality: number
}

export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  size: number
}

export interface CompressionStrategy {
  compress(prompt: string, targetReduction: number): Promise<CompressedPrompt>
  estimateTokens(text: string): number
  validateQuality(original: string, compressed: string): Promise<QualityScore>
}

export interface CompressedPrompt {
  original: string
  compressed: string
  tokensSaved: number
  compressionRatio: number
  quality: number
}

export interface QualityScore {
  score: number  // 0-1
  metrics: {
    semanticSimilarity: number
    keywordPreservation: number
    structureIntegrity: number
  }
}

export interface ChoiceStrategy {
  limitChoices(aiResponse: any, maxChoices: number): Promise<LimitedChoices>
  generateStructuredPrompt(
    routes: RouteContext[], 
    preferences: StoryPreferences,
    choiceLimit: number
  ): string
  validateChoices(choices: any[]): boolean
}

export interface LimitedChoices {
  originalCount: number
  limitedCount: number
  choices: any[]
  removed: any[]
  quality: number
}

export interface CostStrategy {
  selectProvider(
    prompt: string, 
    preferences: StoryPreferences
  ): Promise<ProviderSelection>
  predictCost(prompt: string, provider: string): Promise<number>
  checkBudget(userId: string): Promise<BudgetStatus>
}

export interface ProviderSelection {
  provider: 'gemini' | 'claude'
  reasoning: string
  estimatedCost: number
  estimatedQuality: number
}

export interface BudgetStatus {
  used: number
  limit: number
  remaining: number
  canProceed: boolean
}