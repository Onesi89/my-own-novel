/**
 * Quick Actions Grid Component
 * FSD: features/main/ui
 * 
 * 빠른 액션 버튼들의 그리드
 */

'use client'

import React from 'react'
import { Plus, BookOpen } from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
} from '@/shared/ui'

interface QuickActionsGridProps {
  isGeneratingStory: boolean
  onCreateNewStory: () => void
  onViewMyStories?: () => void
}

export function QuickActionsGrid({ 
  isGeneratingStory, 
  onCreateNewStory,
  onViewMyStories 
}: QuickActionsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* 새 소설 만들기 */}
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow" 
        onClick={onCreateNewStory}
      >
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-purple-100 rounded-full">
              {isGeneratingStory ? (
                <div className="w-6 h-6 animate-spin rounded-full border-2 border-purple-300 border-t-purple-600"></div>
              ) : (
                <Plus className="w-6 h-6 text-purple-600" />
              )}
            </div>
          </div>
          <CardTitle className="text-lg">
            {isGeneratingStory ? '소설 생성 중...' : '새 소설 만들기'}
          </CardTitle>
          <CardDescription>
            {isGeneratingStory 
              ? 'AI가 이동 경로를 바탕으로 소설을 만들고 있습니다...'
              : '지도에서 이동 경로를 선택하여 AI가 새로운 소설을 생성합니다'
            }
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 내 소설 보기 */}
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={onViewMyStories}
      >
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <BookOpen className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <CardTitle className="text-lg">내 소설 보기</CardTitle>
          <CardDescription>
            지금까지 생성한 소설들을 확인하고 관리합니다
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}