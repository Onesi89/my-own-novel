/**
 * Login Page - Server Component
 * 로그인 전용 페이지
 */

import { Suspense } from 'react'
import { LoginPageClient } from '@/widgets/auth/LoginPageClient'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex items-center space-x-2 text-gray-600">
          <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          <span className="text-lg">로딩 중...</span>
        </div>
      </div>
    }>
      <LoginPageClient />
    </Suspense>
  )
}