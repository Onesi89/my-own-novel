/**
 * Story Finish Page - 소설 완료 페이지 (서버 컴포넌트)
 */

import { Suspense } from 'react'
import { StoryFinishDataProvider } from '@/features/story/StoryFinishDataProvider'

export default function StoryFinishPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">소설 완료 페이지 로딩 중...</p>
          </div>
        </div>
      }>
        <StoryFinishDataProvider />
      </Suspense>
    </div>
  )
}