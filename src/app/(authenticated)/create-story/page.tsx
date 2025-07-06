/**
 * Create Story Page - Server Component
 * 새 소설 만들기 페이지
 */

import { Suspense } from 'react'
import { CreateStoryClient } from '@/widgets/main/CreateStoryClient'

export default function CreateStoryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">새 소설 만들기 준비 중...</p>
          </div>
        </div>
      }>
        <CreateStoryClient />
      </Suspense>
    </div>
  )
}