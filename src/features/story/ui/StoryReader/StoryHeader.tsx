/**
 * Story Header Component
 * FSD: features/story/ui/StoryReader
 * 
 * 스토리 리더의 헤더 영역 (네비게이션, 공유, 다운로드)
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Share2, Download } from 'lucide-react'
import { Button } from '@/shared/ui'
import { useStoryReader } from '../../context/StoryReaderContext'

export function StoryHeader() {
  const router = useRouter()
  const { handleShare, handleDownload } = useStoryReader()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/my-stories')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">내 소설 목록</span>
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              title="공유하기"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              title="다운로드"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}