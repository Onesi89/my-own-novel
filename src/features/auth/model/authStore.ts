/**
 * Authentication State Store
 * FSD: features/auth/model
 * 
 * Zustand 기반 인증 상태 관리
 * cursor rules 준수: 타입 안전성, 불변성, 성능 최적화
 */

import { create } from 'zustand'
import type { AuthError, User } from '@supabase/supabase-js'
import type { UserSession } from '../api'

// 인증 상태 타입 정의
export interface AuthState {
  // 사용자 정보
  user: User | null
  session: UserSession | null
  
  // 로딩 상태
  isLoading: boolean
  isInitialized: boolean
  
  // 에러 상태
  error: AuthError | null
  
  // UI 상태
  isLoginModalOpen: boolean
}

// 인증 액션 타입 정의
export interface AuthActions {
  // 사용자 설정
  setUser: (user: User | null) => void
  setSession: (session: UserSession | null) => void
  
  // 상태 관리
  setLoading: (loading: boolean) => void
  setError: (error: AuthError | null) => void
  setInitialized: (initialized: boolean) => void
  
  // UI 액션
  openLoginModal: () => void
  closeLoginModal: () => void
  
  // 인증 액션
  login: (session: UserSession) => void
  logout: () => void
  
  // 상태 초기화
  reset: () => void
  
  // 수동 persistence 관리
  _hydrate: () => void
  _persist: () => void
}

// 전체 상태 타입
type AuthStore = AuthState & AuthActions

// 초기 상태
const initialState: AuthState = {
  user: null,
  session: null,
  isLoading: false,
  isInitialized: false,
  error: null,
  isLoginModalOpen: false,
}

// LocalStorage 키
const STORAGE_KEY = 'auth-storage'

// 지속성 헬퍼 함수들
const saveToStorage = (state: Partial<AuthState>) => {
  try {
    const dataToSave = {
      user: state.user,
      isInitialized: state.isInitialized,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
  } catch (error) {
    console.warn('Failed to save auth state to localStorage:', error)
  }
}

const loadFromStorage = (): Partial<AuthState> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to load auth state from localStorage:', error)
  }
  return {}
}

// 인증 스토어 생성 (수동 persistence 적용)
export const useAuthStore = create<AuthStore>((set, get) => ({
  ...initialState,

  // 사용자 설정
  setUser: (user: User | null) => {
    set((state) => {
      const newState = {
        ...state,
        user,
        session: user ? state.session : null
      }
      // localStorage 저장을 비동기로 처리하여 무한 루프 방지
      setTimeout(() => saveToStorage(newState), 0)
      return newState
    })
  },

  setSession: (session: UserSession | null) => {
    set((state) => {
      const newState = {
        ...state,
        session,
        user: session?.user || null
      }
      // localStorage 저장을 비동기로 처리하여 무한 루프 방지
      setTimeout(() => saveToStorage(newState), 0)
      return newState
    })
  },

  // 상태 관리
  setLoading: (loading: boolean) => {
    set((state) => ({ ...state, isLoading: loading }))
  },

  setError: (error: AuthError | null) => {
    set((state) => ({ ...state, error }))
  },

  setInitialized: (initialized: boolean) => {
    set((state) => {
      const newState = { ...state, isInitialized: initialized }
      // localStorage 저장을 비동기로 처리하여 무한 루프 방지
      setTimeout(() => saveToStorage(newState), 0)
      return newState
    })
  },

  // UI 액션
  openLoginModal: () => {
    set((state) => ({ ...state, isLoginModalOpen: true }))
  },

  closeLoginModal: () => {
    set((state) => ({ ...state, isLoginModalOpen: false }))
  },

  // 인증 액션
  login: (session: UserSession) => {
    set((state) => {
      const newState = {
        ...state,
        session,
        user: session.user,
        error: null,
        isLoginModalOpen: false
      }
      // localStorage 저장을 비동기로 처리하여 무한 루프 방지
      setTimeout(() => saveToStorage(newState), 0)
      return newState
    })
  },

  logout: () => {
    set((state) => {
      const newState = {
        ...state,
        user: null,
        session: null,
        error: null,
        isLoginModalOpen: false
      }
      // localStorage 저장을 비동기로 처리하여 무한 루프 방지
      setTimeout(() => saveToStorage(newState), 0)
      return newState
    })
  },

  // 상태 초기화
  reset: () => {
    set({ ...initialState })
    localStorage.removeItem(STORAGE_KEY)
  },

  // 수동 persistence 관리
  _hydrate: () => {
    // 이 함수는 더 이상 사용하지 않음 (무한 루프 방지)
    console.warn('_hydrate is deprecated, hydration happens automatically on module load')
  },

  _persist: () => {
    const state = get()
    saveToStorage(state)
  },
}))

// 초기화 시 storage에서 복원 (한 번만 실행)
let isHydrated = false
if (typeof window !== 'undefined' && !isHydrated) {
  isHydrated = true
  const stored = loadFromStorage()
  if (stored && Object.keys(stored).length > 0) {
    useAuthStore.setState(stored)
  }
}

// 선택자 함수들 (성능 최적화)
export const authSelectors = {
  user: (state: AuthStore) => state.user,
  session: (state: AuthStore) => state.session,
  isAuthenticated: (state: AuthStore) => !!state.user,
  isLoading: (state: AuthStore) => state.isLoading,
  isInitialized: (state: AuthStore) => state.isInitialized,
  error: (state: AuthStore) => state.error,
  isLoginModalOpen: (state: AuthStore) => state.isLoginModalOpen,
}

// 편의 함수들
export const useAuth = () => useAuthStore()
export const useAuthUser = () => useAuthStore(authSelectors.user)
export const useAuthSession = () => useAuthStore(authSelectors.session)
export const useIsAuthenticated = () => useAuthStore(authSelectors.isAuthenticated)
export const useAuthLoading = () => useAuthStore(authSelectors.isLoading)
export const useAuthError = () => useAuthStore(authSelectors.error)