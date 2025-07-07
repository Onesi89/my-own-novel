/**
 * 최적화된 AI 서비스
 * FSD: shared/lib/ai/optimization
 */

import { createCache, CacheConfig } from './cache'
import { createCompressor, CompressionConfig } from './compression'
import { createChoiceStrategy, ChoiceConfig } from './choices'
import { 
  OptimizationConfig, 
  OptimizedAIResponse, 
  CacheStrategy, 
  CompressionStrategy, 
  ChoiceStrategy,
  RouteContext,
  StoryPreferences
} from './types'
import { GeminiProvider } from '../geminiProvider'
import { ClaudeProvider } from '../claudeProvider'

export class OptimizedAIService {
  private cache: CacheStrategy
  private compressor: CompressionStrategy
  private choiceStrategy: ChoiceStrategy
  private config: OptimizationConfig

  constructor(config: OptimizationConfig) {
    this.config = config
    this.initializeModules()
  }

  private initializeModules(): void {
    // 캐시 초기화
    if (this.config.cache?.enabled) {
      const cacheConfig: CacheConfig = {
        memory: {
          enabled: true,
          ttl: this.config.cache.memoryTtl || 60000, // 1분
          maxSize: this.config.cache.maxMemorySize || 100
        },
        db: {
          enabled: true,
          ttl: this.config.cache.dbTtl || 24 // 24시간
        }
      }
      this.cache = createCache(cacheConfig)
    }

    // 압축 초기화
    if (this.config.compression?.enabled) {
      const compressionConfig: CompressionConfig = {
        targetReduction: this.config.compression.targetReduction || 30,
        preserveQuality: this.config.compression.preserveQuality ?? true,
        minQualityScore: 0.7
      }
      this.compressor = createCompressor(compressionConfig)
    }

    // 선택지 제한 초기화
    if (this.config.choices?.enabled) {
      const choiceConfig: ChoiceConfig = {
        maxChoices: this.config.choices.maxChoices || 3,
        enforceLimit: this.config.choices.enforceLimit ?? true,
        qualityThreshold: 0.8
      }
      this.choiceStrategy = createChoiceStrategy(choiceConfig)
    }
  }

  async generateStory(
    routes: RouteContext[],
    preferences: StoryPreferences,
    userId?: string
  ): Promise<OptimizedAIResponse> {
    const startTime = Date.now()
    let originalTokens = 0
    let finalTokens = 0
    let cacheHit = false
    let tokensSaved = 0
    let costSaved = 0
    let compressionRatio = 0
    let choicesLimited = false
    let provider = this.selectProvider(preferences)

    try {
      // 1. 프롬프트 생성
      let prompt = this.generatePrompt(routes, preferences)
      originalTokens = this.estimateTokens(prompt)

      // 2. 캐시 확인
      const cacheKey = this.generateCacheKey(prompt, preferences, provider)
      let cachedResponse = null
      
      if (this.cache) {
        cachedResponse = await this.cache.get(cacheKey)
        if (cachedResponse) {
          cacheHit = true
          tokensSaved = cachedResponse.tokenUsage.total
          costSaved = this.estimateCost(tokensSaved, provider)
          
          return {
            ...cachedResponse,
            optimization: {
              cacheHit,
              tokensSaved,
              costSaved,
              compressionRatio: 0,
              choicesLimited: false,
              originalTokens,
              finalTokens: cachedResponse.tokenUsage.total,
              provider
            }
          } as OptimizedAIResponse
        }
      }

      // 3. 프롬프트 압축
      if (this.compressor) {
        const targetReduction = this.config.compression?.targetReduction || 30
        const compressed = await this.compressor.compress(prompt, targetReduction)
        prompt = compressed.compressed
        compressionRatio = compressed.compressionRatio
        finalTokens = this.estimateTokens(prompt)
        tokensSaved += compressed.tokensSaved
      } else {
        finalTokens = originalTokens
      }

      // 4. 선택지 제한을 위한 구조화된 프롬프트 생성
      if (this.choiceStrategy) {
        const maxChoices = this.config.choices?.maxChoices || 3
        prompt = this.choiceStrategy.generateStructuredPrompt(routes, preferences, maxChoices)
        finalTokens = this.estimateTokens(prompt)
      }

      // 5. AI 호출
      const aiResponse = await this.callAIProvider(prompt, provider)
      
      // 6. 선택지 제한 후처리
      if (this.choiceStrategy && this.config.choices?.enforceLimit) {
        const maxChoices = this.config.choices.maxChoices || 3
        const limitedChoices = await this.choiceStrategy.limitChoices(aiResponse, maxChoices)
        
        if (limitedChoices.limitedCount < limitedChoices.originalCount) {
          choicesLimited = true
          aiResponse.choices = limitedChoices.choices
        }
      }

      // 7. 캐시 저장
      if (this.cache) {
        const cacheValue = {
          content: aiResponse.content,
          choices: aiResponse.choices || [],
          tokenUsage: aiResponse.tokenUsage,
          timestamp: Date.now(),
          provider,
          quality: 1.0
        }
        await this.cache.set(cacheKey, cacheValue)
      }

      // 8. 최종 응답 생성
      costSaved = this.estimateCost(tokensSaved, provider)
      
      return {
        ...aiResponse,
        optimization: {
          cacheHit,
          tokensSaved,
          costSaved,
          compressionRatio,
          choicesLimited,
          originalTokens,
          finalTokens,
          provider
        }
      } as OptimizedAIResponse

    } catch (error) {
      console.error('OptimizedAIService error:', error)
      throw error
    }
  }

