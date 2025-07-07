/**
 * Story Reader Context
 * FSD: features/story/context
 * 
 * StoryReader의 상태 관리를 위한 컨텍스트
 */

'use client'

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { useToast } from '@/shared/lib'

// Types
export interface Story {
  id: string
  title: string
  content?: string
  genre: string
  status: string
  created_at: string
  file_path?: string
  ai_choices?: any[]
  metadata?: {
    wordCount?: number
    estimatedReadTime?: number
    locations?: any[]
    aiModel?: string
  }
}

export interface StorySection {
  id: string
  content: string
  choiceId: string
  optionId: string
}

export interface StoryReaderState {
  story: Story
  originalContent: string
  sections: StorySection[]
  isLoading: boolean
  error: string | null
  processingChoices: Set<string>
}

// Actions
export type StoryReaderAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_STORY'; payload: { story: Story; originalContent: string } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'ADD_SECTION'; payload: StorySection }
  | { type: 'SET_PROCESSING_CHOICE'; payload: { choiceId: string; processing: boolean } }

// Initial State
const initialState: StoryReaderState = {
  story: {
    id: '',
    title: '',
    genre: '',
    status: '',
    created_at: ''
  },
  originalContent: '',
  sections: [],
  isLoading: true,
  error: null,
  processingChoices: new Set()
}

// Reducer
function storyReaderReducer(state: StoryReaderState, action: StoryReaderAction): StoryReaderState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_STORY':
      return {
        ...state,
        story: action.payload.story,
        originalContent: action.payload.originalContent,
        isLoading: false,
        error: null
      }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    
    case 'ADD_SECTION':
      return {
        ...state,
        sections: [...state.sections, action.payload]
      }
    
    case 'SET_PROCESSING_CHOICE':
      const newProcessingChoices = new Set(state.processingChoices)
      if (action.payload.processing) {
        newProcessingChoices.add(action.payload.choiceId)
      } else {
        newProcessingChoices.delete(action.payload.choiceId)
      }
      return { ...state, processingChoices: newProcessingChoices }
    
    default:
      return state
  }
}

// Context Type
interface StoryReaderContextType {
  state: StoryReaderState
  dispatch: React.Dispatch<StoryReaderAction>
  
  // Helper functions
  loadStory: (storyId: string) => Promise<void>
  handleChoiceSelect: (choiceId: string, optionId: string) => Promise<void>
  handleShare: () => Promise<void>
  handleDownload: () => void
}

// Context
const StoryReaderContext = createContext<StoryReaderContextType | undefined>(undefined)

// Provider Component
interface StoryReaderProviderProps {
  children: ReactNode
  storyId: string
}

export function StoryReaderProvider({ children, storyId }: StoryReaderProviderProps) {
  const [state, dispatch] = useReducer(storyReaderReducer, initialState)
  const { toast } = useToast()

  // Load story data
  const loadStory = async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const response = await fetch(`/api/stories/${id}`)
      const data = await response.json()
      
      if (response.ok && data.success) {
        const story = data.story
        let originalContent = story.content || ''
        
        // 스토리 파일에서 원본 내용 가져오기
        if (story.file_path) {
          try {
            const fileResponse = await fetch(`/api/stories/${id}?content=true`)
            const fileData = await fileResponse.json()
            if (fileResponse.ok && fileData.content) {
              originalContent = fileData.content
            }
          } catch (fileError) {
            console.warn('Failed to load story file content:', fileError)
          }
        }
        
        dispatch({ 
          type: 'SET_STORY', 
          payload: { story, originalContent } 
        })
      } else {
        throw new Error(data.error || '스토리 로드 실패')
      }
    } catch (err) {
      console.error('Story fetch error:', err)
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      toast({
        title: '오류',
        description: '스토리를 불러오는데 실패했습니다.',
        variant: 'destructive'
      })
    }
  }

  // Handle choice selection
  const handleChoiceSelect = async (choiceId: string, optionId: string) => {
    dispatch({ type: 'SET_PROCESSING_CHOICE', payload: { choiceId, processing: true } })
    
    try {
      const response = await fetch(`/api/stories/${storyId}/choices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choiceId, optionId })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        const newSection: StorySection = {
          id: `section_${Date.now()}`,
          content: data.content,
          choiceId,
          optionId
        }
        
        dispatch({ type: 'ADD_SECTION', payload: newSection })
        
        toast({
          title: '이야기 확장 완료',
          description: '새로운 이야기가 추가되었습니다.'
        })
      } else {
        throw new Error(data.error || '선택지 처리 실패')
      }
    } catch (err) {
      console.error('Choice selection error:', err)
      toast({
        title: '오류',
        description: '선택지를 처리하는데 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      dispatch({ type: 'SET_PROCESSING_CHOICE', payload: { choiceId, processing: false } })
    }
  }

  // Handle sharing
  const handleShare = async () => {
    try {
      const shareData = {
        title: state.story?.title || '나만의 AI 소설',
        text: `${state.story?.genre} 장르의 특별한 이야기 "${state.story?.title}"을 읽어보세요! 🚗✨`,
        url: window.location.href
      }
      
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        const shareText = `${shareData.text}\n\n${shareData.url}`
        await navigator.clipboard.writeText(shareText)
        toast({
          title: '링크 복사됨',
          description: '소설 링크가 클립보드에 복사되었습니다.'
        })
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Share failed:', err)
        try {
          await navigator.clipboard.writeText(window.location.href)
          toast({
            title: '링크 복사됨',
            description: '소설 링크가 클립보드에 복사되었습니다.'
          })
        } catch (clipboardErr) {
          toast({
            title: '공유 실패',
            description: '공유 기능을 사용할 수 없습니다.',
            variant: 'destructive'
          })
        }
      }
    }
  }

  // Handle download
  const handleDownload = () => {
    if (!state.story?.content && !state.originalContent) return
    
    // 전체 스토리 내용 구성
    let fullContent = state.originalContent || state.story?.content || ''
    
    if (state.sections.length > 0) {
      fullContent += '\n\n---\n\n'
      state.sections.forEach((section, index) => {
        fullContent += `\n## 이어지는 이야기 #${index + 1}\n\n`
        fullContent += section.content
        fullContent += '\n\n---\n\n'
      })
    }
    
    // 메타데이터 추가
    const metadata = `---
title: ${state.story?.title || '제목 없음'}
genre: ${state.story?.genre || '미정'}
created: ${state.story?.created_at ? new Date(state.story.created_at).toLocaleDateString('ko-KR') : ''}
sections: ${state.sections.length + 1}
---

`
    
    const finalContent = metadata + fullContent
    
    const blob = new Blob([finalContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${state.story?.title || 'story'}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: '다운로드 완료',
      description: `전체 이야기 (${state.sections.length + 1}개 섹션)가 다운로드되었습니다.`
    })
  }

  // Load story on mount
  useEffect(() => {
    if (storyId) {
      loadStory(storyId)
    }
  }, [storyId])

  const contextValue: StoryReaderContextType = {
    state,
    dispatch,
    loadStory,
    handleChoiceSelect,
    handleShare,
    handleDownload
  }

  return (
    <StoryReaderContext.Provider value={contextValue}>
      {children}
    </StoryReaderContext.Provider>
  )
}

// Custom Hook
export function useStoryReader() {
  const context = useContext(StoryReaderContext)
  if (context === undefined) {
    throw new Error('useStoryReader must be used within a StoryReaderProvider')
  }
  return context
}