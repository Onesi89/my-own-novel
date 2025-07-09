/**
 * 인터랙티브 소설 시스템 타입 정의
 * FSD: shared/lib/story
 */

export interface StorySettings {
  genre: StoryGenre
  style: StoryStyle
  tone?: string
  length?: number
}

export type StoryGenre = 'SF' | 'romance' | 'comedy' | 'mystery' | 'drama' | 'adventure' | 'horror' | 'fantasy'

export type StoryStyle = 'first_person' | 'third_person'

export interface StoryChoice {
  id: string
  text: string
  description?: string
}

export interface StoryQuestion {
  id: string
  locationId: string
  question: string
  choices: StoryChoice[]
  context?: string
}

export interface StoryProgress {
  currentLocationIndex: number
  completedChoices: Record<string, string> // questionId -> choiceId
  generatedSections: Record<string, string> // locationId -> content
}

export interface InteractiveStorySession {
  id: string
  settings: StorySettings
  routes: any[] // RouteContext[]
  responses: Array<{ question: string; choice: string }>
  progress?: StoryProgress
  status?: 'setup' | 'in_progress' | 'completed'
  createdAt: string
  updatedAt?: string
  completedAt?: string
}

// 애니메이션 설정
export interface GenreAnimationConfig {
  genre: StoryGenre
  primaryColor: string
  secondaryColor: string
  backgroundPattern: 'particles' | 'waves' | 'geometric' | 'organic' | 'minimal'
  transitionType: 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce'
  duration: number
}

// 질문과 선택지 제한
export const STORY_LIMITS = {
  MAX_QUESTION_LENGTH: 200,
  MAX_CHOICE_TEXT_LENGTH: 80,
  MAX_CHOICES_PER_QUESTION: 4,
  MIN_CHOICES_PER_QUESTION: 2,
  MAX_CHOICE_DESCRIPTION_LENGTH: 150
} as const