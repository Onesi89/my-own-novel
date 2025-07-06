/**
 * User Synchronization API
 * FSD: features/auth/api
 * 
 * Supabase Auth와 커스텀 users 테이블 동기화
 * cursor rules 준수: 타입 안전성, 에러 핸들링
 */

import { supabase } from '@/shared/lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface CustomUser {
  id: string
  email: string
  name: string
  avatar_url?: string
  google_id: string
  created_at: string
  updated_at: string
}

export interface SyncUserResult {
  success: boolean
  user?: CustomUser
  error?: string
}

// 중복 동기화 방지를 위한 캐시
const syncInProgress = new Set<string>()

/**
 * Supabase auth.users의 사용자를 커스텀 users 테이블에 동기화
 */
export async function syncUserToCustomTable(authUser: User): Promise<SyncUserResult> {
  // 이미 동기화 중인 사용자인지 확인
  if (syncInProgress.has(authUser.id)) {
    console.log(`⏳ Sync already in progress for user ${authUser.id}, skipping...`)
    return { success: true } // 이미 진행 중이므로 성공으로 간주
  }
  
  syncInProgress.add(authUser.id)
  try {
    console.log('Starting user sync for:', {
      id: authUser.id,
      email: authUser.email,
      user_metadata: authUser.user_metadata
    })

    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(authUser.id)) {
      throw new Error(`Invalid UUID format: ${authUser.id}`)
    }

    // 구글 OAuth에서 필요한 정보 추출
    const userData = {
      id: authUser.id,
      email: authUser.email!,
      name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email!.split('@')[0],
      avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
      google_id: authUser.user_metadata?.provider_id || authUser.user_metadata?.sub || authUser.id,
    }

    console.log('Extracted user data:', userData)
    console.log('UUID validation passed for:', authUser.id)

    // 먼저 사용자가 이미 존재하는지 확인
    console.log('Checking if user exists in custom table...')
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    console.log('Existing user check result:', { existingUser, checkError })

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = row not found
      console.error('Error checking existing user:', checkError)
      throw checkError
    }

    let result: CustomUser

    if (existingUser) {
      // 사용자가 존재하면 업데이트
      console.log('User exists, updating...')
      const { data, error } = await supabase
        .from('users')
        .update({
          email: userData.email,
          name: userData.name,
          avatar_url: userData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', authUser.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating user:', error)
        throw error
      }
      result = data as CustomUser
      console.log('User updated successfully:', result)
    } else {
      // 사용자가 없으면 새로 생성
      console.log('User does not exist, creating new...')
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          avatar_url: userData.avatar_url,
          google_id: userData.google_id
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating user:', error)
        throw error
      }
      result = data as CustomUser
      console.log('User created successfully:', result)
    }

    console.log('User synced to custom table:', result)
    return { success: true, user: result }

  } catch (error) {
    console.error('Failed to sync user to custom table:', {
      error,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : JSON.stringify(error) || 'Unknown error during user sync' 
    }
  } finally {
    // 동기화 완료 후 캐시에서 제거
    syncInProgress.delete(authUser.id)
  }
}

/**
 * OAuth 토큰을 커스텀 oauth_tokens 테이블에 저장
 */
export async function saveOAuthToken(
  userId: string, 
  provider: string, 
  accessToken: string, 
  refreshToken?: string, 
  expiresAt?: number
): Promise<SyncUserResult> {
  try {
    const tokenData = {
      user_id: userId,
      provider,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt ? new Date(expiresAt * 1000).toISOString() : new Date(Date.now() + 3600000).toISOString() // 기본 1시간
    }

    // 기존 토큰이 있는지 확인
    const { data: existingToken, error: checkError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    if (existingToken) {
      // 기존 토큰 업데이트
      const { error } = await supabase
        .from('oauth_tokens')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_at,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('provider', provider)

      if (error) throw error
    } else {
      // 새 토큰 생성
      const { error } = await supabase
        .from('oauth_tokens')
        .insert(tokenData)

      if (error) throw error
    }

    console.log('OAuth token saved to custom table')
    return { success: true }

  } catch (error) {
    console.error('Failed to save OAuth token:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during token save' 
    }
  }
}