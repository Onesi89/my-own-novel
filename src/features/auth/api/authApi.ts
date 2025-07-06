/**
 * Authentication API Layer
 * FSD: features/auth/api
 * 
 * Supabase 기반 Google OAuth 인증 API 구현
 * cursor rules 준수: 타입 안전성, 에러 핸들링, 성능 최적화
 */

import { supabase } from '@/shared/lib/supabase'
import type { AuthError, User } from '@supabase/supabase-js'

// Google OAuth 로그인 타입 정의
export interface GoogleAuthOptions {
  redirectTo?: string
}

export interface AuthApiResponse<T = any> {
  data: T | null
  error: AuthError | null
}

export interface UserSession {
  user: User
  access_token: string
  refresh_token: string
  expires_at: number
}

/**
 * Google OAuth 로그인 시작
 * Supabase Auth를 사용한 OAuth 플로우 초기화
 */
export async function signInWithGoogle(
  options: GoogleAuthOptions = {}
): Promise<AuthApiResponse<{ url: string; provider: string }>> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: options.redirectTo || `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    return { data, error }
  } catch (err) {
    return {
      data: null,
      error: {
        name: 'AuthApiError',
        message: err instanceof Error ? err.message : 'Google OAuth 로그인 실패',
      } as AuthError,
    }
  }
}

/**
 * 현재 사용자 세션 가져오기
 */
export async function getCurrentSession(): Promise<AuthApiResponse<UserSession>> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      return { data: null, error }
    }

    if (!session) {
      return { 
        data: null, 
        error: {
          name: 'NoSessionError',
          message: '활성 세션이 없습니다',
        } as AuthError 
      }
    }

    return {
      data: {
        user: session.user,
        access_token: session.access_token,
        refresh_token: session.refresh_token || '',
        expires_at: session.expires_at || 0,
      },
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: {
        name: 'SessionError',
        message: err instanceof Error ? err.message : '세션 조회 실패',
      } as AuthError,
    }
  }
}

/**
 * 현재 사용자 정보 가져오기
 */
export async function getCurrentUser(): Promise<AuthApiResponse<User>> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { data: user, error }
  } catch (err) {
    return {
      data: null,
      error: {
        name: 'UserFetchError',
        message: err instanceof Error ? err.message : '사용자 정보 조회 실패',
      } as AuthError,
    }
  }
}

/**
 * 로그아웃
 */
export async function signOut(): Promise<AuthApiResponse<void>> {
  try {
    const { error } = await supabase.auth.signOut()
    return { data: null, error }
  } catch (err) {
    return {
      data: null,
      error: {
        name: 'SignOutError',
        message: err instanceof Error ? err.message : '로그아웃 실패',
      } as AuthError,
    }
  }
}

/**
 * 세션 새로고침
 */
export async function refreshSession(): Promise<AuthApiResponse<UserSession>> {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession()
    
    if (error || !session) {
      return { data: null, error }
    }

    return {
      data: {
        user: session.user,
        access_token: session.access_token,
        refresh_token: session.refresh_token || '',
        expires_at: session.expires_at || 0,
      },
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: {
        name: 'RefreshError',
        message: err instanceof Error ? err.message : '세션 새로고침 실패',
      } as AuthError,
    }
  }
}

/**
 * 인증 상태 변화 리스너 설정
 * 무한 리렌더링 방지를 위해 안정화된 콜백 사용
 */
export function onAuthStateChange(
  callback: (user: User | null) => void
) {
  return supabase.auth.onAuthStateChange((event, session) => {
    // 이벤트 타입에 따른 더 정확한 처리
    if (event === 'SIGNED_IN') {
      callback(session?.user || null)
    } else if (event === 'SIGNED_OUT') {
      callback(null)
    } else if (event === 'TOKEN_REFRESHED') {
      callback(session?.user || null)
    } else if (event === 'USER_UPDATED') {
      callback(session?.user || null)
    }
    // INITIAL_SESSION은 무시 (중복 호출 방지)
  })
}

/**
 * OAuth 콜백 처리
 * 리다이렉트 후 URL 파라미터에서 세션 정보 추출
 */
export async function handleOAuthCallback(): Promise<AuthApiResponse<UserSession>> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      return { data: null, error }
    }

    if (!session) {
      return {
        data: null,
        error: {
          name: 'CallbackError',
          message: 'OAuth 콜백에서 세션을 찾을 수 없습니다',
        } as AuthError,
      }
    }

    return {
      data: {
        user: session.user,
        access_token: session.access_token,
        refresh_token: session.refresh_token || '',
        expires_at: session.expires_at || 0,
      },
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: {
        name: 'CallbackProcessError',
        message: err instanceof Error ? err.message : 'OAuth 콜백 처리 실패',
      } as AuthError,
    }
  }
}