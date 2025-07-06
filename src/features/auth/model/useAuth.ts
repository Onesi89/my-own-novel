/**
 * Authentication Hook
 * FSD: features/auth/model
 * 
 * 구글 OAuth 인증을 위한 커스텀 훅
 * cursor rules 준수: Zustand 통합, 에러 핸들링, 타입 안전성
 */

'use client'

import { useEffect, useCallback } from 'react'
import { useToast } from '@/shared/lib'
import { useAuthStore, authSelectors } from './authStore'
import { 
  signInWithGoogle, 
  getCurrentSession, 
  signOut, 
  onAuthStateChange,
  refreshSession,
  syncUserToCustomTable,
  saveOAuthToken
  // testDatabaseConnection,
  // checkTableSchema
} from '../api'
import type { AuthError, User } from '@supabase/supabase-js'

export function useAuth() {
  const store = useAuthStore()
  const { toast } = useToast()
  
  // 선택자를 사용한 상태 구독 (성능 최적화)
  const user = useAuthStore(authSelectors.user)
  const session = useAuthStore(authSelectors.session)
  const isLoading = useAuthStore(authSelectors.isLoading)
  const isInitialized = useAuthStore(authSelectors.isInitialized)
  const error = useAuthStore(authSelectors.error)
  const isAuthenticated = useAuthStore(authSelectors.isAuthenticated)

  // 구글 OAuth 로그인
  const loginWithGoogle = useCallback(async () => {
    store.setLoading(true)
    store.setError(null)
    
    try {
      const { error } = await signInWithGoogle({
        redirectTo: `${window.location.origin}/auth/callback`,
      })

      if (error) {
        throw error
      }

      // OAuth 리다이렉트가 성공적으로 시작됨
      toast({
        title: '구글 로그인',
        description: '구글 계정으로 리다이렉트 중입니다...',
      })

    } catch (error) {
      const authError = error as AuthError
      const errorMessage = getErrorMessage(authError)
      
      store.setError(authError)
      store.setLoading(false)
      
      toast({
        title: '로그인 실패',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }, [store, toast])

  // 로그아웃
  const logout = useCallback(async () => {
    store.setLoading(true)
    
    try {
      const { error } = await signOut()
      
      if (error) {
        throw error
      }

      store.logout()
      
      toast({
        title: '로그아웃',
        description: '안전하게 로그아웃되었습니다.',
      })
      
    } catch (error) {
      const authError = error as AuthError
      store.setError(authError)
      
      toast({
        title: '로그아웃 실패',
        description: '로그아웃 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      store.setLoading(false)
    }
  }, [store, toast])

  // 세션 새로고침
  const refreshUserSession = useCallback(async () => {
    try {
      const { data, error } = await refreshSession()
      
      if (error) {
        throw error
      }

      if (data) {
        store.setSession(data)
        return data
      }
      
      return null
      
    } catch (error) {
      const authError = error as AuthError
      store.setError(authError)
      
      // 세션 새로고침 실패 시 자동 로그아웃
      store.logout()
      
      return null
    }
  }, [store])

  // 앱 초기화 시 세션 복구
  const initializeAuth = useCallback(async () => {
    if (isInitialized) return

    store.setLoading(true)
    
    try {
      const { data, error } = await getCurrentSession()
      
      if (error) {
        // 세션이 없는 경우는 정상적인 상황
        if (error.name === 'NoSessionError') {
          store.setInitialized(true)
          store.setLoading(false)
          return
        }
        throw error
      }

      if (data) {
        store.setSession(data)
        toast({
          title: '자동 로그인',
          description: `환영합니다, ${data.user.user_metadata?.full_name || data.user.email}님!`,
        })
      }

    } catch (error) {
      const authError = error as AuthError
      store.setError(authError)
    } finally {
      store.setInitialized(true)
      store.setLoading(false)
    }
  }, [store, isInitialized, toast])
  
  const handleAuthChange = useCallback(async (user: User | null) => {
    if (user) {
      store.setUser(user)
      
      // 사용자가 로그인했을 때 커스텀 테이블에 동기화
      console.log('🔄 Auth state changed - user logged in, starting sync...')
      
      // 데이터베이스 연결 테스트 및 스키마 확인 (비활성화)
      // const dbTestResult = await testDatabaseConnection()
      // if (!dbTestResult) {
      //   console.error('❌ Database connection test failed, skipping user sync')
      //   return
      // }
      
      // 테이블 스키마 확인 (비활성화)
      // await checkTableSchema()
      
      try {
        const syncResult = await syncUserToCustomTable(user)
        if (syncResult.success) {
          console.log('✅ User synced to custom table:', syncResult.user)
          
          // 현재 세션 정보도 가져와서 토큰 저장
          const { data } = await getCurrentSession()
          if (data) {
            await saveOAuthToken(
              user.id,
              'google',
              data.access_token,
              data.refresh_token,
              data.expires_at
            )
            console.log('✅ OAuth tokens saved')
          }
        } else {
          console.error('❌ Failed to sync user:', syncResult.error)
        }
      } catch (error) {
        console.error('❌ Error during user sync:', error)
      }
    } else {
      console.log('🔄 Auth state changed - user logged out')
      store.setUser(null)
      store.setSession(null)
    }
  }, [store])

  // 인증 상태 변화 리스너 설정 (안정화된 콜백 사용)
  useEffect(() => {
    // 안정화된 콜백 함수 (무한 재생성 방지)

    const { data: { subscription } } = onAuthStateChange(handleAuthChange)

    return () => {
      subscription.unsubscribe()
    }
  }, [handleAuthChange]) // handleAuthChange를 의존성에 추가

  // 앱 시작시 인증 상태 초기화 (한 번만 실행)
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth]) // initializeAuth를 의존성에 추가

  return {
    // 상태
    user,
    session,
    isLoading,
    isInitialized,
    error,
    isAuthenticated,
    
    // 액션
    loginWithGoogle,
    logout,
    refreshUserSession,
    initializeAuth,
    
    // 스토어 직접 액세스 (고급 사용)
    store,
  }
}

// 사용자 친화적 에러 메시지 변환
function getErrorMessage(error: AuthError): string {
  // Supabase 에러 코드별 처리
  if (error.message?.includes('provider is not enabled') || error.message?.includes('Unsupported provider')) {
    return '구글 로그인 설정이 완료되지 않았습니다. 관리자에게 문의해 주세요.'
  }
  
  if (error.message?.includes('validation_failed')) {
    return '로그인 설정에 문제가 있습니다. 잠시 후 다시 시도해 주세요.'
  }

  switch (error.name) {
    case 'AuthApiError':
      return '구글 로그인 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요.'
    
    case 'NetworkError':
      return '인터넷 연결을 확인하고 다시 시도해 주세요.'
    
    case 'PermissionError':
      return '구글 계정 접근 권한이 필요합니다. 권한을 허용하고 다시 시도해 주세요.'
    
    case 'SessionExpired':
      return '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.'
    
    case 'ServerError':
      return '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    
    default:
      return error.message || '알 수 없는 오류가 발생했습니다. 다시 시도해 주세요.'
  }
}

// 편의 함수들 (authStore.ts에서도 제공되지만 여기서도 재export)
export const useAuthUser = () => useAuthStore(authSelectors.user)
export const useAuthSession = () => useAuthStore(authSelectors.session)
export const useIsAuthenticated = () => useAuthStore(authSelectors.isAuthenticated)
export const useAuthLoading = () => useAuthStore(authSelectors.isLoading)
export const useAuthError = () => useAuthStore(authSelectors.error)

// 기존 인터페이스 호환성을 위해 유지
export interface AuthState {
  isLoading: boolean
  user: User | null
  error: AuthError | null
}