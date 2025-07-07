/**
 * Place Form Provider Component
 * FSD: features/map/ui/PlaceForm
 * 
 * PlaceInfoModal의 상태 관리를 위한 컨텍스트 프로바이더
 */

'use client'

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { sanitizeInput, INPUT_LIMITS } from '@/shared/lib/validation/inputValidation'

// Place Info 타입
export interface PlaceInfo {
  customName?: string
  category: 'home' | 'work' | 'leisure' | 'shopping' | 'dining' | 'transport' | 'other'
  description?: string
  storyHint?: string
  isPrivate?: boolean
  visitTime?: string
  duration?: number
}

// Timeline Location 타입
export interface TimelineLocation {
  id: string
  lat: number
  lng: number
  timestamp: string
  address?: string
  duration?: number
}

// Form State
export interface PlaceFormState {
  formData: PlaceInfo
  errors: Record<string, string>
}

// Actions
export type PlaceFormAction =
  | { type: 'SET_FORM_DATA'; payload: Partial<PlaceInfo> }
  | { type: 'SET_ERROR'; payload: { field: string; message: string } }
  | { type: 'CLEAR_ERROR'; payload: string }
  | { type: 'CLEAR_ALL_ERRORS' }
  | { type: 'RESET_FORM'; payload?: PlaceInfo }

// Initial State
const initialFormData: PlaceInfo = {
  customName: '',
  category: 'other',
  description: '',
  storyHint: '',
  isPrivate: false,
  visitTime: '',
  duration: 30
}

const initialState: PlaceFormState = {
  formData: initialFormData,
  errors: {}
}

// Reducer
function placeFormReducer(state: PlaceFormState, action: PlaceFormAction): PlaceFormState {
  switch (action.type) {
    case 'SET_FORM_DATA':
      return {
        ...state,
        formData: { ...state.formData, ...action.payload }
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.payload.field]: action.payload.message }
      }
    
    case 'CLEAR_ERROR':
      const { [action.payload]: _, ...restErrors } = state.errors
      return { ...state, errors: restErrors }
    
    case 'CLEAR_ALL_ERRORS':
      return { ...state, errors: {} }
    
    case 'RESET_FORM':
      return {
        formData: action.payload || initialFormData,
        errors: {}
      }
    
    default:
      return state
  }
}

// Context Type
interface PlaceFormContextType {
  state: PlaceFormState
  dispatch: React.Dispatch<PlaceFormAction>
  
  // Helper functions
  updateField: (field: keyof PlaceInfo, value: any) => void
  setError: (field: string, message: string) => void
  clearError: (field: string) => void
  validateForm: () => boolean
  resetForm: (initialData?: PlaceInfo) => void
  sanitizeAndUpdateField: (field: keyof PlaceInfo, value: string, maxLength: number) => void
}

// Context
const PlaceFormContext = createContext<PlaceFormContextType | undefined>(undefined)

// Provider Component
interface PlaceFormProviderProps {
  children: ReactNode
  initialData?: PlaceInfo
  location?: TimelineLocation | null
}

export function PlaceFormProvider({ children, initialData, location }: PlaceFormProviderProps) {
  const [state, dispatch] = useReducer(placeFormReducer, initialState)

  // Helper Functions
  const updateField = (field: keyof PlaceInfo, value: any) => {
    dispatch({ type: 'SET_FORM_DATA', payload: { [field]: value } })
  }

  const setError = (field: string, message: string) => {
    dispatch({ type: 'SET_ERROR', payload: { field, message } })
  }

  const clearError = (field: string) => {
    dispatch({ type: 'CLEAR_ERROR', payload: field })
  }

  const sanitizeAndUpdateField = (field: keyof PlaceInfo, value: string, maxLength: number) => {
    const sanitizedValue = sanitizeInput(value, maxLength)
    updateField(field, sanitizedValue)
    clearError(field)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!state.formData.customName?.trim()) {
      newErrors.customName = '장소 이름을 입력해주세요'
    }
    
    if (!state.formData.category) {
      newErrors.category = '장소 종류를 선택해주세요'
    }
    
    if (!state.formData.description?.trim()) {
      newErrors.description = '장소 설명을 입력해주세요'
    } else if (state.formData.description.trim().length < 10) {
      newErrors.description = '장소 설명은 최소 10글자 이상 입력해주세요'
    }
    
    if (!state.formData.storyHint?.trim()) {
      newErrors.storyHint = '스토리 힌트를 입력해주세요'
    } else if (state.formData.storyHint.trim().length < 5) {
      newErrors.storyHint = '스토리 힌트는 최소 5글자 이상 입력해주세요'
    }
    
    // Set all errors at once
    Object.entries(newErrors).forEach(([field, message]) => {
      setError(field, message)
    })
    
    return Object.keys(newErrors).length === 0
  }

  const resetForm = (initialData?: PlaceInfo) => {
    dispatch({ type: 'RESET_FORM', payload: initialData })
  }

  // Initialize form data when props change
  useEffect(() => {
    if (initialData) {
      const formatTimeForInput = (timestamp: string): string => {
        const date = new Date(timestamp)
        return date.toISOString().slice(0, 16)
      }

      resetForm({
        ...initialData,
        visitTime: initialData.visitTime || (location?.timestamp ? formatTimeForInput(location.timestamp) : ''),
        duration: initialData.duration || location?.duration || 30
      })
    } else if (location) {
      const addressParts = location.address?.split(',') || []
      const suggestedName = addressParts[0]?.trim() || ''
      
      const formatTimeForInput = (timestamp: string): string => {
        const date = new Date(timestamp)
        return date.toISOString().slice(0, 16)
      }

      resetForm({
        ...initialFormData,
        customName: suggestedName,
        visitTime: location.timestamp ? formatTimeForInput(location.timestamp) : '',
        duration: location.duration || 30
      })
    }
  }, [initialData, location])

  const contextValue: PlaceFormContextType = {
    state,
    dispatch,
    updateField,
    setError,
    clearError,
    validateForm,
    resetForm,
    sanitizeAndUpdateField
  }

  return (
    <PlaceFormContext.Provider value={contextValue}>
      {children}
    </PlaceFormContext.Provider>
  )
}

// Custom Hook
export function usePlaceForm() {
  const context = useContext(PlaceFormContext)
  if (context === undefined) {
    throw new Error('usePlaceForm must be used within a PlaceFormProvider')
  }
  return context
}