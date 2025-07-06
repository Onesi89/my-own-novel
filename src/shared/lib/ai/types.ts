/**
 * AI 서비스 타입 정의
 * FSD: shared/lib/ai
 */

export interface StoryPreferences {
  genre: 'SF' | 'romance' | 'comedy' | 'mystery' | 'drama' | 'adventure'
  style: 'first_person' | 'third_person'
  tone: 'light' | 'serious' | 'adventurous' | 'mysterious' | 'romantic'
  length: 5000 | 6000 | 7000
}

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
}

export interface StoryChoice {
  id: string
  location: string
  question: string
  options: {
    id: string
    text: string
    description: string
  }[]
}

export interface StorySection {
  id: string
  content: string
  location: RouteContext
  choices?: StoryChoice
}

export interface GeneratedStory {
  id: string
  title: string
  sections: StorySection[]
  metadata: {
    genre: string
    style: string
    tone: string
    wordCount: number
    estimatedReadTime: number
    locations: RouteContext[]
  }
}

export interface AIResponse {
  success: boolean
  data?: {
    content: string
    choices?: StoryChoice[]
    metadata?: Record<string, any>
  }
  error?: string
  tokenUsage?: {
    prompt: number
    completion: number
    total: number
  }
}

export interface AIProvider {
  generateStory(context: StoryGenerationContext): Promise<AIResponse>
  generateChoices(location: RouteContext): Promise<StoryChoice>
  generateSection(context: SectionGenerationContext): Promise<AIResponse>
  generateStorySection(context: StorySectionGenerationContext): Promise<AIResponse>
}

export interface StoryGenerationContext {
  routes: RouteContext[]
  preferences: StoryPreferences
  previousChoices?: Record<string, string>
  existingSections?: StorySection[]
}

export interface SectionGenerationContext {
  route: RouteContext
  preferences: StoryPreferences
  previousContext: string
  selectedChoice?: string
}

export interface StorySectionGenerationContext {
  storyId: string
  currentContent: string
  selectedChoice: {
    location: string
    question: string
    selectedOption: string
    optionDescription: string
  }
  preferences: StoryPreferences
}

export interface TokenLimits {
  maxTokensPerRequest: number
  dailyLimitPerUser: number
  monthlyBudget: number
}

export const DEFAULT_TOKEN_LIMITS: TokenLimits = {
  maxTokensPerRequest: 4000,
  dailyLimitPerUser: 10,
  monthlyBudget: 100
}

export const PERFORMANCE_TARGETS = {
  responseTimeMs: 10000,
  successRate: 95,
  uptime: 99.5
}