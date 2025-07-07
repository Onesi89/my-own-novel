/**
 * Route Selection Section Component
 * FSD: features/story/ui
 * 
 * 경로 선택 섹션 (지도 기반)
 */

'use client'

import React from 'react'
import { MapPin, Route, Sparkles } from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Button
} from '@/shared/ui'
import { useStoryCreation } from '../context/StoryCreationContext'

interface RouteSelectionSectionProps {
  hasTimelineData: boolean
  onOpenRouteSelection: () => void
}

export function RouteSelectionSection({ 
  hasTimelineData, 
  onOpenRouteSelection 
}: RouteSelectionSectionProps) {
  const { state } = useStoryCreation()
  
  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <MapPin className="w-5 h-5" />
          지도에서 경로 선택하기
        </CardTitle>
        <CardDescription className="text-purple-700">
          {hasTimelineData 
            ? "업로드된 타임라인 데이터에서 흥미로운 경로를 선택해보세요"
            : "샘플 데이터로 경로 선택을 체험해보세요"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="font-medium text-purple-900 flex items-center gap-2">
                <Route className="w-4 h-4" />
                1. 경로 선택
              </div>
              <p className="text-purple-700">지도에서 최대 5개의 장소를 선택하세요.</p>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-purple-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                2. 소설 생성
              </div>
              <p className="text-purple-700">AI가 선택한 경로를 바탕으로 소설을 생성합니다.</p>
            </div>
          </div>
          
          <Button 
            onClick={onOpenRouteSelection}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            size="lg"
          >
            <MapPin className="w-4 h-4 mr-2" />
            {hasTimelineData ? "내 경로에서 선택하기" : "샘플 경로로 체험하기"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}