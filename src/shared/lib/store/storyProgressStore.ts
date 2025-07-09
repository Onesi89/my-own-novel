/**
 * Story Progress Store - Zustand Store for Interactive Story State Management
 * 
 * This store manages the state of interactive story progression without localStorage persistence.
 * It tracks story settings, selected routes, current progress, and previous choices.
 */

import { create } from 'zustand'
import { StorySettings } from '@/shared/lib/story/types'

// Types for Story Progress
interface StoryRoute {
  id: string
  address: string
  customInfo?: {
    customName: string
    description: string
    category: string
  }
  timestamp: string
  placeName?: string
}

interface StoryChoice {
  question: string
  choice: string
}

interface StoryProgressState {
  // Story Configuration
  storyId: string | null
  storySettings: StorySettings | null
  selectedRoutes: StoryRoute[]
  
  // Progress Tracking
  currentStep: number
  totalSteps: number
  previousChoices: StoryChoice[]
  
  // UI State
  isLoading: boolean
  isCompleted: boolean
  
  // Error State
  error: string | null
}

interface StoryProgressActions {
  // Story Setup
  setStoryId: (id: string) => void
  setStorySettings: (settings: StorySettings) => void
  setSelectedRoutes: (routes: StoryRoute[]) => void
  
  // Progress Management
  setCurrentStep: (step: number) => void
  addChoice: (choice: StoryChoice) => void
  nextStep: () => void
  
  // UI State Management
  setLoading: (loading: boolean) => void
  setCompleted: (completed: boolean) => void
  setError: (error: string | null) => void
  
  // Reset Functions
  resetProgress: () => void
  resetAll: () => void
}

type StoryProgressStore = StoryProgressState & StoryProgressActions

// Initial State
const initialState: StoryProgressState = {
  storyId: null,
  storySettings: null,
  selectedRoutes: [],
  currentStep: 1,
  totalSteps: 0,
  previousChoices: [],
  isLoading: false,
  isCompleted: false,
  error: null,
}

// Create Store
export const useStoryProgressStore = create<StoryProgressStore>()((set, get) => ({
  ...initialState,
  
  // Story Setup Actions
  setStoryId: (id: string) => set({ storyId: id }),
  
  setStorySettings: (settings: StorySettings) => set({ storySettings: settings }),
  
  setSelectedRoutes: (routes: StoryRoute[]) => 
    set({ 
      selectedRoutes: routes,
      totalSteps: routes.length,
      currentStep: 1,
      previousChoices: [],
      isCompleted: false,
      error: null
    }),
  
  // Progress Management Actions
  setCurrentStep: (step: number) => 
    set({ currentStep: step }),
  
  addChoice: (choice: StoryChoice) => 
    set((state) => ({
      previousChoices: [...state.previousChoices, choice]
    })),
  
  nextStep: () => 
    set((state) => {
      const nextStep = state.currentStep + 1
      const isCompleted = nextStep > state.totalSteps
      
      return {
        currentStep: nextStep,
        isCompleted,
        isLoading: false
      }
    }),
  
  // UI State Management Actions
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  setCompleted: (completed: boolean) => set({ isCompleted: completed }),
  
  setError: (error: string | null) => set({ error }),
  
  // Reset Functions
  resetProgress: () => 
    set({
      currentStep: 1,
      previousChoices: [],
      isCompleted: false,
      isLoading: false,
      error: null
    }),
  
  resetAll: () => set(initialState),
}))

// Selector Hooks for Common Use Cases
export const useStoryId = () => useStoryProgressStore(state => state.storyId)
export const useStorySettings = () => useStoryProgressStore(state => state.storySettings)
export const useSelectedRoutes = () => useStoryProgressStore(state => state.selectedRoutes)
export const useCurrentStep = () => useStoryProgressStore(state => state.currentStep)
export const useTotalSteps = () => useStoryProgressStore(state => state.totalSteps)
export const usePreviousChoices = () => useStoryProgressStore(state => state.previousChoices)
export const useStoryLoading = () => useStoryProgressStore(state => state.isLoading)
export const useStoryCompleted = () => useStoryProgressStore(state => state.isCompleted)
export const useStoryError = () => useStoryProgressStore(state => state.error)

// Action Hooks
export const useStoryActions = () => useStoryProgressStore(state => ({
  setStoryId: state.setStoryId,
  setStorySettings: state.setStorySettings,
  setSelectedRoutes: state.setSelectedRoutes,
  setCurrentStep: state.setCurrentStep,
  addChoice: state.addChoice,
  nextStep: state.nextStep,
  setLoading: state.setLoading,
  setCompleted: state.setCompleted,
  setError: state.setError,
  resetProgress: state.resetProgress,
  resetAll: state.resetAll,
}))

// Combined Hook for Full Store Access
export const useStoryProgress = () => useStoryProgressStore()