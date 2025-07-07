/**
 * Error State Component
 * FSD: features/story/ui/StoryReader
 * 
 * 스토리 로딩 에러 상태
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/ui'
import { useStoryReader } from '../../context/StoryReaderContext'

interface ErrorStateProps {
  storyId: string
}

export function ErrorState({ storyId }: ErrorStateProps) {
  const router = useRouter()
  const { state, loadStory } = useStoryReader()

  const handleRetry = () => {
    loadStory(storyId)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="flex justify-center">
          <div className="p-4 bg-red-100 rounded-full">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">
            소설을 불러올 수 없습니다
          </h2>
          <p className="text-gray-600">
            {state.error || '알 수 없는 오류가 발생했습니다.'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => router.push('/my-stories')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            목록으로 돌아가기
          </Button>
          
          <Button
            onClick={handleRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            다시 시도
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 mt-4">
          문제가 계속 발생하면 관리자에게 문의해주세요.
        </div>
      </div>
    </div>
  )
}