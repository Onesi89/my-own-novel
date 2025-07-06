/**
 * Story Generation Hook
 * FSD: features/story/model
 */

'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/features/auth'
import { useToast } from '@/shared/lib'
import { 
  generateStory,
  getGenerationJobStatus,
  getStory,
  getUserStories,
  StoryApiError
} from '../api/storyApi'
import {
  StoryGenerationRequest,
  Story,
  GenerationJob
} from '../types'

export interface StoryGenerationState {
  isGenerating: boolean
  isPolling: boolean
  currentStory: Story | null
  generationJob: GenerationJob | null
  error: string | null
  progress: number
}

export function useStoryGeneration() {
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [state, setState] = useState<StoryGenerationState>({
    isGenerating: false,
    isPolling: false,
    currentStory: null,
    generationJob: null,
    error: null,
    progress: 0
  })

  // 소설 생성 시작
  const startGeneration = useCallback(async (request: StoryGenerationRequest) => {
    if (!isAuthenticated || !user) {
      toast({
        title: '인증 필요',
        description: '로그인이 필요한 서비스입니다.',
        variant: 'destructive',
      })
      return
    }

    setState(prev => ({
      ...prev,
      isGenerating: true,
      error: null,
      progress: 0
    }))

    try {
      console.log('🚀 소설 생성 시작:', request)

      const response = await generateStory(request)

      if (!response.success || !response.data) {
        throw new Error(response.error || '소설 생성 요청에 실패했습니다.')
      }

      const { storyId, jobId, estimatedDuration } = response.data

      setState(prev => ({
        ...prev,
        generationJob: {
          id: jobId,
          storyId,
          userId: user.id,
          status: 'pending',
          progress: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }))

      toast({
        title: '소설 생성 시작',
        description: `예상 완료 시간: ${estimatedDuration}초`,
      })

      // 상태 폴링 시작
      startPolling(jobId, storyId)

    } catch (error) {
      const errorMessage = error instanceof StoryApiError 
        ? error.message 
        : '소설 생성 요청 중 오류가 발생했습니다.'
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage,
      }))

      toast({
        title: '소설 생성 실패',
        description: errorMessage,
        variant: 'destructive',
      })

      console.error('❌ 소설 생성 실패:', error)
    }
  }, [isAuthenticated, user, toast])

  // 생성 상태 폴링
  const startPolling = useCallback(async (jobId: string, storyId: string) => {
    setState(prev => ({ ...prev, isPolling: true }))

    const poll = async () => {
      try {
        const response = await getGenerationJobStatus(jobId)
        
        if (!response.success || !response.data) {
          throw new Error(response.error || '상태 확인에 실패했습니다.')
        }

        const job = response.data

        setState(prev => ({
          ...prev,
          generationJob: job,
          progress: job.progress
        }))

        if (job.status === 'completed') {
          // 완료된 소설 가져오기
          const storyResponse = await getStory(storyId)
          
          if (storyResponse.success && storyResponse.data) {
            setState(prev => ({
              ...prev,
              isGenerating: false,
              isPolling: false,
              currentStory: storyResponse.data!,
              progress: 100
            }))

            toast({
              title: '소설 생성 완료',
              description: '이동 경로를 바탕으로 소설이 생성되었습니다!',
            })
          }
          
          return // 폴링 종료
        }
        
        if (job.status === 'failed') {
          setState(prev => ({
            ...prev,
            isGenerating: false,
            isPolling: false,
            error: job.error || '소설 생성에 실패했습니다.'
          }))

          toast({
            title: '소설 생성 실패',
            description: job.error || '소설 생성 중 오류가 발생했습니다.',
            variant: 'destructive',
          })
          
          return // 폴링 종료
        }

        // 계속 폴링
        setTimeout(poll, 2000)

      } catch (error) {
        console.error('폴링 오류:', error)
        
        setState(prev => ({
          ...prev,
          isGenerating: false,
          isPolling: false,
          error: error instanceof Error ? error.message : '상태 확인 중 오류가 발생했습니다.'
        }))

        toast({
          title: '상태 확인 실패',
          description: '소설 생성 상태를 확인할 수 없습니다.',
          variant: 'destructive',
        })
      }
    }

    // 첫 폴링 시작
    setTimeout(poll, 1000)
  }, [toast])

  // 에러 초기화
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }))
  }, [])

  // 현재 상태 초기화
  const resetState = useCallback(() => {
    setState({
      isGenerating: false,
      isPolling: false,
      currentStory: null,
      generationJob: null,
      error: null,
      progress: 0
    })
  }, [])

  return {
    // 상태
    ...state,
    
    // 액션
    startGeneration,
    clearError,
    resetState,
    
    // 편의 속성
    isInProgress: state.isGenerating || state.isPolling,
    hasResult: !!state.currentStory,
    hasError: !!state.error
  }
}

// 소설 목록 관리를 위한 별도 훅
export function useStoryList() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  })

  const loadStories = useCallback(async (page: number = 1, status?: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await getUserStories(page, pagination.limit, status)
      
      if (!response.success || !response.data) {
        throw new Error(response.error || '소설 목록을 불러올 수 없습니다.')
      }

      setStories(response.data.stories)
      setPagination({
        page: response.data.page,
        limit: response.data.limit,
        total: response.data.total
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '소설 목록 로드 중 오류가 발생했습니다.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [pagination.limit])

  return {
    stories,
    loading,
    error,
    pagination,
    loadStories,
    clearError: () => setError(null)
  }
}