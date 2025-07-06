/**
 * Authenticated Users Layout
 * Route Group: (authenticated)
 * 
 * 인증된 사용자들만 접근할 수 있는 페이지들의 공통 레이아웃
 * URL에는 영향을 주지 않으면서 논리적으로 그룹화
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // 인증이 초기화되었고 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
    if (isInitialized && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isInitialized, router])

  // 초기화되지 않았거나 인증되지 않은 경우 로딩 표시
  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex items-center space-x-2 text-gray-600">
          <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          <span className="text-lg">인증 확인 중...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {children}
    </div>
  )
}