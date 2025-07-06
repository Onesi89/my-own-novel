/**
 * AI Provider Factory
 * FSD: shared/lib/ai
 */

import { AIProvider } from './types'
import { ClaudeProvider } from './claudeProvider'
import { GeminiProvider } from './geminiProvider'

export type AIProviderType = 'claude' | 'gemini' | 'openai'

export class AIFactory {
  private static instance: AIProvider | null = null

  static getProvider(
    type: AIProviderType = 'claude',
    apiKey?: string
  ): AIProvider {
    if (!this.instance) {
      this.instance = this.createProvider(type, apiKey)
    }
    return this.instance
  }

  static createProvider(
    type: AIProviderType,
    apiKey?: string
  ): AIProvider {
    const key = apiKey || this.getApiKey(type)
    
    switch (type) {
      case 'claude':
        return new ClaudeProvider(key)
      case 'gemini':
        return new GeminiProvider(key)
      case 'openai':
        throw new Error('OpenAI provider not implemented yet')
      default:
        throw new Error(`Unsupported AI provider: ${type}`)
    }
  }

  private static getApiKey(type: AIProviderType): string {
    let envKey: string
    switch (type) {
      case 'claude':
        envKey = 'ANTHROPIC_API_KEY'
        break
      case 'gemini':
        envKey = 'GEMINI_API_KEY'
        break
      case 'openai':
        envKey = 'OPENAI_API_KEY'
        break
      default:
        throw new Error(`Unsupported provider type: ${type}`)
    }
    
    const key = process.env[envKey]
    
    if (!key) {
      throw new Error(`${envKey} environment variable is required`)
    }
    
    return key
  }

  static resetInstance(): void {
    this.instance = null
  }
}

// 편의 함수 - 기본값을 Gemini로 변경 (비용 절감)
export function getAIProvider(
  type: AIProviderType = 'gemini',
  apiKey?: string
): AIProvider {
  return AIFactory.getProvider(type, apiKey)
}

// AI 제공자별 비용 정보
export const AI_PROVIDER_COSTS = {
  claude: {
    name: 'Claude 3.5 Sonnet',
    inputCost: 3.00, // $3.00 per 1M tokens
    outputCost: 15.00, // $15.00 per 1M tokens
    description: '고품질 창작, 비용 높음'
  },
  gemini: {
    name: 'Gemini 2.5 Flash',
    inputCost: 0.075, // $0.075 per 1M tokens  
    outputCost: 0.30, // $0.30 per 1M tokens
    description: '초고속 생성, 초저가'
  },
  openai: {
    name: 'GPT-4o',
    inputCost: 2.50, // $2.50 per 1M tokens
    outputCost: 10.00, // $10.00 per 1M tokens
    description: '미구현 상태'
  }
} as const