/**
 * Story Creation Header Component
 * FSD: features/story/ui
 * 
 * 스토리 생성 페이지의 헤더 (뒤로가기 + 제목)
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/shared/ui'

interface StoryCreationHeaderProps {
  title?: string
  subtitle?: string
  showBackButton?: boolean
  onBack?: () => void
}

export function StoryCreationHeader({ 
  title = "새 소설 만들기",
  subtitle = "이동 경로를 선택하고 나만의 소설을 생성해보세요",
  showBackButton = true,
  onBack
}: StoryCreationHeaderProps) {
  const router = useRouter()
  
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.push('/dashboard')
    }
  }
  
  return (
    <div className="flex items-center gap-4 mb-8">
      {showBackButton && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          뒤로가기
        </Button>
      )}
      
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && (
          <p className="text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  )
}