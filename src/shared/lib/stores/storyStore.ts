/**
 * Story Reader State Management Store
 * Using Zustand for lightweight state management
 */

import { create } from 'zustand'

interface StoryChoice {
  id: string
  location: string
  question: string
  options: Array<{
    id: string
    text: string
    description: string
  }>
  selectedChoice?: string
  selectedAt?: string
}

interface StorySection {
  id: string
  content: string
  choices: StoryChoice[]
  timestamp: string
}

interface StoryState {
  // Story data
  storyId: string | null
  originalContent: string
  sections: StorySection[]
  currentChoices: StoryChoice[]
  
  // UI state
  isLoadingChoice: boolean
  error: string | null
  
  // Actions
  setStory: (storyId: string, content: string, choices: StoryChoice[]) => void
  selectChoice: (choiceId: string, optionId: string) => Promise<void>
  addSection: (section: StorySection) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  storyId: null,
  originalContent: '',
  sections: [],
  currentChoices: [],
  isLoadingChoice: false,
  error: null,
}

export const useStoryStore = create<StoryState>((set, get) => ({
  ...initialState,

  setStory: (storyId, content, choices) => {
    set({
      storyId,
      originalContent: content,
      currentChoices: choices,
      sections: [],
      error: null
    })
  },

  selectChoice: async (choiceId, optionId) => {
    const { storyId, setLoading, setError, addSection } = get()
    
    if (!storyId) {
      setError('스토리 정보가 없습니다.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/stories/${storyId}/choices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          choiceId,
          selectedOption: optionId
        })
      })

      if (!response.ok) {
        throw new Error('선택지 처리에 실패했습니다.')
      }

      const data = await response.json()
      
      if (data.success) {
        // 새로운 섹션 추가
        const newSection: StorySection = {
          id: `section-${Date.now()}`,
          content: data.data.nextSection,
          choices: data.data.choices || [],
          timestamp: new Date().toISOString()
        }
        
        addSection(newSection)
        
        // 현재 선택지 업데이트 (선택된 것 표시)
        set((state) => ({
          currentChoices: state.currentChoices.map(choice => 
            choice.id === choiceId 
              ? { ...choice, selectedChoice: optionId, selectedAt: new Date().toISOString() }
              : choice
          )
        }))
      } else {
        throw new Error(data.error || '알 수 없는 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('Choice selection error:', error)
      setError(error instanceof Error ? error.message : '선택지 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  },

  addSection: (section) => {
    set((state) => ({
      sections: [...state.sections, section],
      currentChoices: section.choices
    }))
  },

  setLoading: (loading) => {
    set({ isLoadingChoice: loading })
  },

  setError: (error) => {
    set({ error })
  },

  reset: () => {
    set(initialState)
  }
}))