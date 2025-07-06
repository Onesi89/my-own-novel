/**
 * Google OAuth Callback Page
 * Next.js App Router: /auth/callback
 * 
 * 구글 OAuth 리다이렉트 후 처리 페이지
 * cursor rules 준수: 에러 처리, 사용자 피드백, 리다이렉트 처리
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { handleOAuthCallback } from '@/features/auth/api'
import { useToast } from '@/shared/lib'

type CallbackState = 'loading' | 'success' | 'error'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { store } = useAuth()
  const { toast } = useToast()
  
  const [callbackState, setCallbackState] = useState<CallbackState>('loading')
  const [error, setError] = useState<string | null>(null)
  const processedRef = useRef(false) // 전역 중복 처리 방지 플래그

  useEffect(() => {
    let mounted = true
    
    // 이미 처리되었으면 즉시 리턴
    if (processedRef.current) {
      console.log('OAuth callback already processed, skipping...')
      return
    }

    const processCallback = async () => {
      // 이미 처리된 경우 중복 실행 방지
      if (processedRef.current) return
      processedRef.current = true
      
      console.log('🔄 Starting OAuth callback processing...')

      try {
        setCallbackState('loading')
        
        // OAuth 콜백 처리
        const { data, error } = await handleOAuthCallback()
        
        if (!mounted) return

        if (error) {
          throw error
        }

        if (data) {
          // 세션 정보를 스토어에 저장
          store.setSession(data)
          
          // 사용자 동기화는 useAuth 훅에서 자동으로 처리됨 (중복 방지)
          console.log('📋 OAuth callback successful, user sync will be handled by useAuth hook')
          
          store.setLoading(false)
          setCallbackState('success')
          
          toast({
            title: '로그인 성공!',
            description: `환영합니다, ${data.user.user_metadata?.full_name || data.user.email}님!`,
          })

          // 성공 후 메인 페이지로 리다이렉트 (2초 후)
          setTimeout(() => {
            if (mounted) {
              router.push('/')
            }
          }, 2000)
          
        } else {
          throw new Error('세션 정보를 가져올 수 없습니다')
        }
        
      } catch (err) {
        if (!mounted) return
        
        const errorMessage = err instanceof Error ? err.message : '로그인 처리 중 오류가 발생했습니다'
        
        setCallbackState('error')
        setError(errorMessage)
        store.setError(err as any)
        store.setLoading(false)
        
        toast({
          title: '로그인 실패',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    }

    processCallback()

    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // OAuth 콜백은 페이지 로드 시 한 번만 실행되어야 함

  const handleRetry = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {callbackState === 'loading' && (
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            )}
            {callbackState === 'success' && (
              <CheckCircle className="h-12 w-12 text-green-600" />
            )}
            {callbackState === 'error' && (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
          </div>
          
          <CardTitle>
            {callbackState === 'loading' && '로그인 처리 중'}
            {callbackState === 'success' && '로그인 성공!'}
            {callbackState === 'error' && '로그인 실패'}
          </CardTitle>
          
          <CardDescription>
            {callbackState === 'loading' && '구글 계정으로 로그인하는 중입니다...'}
            {callbackState === 'success' && '곧 메인 페이지로 이동합니다.'}
            {callbackState === 'error' && error}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {callbackState === 'loading' && (
            <div className="space-y-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                잠시만 기다려주세요...
              </p>
            </div>
          )}
          
          {callbackState === 'success' && (
            <div className="text-center space-y-4">
              <p className="text-green-700 dark:text-green-300">
                성공적으로 로그인되었습니다!
              </p>
              <Button 
                onClick={() => router.push('/')}
                className="w-full"
              >
                메인으로 이동
              </Button>
            </div>
          )}
          
          {callbackState === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error || '알 수 없는 오류가 발생했습니다.'}
                </p>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleRetry}
                  variant="outline"
                  className="flex-1"
                >
                  메인으로 돌아가기
                </Button>
                <Button 
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  다시 시도
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}