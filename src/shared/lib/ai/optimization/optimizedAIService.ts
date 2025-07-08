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
  ): Promise<any> {
    const startTime = Date.now()
    let originalTokens = 0
    let finalTokens = 0
    let cacheHit = false
    let tokensSaved = 0
    let costSaved = 0
    const compressionRatio = 0
    let choicesLimited = false
    const provider = this.selectProvider(preferences)

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
            success: true,
            data: {
              content: cachedResponse.content,
              choices: cachedResponse.choices
            },
            tokenUsage: cachedResponse.tokenUsage,
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
          }
        }
      }

      // 3. 프롬프트 압축 (소설 생성시에는 압축하지 않음)
      // 소설 생성시에는 품질이 중요하므로 압축 비활성화
      finalTokens = originalTokens

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
        success: true,
        data: {
          content: aiResponse.content || aiResponse.data?.content,
          choices: aiResponse.choices || aiResponse.data?.choices || []
        },
        tokenUsage: aiResponse.tokenUsage || {
          prompt: finalTokens,
          completion: 0,
          total: finalTokens
        },
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
      }

    } catch (error) {
      console.error('OptimizedAIService error:', error)
      throw error
    }
  }

  private generatePrompt(routes: RouteContext[], preferences: StoryPreferences): string {
    // 구조화된 프롬프트 생성기를 사용하여 마크업 포함 프롬프트 생성
    if (this.choiceStrategy) {
      return this.choiceStrategy.generateStructuredPrompt(routes, preferences, 3)
    }
    
    // 폴백: 기본 프롬프트 (마크업 포함)
    const context = routes.map((route, index) => `${index + 1}. ${route.story || route.address} → ${route.choice || ''}`).join('\n')
    const genreMarker = this.getGenreMarkerFallback(preferences.genre)
    
    return `
당신은 소설 작가입니다. 마크다운 형식으로 응답해주세요.

## 스토리 설정
- 장르: ${preferences.genre || '일반'}
- 스타일: ${preferences.style || '현실적'}
- 분위기: ${preferences.mood || '중립'}

## 현재 스토리 맥락
지금까지의 이야기:
${context}

## 마크다운 형식 응답
### 이야기 전개
[다음 전개를 150-300자로 작성]

## ${genreMarker} 질문
어떤 행동을 하시겠습니까?

### 선택지
1. **선택지 제목** - 선택지 설명
2. **선택지 제목** - 선택지 설명  
3. **선택지 제목** - 선택지 설명

반드시 마크다운 형식을 사용하여 응답하세요.
    `.trim()
  }

  private selectProvider(preferences: StoryPreferences): 'gemini' | 'claude' {
    // 현재는 Gemini만 사용
    return 'gemini'
  }

  private async callAIProvider(prompt: string, provider: 'gemini' | 'claude'): Promise<any> {
    // Parse context from structured prompt
    const routesMatch = prompt.match(/지금까지의 이야기:\n([\s\S]*?)(?=\n\n다음|$)/)
    const genreMatch = prompt.match(/장르:\s*(.+)/)
    const styleMatch = prompt.match(/스타일:\s*(.+)/)
    const moodMatch = prompt.match(/분위기:\s*(.+)/)
    
    const parsedRoutes: RouteContext[] = []
    if (routesMatch && routesMatch[1]) {
      const routeLines = routesMatch[1].split('\n').filter(line => line.trim())
      routeLines.forEach((line, index) => {
        const storyMatch = line.match(/\d+\.\s*(.+?)(?=\s*선택:|$)/)
        const choiceMatch = line.match(/선택:\s*(.+)/)
        if (storyMatch) {
          parsedRoutes.push({
            id: `route-${index}`,
            address: storyMatch[1].trim(),
            timestamp: new Date().toISOString(),
            story: storyMatch[1].trim(),
            choice: choiceMatch ? choiceMatch[1].trim() : undefined
          })
        }
      })
    }
    
    const context = {
      routes: parsedRoutes,
      preferences: {
        genre: (genreMatch?.[1] || 'adventure') as any,
        style: (styleMatch?.[1] || 'first_person') as any,
        tone: (moodMatch?.[1] || 'adventurous') as any,
        length: 5000 as const
      }
    }

    if (provider === 'claude') {
      const claudeProvider = new ClaudeProvider(process.env.CLAUDE_API_KEY)
      return await claudeProvider.generateStory(context)
    } else {
      const geminiProvider = new GeminiProvider(process.env.GEMINI_API_KEY)
      return await geminiProvider.generateStory(context)
    }
  }

  private generateCacheKey(
    prompt: string, 
    preferences: StoryPreferences, 
    provider: string
  ): string {
    // 핵심 요소들만 추출해서 캐시 키 생성
    const normalizedPrompt = this.normalizePrompt(prompt)
    const contextHash = this.extractContextHash(prompt)
    
    const key = [
      provider,
      preferences.genre || 'default',
      preferences.style || 'default', 
      preferences.mood || 'default',
      contextHash, // 이전 스토리 맥락의 해시
      normalizedPrompt // 정규화된 프롬프트
    ].join(':')
    
    return this.hashString(key)
  }

  private normalizePrompt(prompt: string): string {
    // 프롬프트에서 가변적인 부분 제거하고 핵심 구조만 추출
    return prompt
      .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, 'TIMESTAMP') // 타임스탬프 정규화
      .replace(/route-\d+/g, 'ROUTE_ID') // 라우트 ID 정규화
      .replace(/\s+/g, ' ') // 공백 정규화
      .trim()
  }

  private extractContextHash(prompt: string): string {
    // 이전 스토리 맥락 추출
    const contextMatch = prompt.match(/지금까지의 이야기:\n([\s\S]*?)(?=\n\n|$)/)
    if (!contextMatch) return 'no-context'
    
    const context = contextMatch[1]
    // 스토리 순서와 선택지만 추출 (세부 내용은 제외)
    const storyStructure = context
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        // "1. 이야기내용 → 선택: 선택내용" 형태에서 구조만 추출
        const match = line.match(/(\d+)\.\s*(.{0,50}).*?선택:\s*(.{0,30})/)
        return match ? `${match[1]}:${match[2].slice(0,20)}:${match[3].slice(0,15)}` : line.slice(0,30)
      })
      .join('|')
    
    return this.hashString(storyStructure)
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

  private getGenreMarkerFallback(genre?: string): string {
    const markers = {
      'SF': '🚀',
      'romance': '💕',
      'comedy': '😄', 
      'mystery': '🔍',
      'drama': '🎭',
      'adventure': '⚔️',
      'horror': '👻',
      'fantasy': '🔮',
      '판타지': '🔮',
      '로맨스': '💕',
      '코미디': '😄',
      '미스터리': '🔍',
      '드라마': '🎭',
      '모험': '⚔️',
      '공포': '👻',
      '일반': '📖'
    }
    
    return markers[genre || '일반'] || '📖'
  }
}