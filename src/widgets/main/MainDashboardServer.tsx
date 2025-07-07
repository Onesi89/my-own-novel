/**
 * Main Dashboard Server Component
 * FSD: widgets/main
 * 
 * 로그인 후 메인 대시보드 - 서버 컴포넌트
 */

import React from 'react'
import { Suspense } from 'react'
import { 
  MapPin, 
  Sparkles
} from 'lucide-react'
import { MainDashboardClient } from './MainDashboardClient'
import { UserMenu } from './UserMenu'

export function MainDashboardServer() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <MapPin className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">StoryPath</span>
            </div>

            {/* User Menu - 클라이언트에서 처리 */}
            <Suspense fallback={
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            }>
              <UserMenu />
            </Suspense>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-blue-100 rounded-full">
                <Sparkles className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              나만의 특별한 소설을 만들어보세요!
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              구글 타임라인의 이동 경로를 바탕으로 나만의 특별한 소설을 만들어보세요.
            </p>
          </div>

          {/* 클라이언트 컴포넌트에서 나머지 처리 */}
          <Suspense fallback={
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
                    <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="w-full h-3 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          }>
            <MainDashboardClient />
          </Suspense>
        </div>
      </main>
    </div>
  )
}