  private generatePrompt(routes: RouteContext[], preferences: StoryPreferences): string {
    // 기본 프롬프트 생성 로직
    const context = routes.map(route => `${route.story} → ${route.choice || ''}`).join('\n')
    
    return `
장르: ${preferences.genre || '일반'}
스타일: ${preferences.style || '현실적'}
분위기: ${preferences.mood || '중립'}

지금까지의 이야기:
${context}

다음 이야기를 생성하고 3개의 선택지를 제공해주세요.
    `.trim()
  }

  private selectProvider(preferences: StoryPreferences): 'gemini' | 'claude' {
    if (this.config.cost?.preferredProvider && this.config.cost.preferredProvider !== 'auto') {
      return this.config.cost.preferredProvider
    }

    // 자동 선택 로직
    const genre = preferences.genre?.toLowerCase()
    const style = preferences.style?.toLowerCase()

    // 판타지/SF는 Claude가 더 창의적
    if (genre?.includes('판타지') || genre?.includes('sf') || genre?.includes('공상과학')) {
      return 'claude'
    }

    // 현실적/로맨스는 Gemini가 더 자연스러움
    if (style?.includes('현실') || genre?.includes('로맨스')) {
      return 'gemini'
    }

    // 기본값: 비용이 저렴한 Gemini
    return 'gemini'
  }

  private async callAIProvider(prompt: string, provider: 'gemini' | 'claude'): Promise<any> {
    if (provider === 'claude') {
      const claudeProvider = new ClaudeProvider(process.env.CLAUDE_API_KEY)
      // Convert prompt to simple story generation context
      const context = {
        routes: [], // Will be filled by actual implementation
        preferences: { genre: 'adventure' as const, style: 'first_person' as const, tone: 'adventurous' as const, length: 5000 as const }
      }
      return await claudeProvider.generateStory(context)
    } else {
      const geminiProvider = new GeminiProvider(process.env.GEMINI_API_KEY)
      // Convert prompt to simple story generation context
      const context = {
        routes: [], // Will be filled by actual implementation
        preferences: { genre: 'adventure' as const, style: 'first_person' as const, tone: 'adventurous' as const, length: 5000 as const }
      }
      return await geminiProvider.generateStory(context)
    }
  }

  private generateCacheKey(
    prompt: string, 
    preferences: StoryPreferences, 
    provider: string
  ): string {
    const key = `${provider}:${preferences.genre || ''}:${preferences.style || ''}:${prompt}`
    return this.hashString(key)
  }

  private hashString(str: string): string {
    // 간단한 해시 함수 (실제로는 crypto.createHash 사용)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 32비트 정수로 변환
    }
    return hash.toString(36)
  }

  private estimateTokens(text: string): number {
    // 간단한 토큰 추정 (실제로는 tokenEstimator 사용)
    return Math.ceil(text.length / 3)
  }

  private estimateCost(tokens: number, provider: string): number {
    const prices = {
      gemini: 0.00015,  // per 1k tokens
      claude: 0.003
    }
    
    return (tokens / 1000) * prices[provider as keyof typeof prices]
  }

  // 통계 조회
  async getOptimizationStats(): Promise<any> {
    const stats = {
      cache: this.cache ? await this.cache.getStats() : null,
      compression: {
        enabled: this.config.compression?.enabled || false,
        targetReduction: this.config.compression?.targetReduction || 0
      },
      choices: {
        enabled: this.config.choices?.enabled || false,
        maxChoices: this.config.choices?.maxChoices || 0
      }
    }
    
    return stats
  }

  // 캐시 클리어
  async clearCache(): Promise<void> {
    if (this.cache) {
      await this.cache.clear()
    }
  }
}