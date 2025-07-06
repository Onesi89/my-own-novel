/**
 * My Stories Page - Server Component
 * 내 소설 보기 페이지
 */

import { Suspense } from 'react'
import { MyStoriesClient } from '@/widgets/main/MyStoriesClient'

export default function MyStoriesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">소설 목록 불러오는 중...</p>
          </div>
        </div>
      }>
        <MyStoriesClient />
      </Suspense>
    </div>
  )
}