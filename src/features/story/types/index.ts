/**
 * Story Feature Types
 * FSD: features/story/types
 */

export interface StoryGenerationRequest {
  timelineId?: string // Optional: present for timeline-based stories, absent for direct route selection
  selectedRoutes: any[] // RoutePoint 타입 (기존 타입 재사용)
  aiProvider?: 'claude' | 'gemini' // AI 제공자 선택 (기본값: gemini)
  preferences: {
    genre: 'SF' | 'romance' | 'comedy' | 'mystery' | 'drama' | 'adventure'
    style: 'first_person' | 'third_person'
    tone: 'light' | 'serious' | 'adventurous' | 'mysterious' | 'romantic'
    length: 5000 | 6000 | 7000
  }
}

export interface StoryGenerationResponse {
  success: boolean
  data?: {
    storyId: string
    jobId: string
    estimatedDuration: number
  }
  error?: string
}

export interface Story {
  id: string
  title: string
  content: string
  status: 'draft' | 'completed' | 'archived'
  metadata: {
    genre: string
    style: string
    tone: string
    wordCount: number
    createdAt: string
    updatedAt: string
    estimatedReadTime: number
    locations: any[]
  }
  choices?: StoryInteraction[]
}

export interface StoryInteraction {
  id: string
  storyId: string
  location: string
  question: string
  options: {
    id: string
    text: string
    description: string
    selected?: boolean
  }[]
  selectedChoice?: string
}

export interface GenerationJob {
  id: string
  storyId: string
  userId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  result?: any
  error?: string
  createdAt: string
  updatedAt: string
}

export interface StoryListResponse {
  success: boolean
  data?: {
    stories: Story[]
    total: number
    page: number
    limit: number
  }
  error?: string
}

export interface UserStoryStats {
  totalStories: number
  completedStories: number
  totalWordCount: number
  favoriteGenre: string
  averageReadTime: number
}