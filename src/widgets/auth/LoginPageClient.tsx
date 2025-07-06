/**
 * Login Page Client Component
 * FSD: widgets/auth
 * 
 * 로그인 페이지 클라이언트 컴포넌트
 */

'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Sparkles } from 'lucide-react'
import { LoginForm } from './LoginForm'
import { useAuth } from '@/features/auth'

export function LoginPageClient() {
  const router = useRouter()
  const { isAuthenticated, isLoading, isInitialized } = useAuth()

  // 이미 인증된 사용자는 대시보드로 리다이렉트
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      console.log('✅ Already authenticated, redirecting to dashboard')
      router.push('/dashboard')
    }
  }, [isAuthenticated, isInitialized, router])

  // 로딩 중일 때
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex items-center space-x-2 text-gray-600">
          <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          <span className="text-lg">로딩 중...</span>
        </div>
      </div>
    )
  }

  // 이미 인증된 사용자는 아무것도 렌더링하지 않음 (리다이렉트 중)
  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-2">
          <MapPin className="w-6 h-6 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">StoryPath</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              당신의 하루가
              <br />
              <span className="text-blue-600">소설이 됩니다</span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              구글 타임라인의 이동 경로를 바탕으로
              <br />
              AI가 만들어주는 나만의 이야기
            </p>
          </div>

          {/* Login Form Widget */}
          <LoginForm />

          {/* Features */}
          <div className="space-y-3 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>실제 이동 경로 기반 스토리</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>AI가 제안하는 선택지로 나만의 이야기</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>언제든 다시 읽을 수 있는 개인 라이브러리</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-gray-500">
        <p>© 2025 StoryPath. AI로 만들어가는 일상의 이야기.</p>
      </footer>
    </div>
  )
}