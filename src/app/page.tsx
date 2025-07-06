/**
 * Root Page - Client Component
 * 
 * 인증 상태에 따라 적절한 페이지로 리다이렉트합니다.
 * - 인증된 사용자: /dashboard로 리다이렉트
 * - 인증되지 않은 사용자: /login으로 리다이렉트
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, isInitialized } = useAuth()

  useEffect(() => {
    if (isInitialized) {
      if (isAuthenticated) {
        console.log('✅ User is authenticated, redirecting to dashboard')
        router.push('/dashboard')
      } else {
        console.log('❌ User is not authenticated, redirecting to login')
        router.push('/login')
      }
    }
  }, [isAuthenticated, isInitialized, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex items-center space-x-2 text-gray-600">
        <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
        <span className="text-lg">
          {!isInitialized ? '인증 확인 중...' : '리다이렉트 중...'}
        </span>
      </div>
    </div>
  )
}