/**
 * Story API Client
 * FSD: features/story/api
 */

import { 
  StoryGenerationRequest, 
  StoryGenerationResponse, 
  Story, 
  StoryListResponse,
  GenerationJob 
} from '../types'

const API_BASE = '/api/stories'

export class StoryApiError extends Error {
  constructor(
    message: string, 
    public status?: number, 
    public code?: string
  ) {
    super(message)
    this.name = 'StoryApiError'
  }
}

async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new StoryApiError(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorData.code
    )
  }

  return response.json()
}

/**
 * 소설 생성 요청
 */
export async function generateStory(
  request: StoryGenerationRequest
): Promise<StoryGenerationResponse> {
  return apiCall<StoryGenerationResponse>('/generate', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

/**
 * 소설 조회
 */
export async function getStory(storyId: string): Promise<{
  success: boolean
  data?: Story
  error?: string
}> {
  return apiCall(`/${storyId}`)
}

/**
 * 사용자 소설 목록 조회
 */
export async function getUserStories(
  page: number = 1,
  limit: number = 10,
  status?: string
): Promise<StoryListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status })
  })
  
  return apiCall(`?${params}`)
}

/**
 * 생성 작업 상태 확인
 */
export async function getGenerationJobStatus(jobId: string): Promise<{
  success: boolean
  data?: GenerationJob
  error?: string
}> {
  return apiCall(`/jobs/${jobId}/status`)
}

/**
 * 소설 삭제
 */
export async function deleteStory(storyId: string): Promise<{
  success: boolean
  error?: string
}> {
  return apiCall(`/${storyId}`, {
    method: 'DELETE',
  })
}

/**
 * 소설 상태 업데이트
 */
export async function updateStoryStatus(
  storyId: string, 
  status: 'draft' | 'completed' | 'archived'
): Promise<{
  success: boolean
  error?: string
}> {
  return apiCall(`/${storyId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

/**
 * 소설 선택지 제출
 */
export async function submitStoryChoice(
  storyId: string,
  choiceId: string,
  selectedOption: string
): Promise<{
  success: boolean
  data?: {
    nextSection: string
    choices?: any[]
  }
  error?: string
}> {
  return apiCall(`/${storyId}/choices`, {
    method: 'POST',
    body: JSON.stringify({
      choiceId,
      selectedOption
    }),
  })
}