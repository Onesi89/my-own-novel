/**
 * Loading State Component
 * FSD: features/story/ui/StoryReader
 * 
 * 스토리 로딩 중 상태
 */

'use client'

import React from 'react'
import { Loader2, BookOpen } from 'lucide-react'

export function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <BookOpen className="w-12 h-12 text-blue-600" />
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin absolute -top-1 -right-1" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">
            소설을 불러오는 중...
          </h2>
          <p className="text-gray-600">
            잠시만 기다려주세요.
          </p>
        </div>
        
        {/* Loading skeleton */}
        <div className="max-w-md mx-auto mt-8 space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>
      </div>
    </div>
  )
}