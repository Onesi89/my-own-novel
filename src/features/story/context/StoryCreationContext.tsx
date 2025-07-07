/**
 * Story Creation Context
 * FSD: features/story/context
 * 
 * 스토리 생성 과정의 상태 관리를 위한 컨텍스트
 */

'use client'

import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { StorySettings } from '@/shared/lib/story/types'

// 스토리 생성 단계
export type StoryCreationStep = 
  | 'upload' 
  | 'route-selection' 
  | 'route-editing' 
  | 'story-setup' 
  | 'interactive-flow'
  | 'completed'

// 모달 상태
export interface ModalStates {
  isRouteSelectionOpen: boolean
  isRouteEditingOpen: boolean
  isInlineStorySetupOpen: boolean
  isInteractiveStoryOpen: boolean
  isRouteConfirmOpen: boolean
}

// 스토리 생성 상태
export interface StoryCreationState {
  // 현재 단계
  currentStep: StoryCreationStep
  
  // 모달 상태들
  modals: ModalStates
  
  // 데이터
  selectedRoutes: any[]
  storySettings: StorySettings | null
  routeSelectionMode: 'map' | 'upload'
  isMapMode: boolean
  isContentFadingOut: boolean
  
  // 필터링
  filterDates: {
    start: string
    end: string
  }
}

// 액션 타입
export type StoryCreationAction =
  | { type: 'SET_STEP'; payload: StoryCreationStep }
  | { type: 'TOGGLE_MODAL'; payload: { modal: keyof ModalStates; isOpen: boolean } }
  | { type: 'SET_SELECTED_ROUTES'; payload: any[] }
  | { type: 'SET_STORY_SETTINGS'; payload: StorySettings | null }
  | { type: 'SET_ROUTE_SELECTION_MODE'; payload: 'map' | 'upload' }
  | { type: 'SET_MAP_MODE'; payload: boolean }
  | { type: 'SET_CONTENT_FADING'; payload: boolean }
  | { type: 'SET_FILTER_DATES'; payload: { start: string; end: string } }
  | { type: 'RESET_STATE' }

// 초기 상태
const initialState: StoryCreationState = {
  currentStep: 'upload',
  modals: {
    isRouteSelectionOpen: false,
    isRouteEditingOpen: false,
    isInlineStorySetupOpen: false,
    isInteractiveStoryOpen: false,
    isRouteConfirmOpen: false,
  },
  selectedRoutes: [],
  storySettings: null,
  routeSelectionMode: 'map',
  isMapMode: false,
  isContentFadingOut: false,
  filterDates: {
    start: '',
    end: ''
  }
}

// 리듀서
function storyCreationReducer(
  state: StoryCreationState, 
  action: StoryCreationAction
): StoryCreationState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload }
      
    case 'TOGGLE_MODAL':
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload.modal]: action.payload.isOpen
        }
      }
      
    case 'SET_SELECTED_ROUTES':
      return { ...state, selectedRoutes: action.payload }
      
    case 'SET_STORY_SETTINGS':
      return { ...state, storySettings: action.payload }
      
    case 'SET_ROUTE_SELECTION_MODE':
      return { ...state, routeSelectionMode: action.payload }
      
    case 'SET_MAP_MODE':
      return { ...state, isMapMode: action.payload }
      
    case 'SET_CONTENT_FADING':
      return { ...state, isContentFadingOut: action.payload }
      
    case 'SET_FILTER_DATES':
      return { ...state, filterDates: action.payload }
      
    case 'RESET_STATE':
      return initialState
      
    default:
      return state
  }
}

// 컨텍스트 타입
interface StoryCreationContextType {
  state: StoryCreationState
  dispatch: React.Dispatch<StoryCreationAction>
  
  // Helper functions
  openModal: (modal: keyof ModalStates) => void
  closeModal: (modal: keyof ModalStates) => void
  setSelectedRoutes: (routes: any[]) => void
  setStorySettings: (settings: StorySettings | null) => void
  goToStep: (step: StoryCreationStep) => void
  resetCreation: () => void
}

// 컨텍스트 생성
const StoryCreationContext = createContext<StoryCreationContextType | undefined>(undefined)

// Provider 컴포넌트
interface StoryCreationProviderProps {
  children: ReactNode
}

export function StoryCreationProvider({ children }: StoryCreationProviderProps) {
  const [state, dispatch] = useReducer(storyCreationReducer, initialState)
  
  // Helper functions
  const openModal = (modal: keyof ModalStates) => {
    dispatch({ type: 'TOGGLE_MODAL', payload: { modal, isOpen: true } })
  }
  
  const closeModal = (modal: keyof ModalStates) => {
    dispatch({ type: 'TOGGLE_MODAL', payload: { modal, isOpen: false } })
  }
  
  const setSelectedRoutes = (routes: any[]) => {
    dispatch({ type: 'SET_SELECTED_ROUTES', payload: routes })
  }
  
  const setStorySettings = (settings: StorySettings | null) => {
    dispatch({ type: 'SET_STORY_SETTINGS', payload: settings })
  }
  
  const goToStep = (step: StoryCreationStep) => {
    dispatch({ type: 'SET_STEP', payload: step })
  }
  
  const resetCreation = () => {
    dispatch({ type: 'RESET_STATE' })
  }
  
  const contextValue: StoryCreationContextType = {
    state,
    dispatch,
    openModal,
    closeModal,
    setSelectedRoutes,
    setStorySettings,
    goToStep,
    resetCreation
  }
  
  return (
    <StoryCreationContext.Provider value={contextValue}>
      {children}
    </StoryCreationContext.Provider>
  )
}

// 커스텀 훅
export function useStoryCreation() {
  const context = useContext(StoryCreationContext)
  if (context === undefined) {
    throw new Error('useStoryCreation must be used within a StoryCreationProvider')
  }
  return context
}