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
    userId?: string,
    previousChoices?: Array<{ question: string; choice: string }>
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
      // 1. 프롬프트 생성 (이전 선택지 포함)
      let prompt = this.generatePrompt(routes, preferences, previousChoices)
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
        prompt = this.choiceStrategy.generateStructuredPrompt(routes, preferences, maxChoices, previousChoices)
        finalTokens = this.estimateTokens(prompt)
      }

      // 5. AI 호출
      const aiResponse = await this.callAIProvider(prompt, provider, previousChoices)
      
      // 6. 선택지 제한 후처리
      if (this.choiceStrategy && this.config.choices?.enforceLimit) {
        const maxChoices = this.config.choices.maxChoices || 3
        const limitedChoices = await this.choiceStrategy.limitChoices(aiResponse, maxChoices)
        
        if (limitedChoices.limitedCount < limitedChoices.originalCount) {
          choicesLimited = true
          aiResponse.choices = limitedChoices.choices
        }
      }

      // 7. 캐시 저장 전 품질 검증
      if (this.cache) {
        const responseToValidate = {
          content: aiResponse.content || aiResponse.data?.content,
          choices: aiResponse.choices || aiResponse.data?.choices || []
        }
        
        const isHighQuality = await this.validateResponseQuality(responseToValidate)
        
        if (isHighQuality) {
          const qualityScore = this.calculateQualityScore(responseToValidate)
          const cacheValue = {
            content: responseToValidate.content,
            choices: responseToValidate.choices,
            tokenUsage: aiResponse.tokenUsage,
            timestamp: Date.now(),
            provider,
            quality: qualityScore
          }
          await this.cache.set(cacheKey, cacheValue)
          console.log('High quality response cached with score:', qualityScore)
        } else {
          console.warn('Response quality too low, skipping cache')
        }
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

  private generatePrompt(
    routes: RouteContext[], 
    preferences: StoryPreferences,
    previousChoices?: Array<{ question: string; choice: string }>
  ): string {
    // 구조화된 프롬프트 생성기가 없으면 생성
    if (!this.choiceStrategy) {
      const choiceConfig = {
        maxChoices: 3 as 2 | 3,
        enforceLimit: true,
        qualityThreshold: 0.8
      }
      this.choiceStrategy = createChoiceStrategy(choiceConfig)
    }
    
    // 항상 구조화된 프롬프트 사용 (이전 선택지 포함)
    const maxChoices = this.config.choices?.maxChoices || (3 as 2 | 3)
    return this.choiceStrategy.generateStructuredPrompt(routes, preferences, maxChoices, previousChoices)
  }

  private selectProvider(preferences: StoryPreferences): 'gemini' | 'claude' {
    // 현재는 Gemini만 사용
    return 'gemini'
  }

  private async callAIProvider(prompt: string, provider: 'gemini' | 'claude', previousChoices?: Array<{ question: string; choice: string }>): Promise<any> {
    try {
      // 프롬프트에서 컨텍스트 정보 추출
      const contextData = this.extractContextFromPrompt(prompt, previousChoices)
      
      if (provider === 'claude') {
        const claudeProvider = new ClaudeProvider(process.env.CLAUDE_API_KEY)
        return await claudeProvider.generateStory(contextData)
      } else {
        const geminiProvider = new GeminiProvider(process.env.GEMINI_API_KEY)
        const response = await geminiProvider.generateStory(contextData, previousChoices)
        
        // 응답 검증
        if (!response.success || !response.data?.content) {
          throw new Error('Invalid AI response')
        }
        
        return response
      }
    } catch (error) {
      console.error(`${provider} AI call failed:`, error)
      throw error
    }
  }

  // 프롬프트에서 컨텍스트 추출하는 헬퍼 메서드
  private extractContextFromPrompt(prompt: string, previousChoices?: Array<{ question: string; choice: string }>): any {
    // 장르 추출
    const genreMatch = prompt.match(/\*\*장르\*\*:\s*(.+)/)
    const styleMatch = prompt.match(/\*\*시점\*\*:\s*(.+)/)
    const moodMatch = prompt.match(/\*\*분위기\*\*:\s*(.+)/)
    
    // 경로 정보 추출
    const routesSection = prompt.match(/## 📖 현재까지의 이야기\n([\s\S]*?)(?=\n##|$)/)
    const routes: RouteContext[] = []
    
    if (routesSection) {
      const routeLines = routesSection[1].trim().split('\n\n')
      routeLines.forEach((line, index) => {
        const match = line.match(/\d+\.\s*(.+?)\n\s*선택:\s*(.+)/)
        if (match) {
          routes.push({
            id: `route-${index}`,
            address: `장소 ${index + 1}`,
            timestamp: new Date().toISOString(),
            story: match[1].trim(),
            choice: match[2].trim()
          })
        }
      })
    }
    
    // 기본 경로가 없으면 추가
    if (routes.length === 0) {
      routes.push({
        id: 'route-0',
        address: '시작 지점',
        timestamp: new Date().toISOString(),
        story: '새로운 이야기의 시작'
      })
    }
    
    return {
      routes,
      preferences: {
        genre: (genreMatch?.[1] || 'adventure') as any,
        style: styleMatch?.[1]?.includes('1인칭') ? 'first_person' : 'third_person' as any,
        tone: (moodMatch?.[1] || 'neutral') as any,
        length: 5000
      }
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

  // 응답 품질 검증
  private async validateResponseQuality(response: any): Promise<boolean> {
    // 1. 최소 길이 검증
    if (!response.content || response.content.length < 1000) {
      console.warn('Response too short:', response.content?.length || 0)
      return false
    }
    
    // 2. 선택지 존재 및 품질 검증
    if (!response.choices || response.choices.length === 0) {
      console.warn('No choices found in response')
      return false
    }
    
    // 3. 각 선택지의 완성도 검증
    for (const choice of response.choices) {
      if (!choice.location || !choice.question) {
        console.warn('Invalid choice structure:', choice)
        return false
      }
      
      if (!choice.options || choice.options.length < 2) {
        console.warn('Insufficient options in choice:', choice)
        return false
      }
      
      // 각 옵션의 품질 검증
      for (const option of choice.options) {
        if (!option.text || option.text.length < 5) {
          console.warn('Option text too short:', option)
          return false
        }
      }
    }
    
    // 4. 마크다운 형식 검증
    const hasTitle = response.content.includes('#')
    const hasLocation = response.content.includes('## 📍')
    const hasChoiceSection = response.content.match(/### [🚀💕😄🔍🎭⚔️👻🔮📖]/)
    
    if (!hasTitle || !hasLocation || !hasChoiceSection) {
      console.warn('Missing required markdown structure')
      return false
    }
    
    // 5. 콘텐츠 품질 점수 계산
    const qualityScore = this.calculateQualityScore(response)
    if (qualityScore < 0.7) {
      console.warn('Low quality score:', qualityScore)
      return false
    }
    
    return true
  }

  // 품질 점수 계산
  private calculateQualityScore(response: any): number {
    let score = 0
    
    // 길이 점수 (0-0.3)
    const lengthScore = Math.min(response.content.length / 3000, 1) * 0.3
    score += lengthScore
    
    // 선택지 완성도 (0-0.3)
    const avgOptionsPerChoice = response.choices.reduce((sum: number, c: any) => 
      sum + (c.options?.length || 0), 0) / (response.choices.length || 1)
    const choiceScore = Math.min(avgOptionsPerChoice / 3, 1) * 0.3
    score += choiceScore
    
    // 마크다운 구조 완성도 (0-0.2)
    const markdownElements = [
      response.content.includes('# '),
      response.content.includes('## 📍'),
      response.content.includes('### '),
      response.content.includes('**'),
      response.content.includes('*'),
      response.content.includes('>')
    ]
    const markdownScore = (markdownElements.filter(Boolean).length / 6) * 0.2
    score += markdownScore
    
    // 다양성 점수 (0-0.2)
    const uniqueWords = new Set(response.content.split(/\s+/))
    const diversityScore = Math.min(uniqueWords.size / 500, 1) * 0.2
    score += diversityScore
    
    return score
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