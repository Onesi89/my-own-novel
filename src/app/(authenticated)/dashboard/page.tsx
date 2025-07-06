/**
 * Dashboard Page - @auth parallel route
 * 인증된 사용자를 위한 메인 대시보드
 */

import { Suspense } from 'react'
import { MainDashboardServer } from '@/widgets/main/MainDashboardServer'

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex items-center space-x-2 text-gray-600">
          <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          <span className="text-lg">대시보드 로딩 중...</span>
        </div>
      </div>
    }>
      <MainDashboardServer />
    </Suspense>
  )
}