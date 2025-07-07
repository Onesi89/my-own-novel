/**
 * Route Selection Card Component
 * FSD: features/story/ui/CreateStory
 * 
 * 지도에서 경로 선택 카드
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { MapPin, Route, ArrowRight } from 'lucide-react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui'
import { useStoryCreation } from '../../context/StoryCreationContext'

export function RouteSelectionCard() {
  const { openModal } = useStoryCreation()

  const handleRouteSelection = () => {
    // 지도에서 직접 경로 그리기 모달 열기 (타임라인 데이터 불필요)
    openModal('isDirectMapSelectionOpen')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.6 }}
    >
      <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200 bg-gradient-to-br from-blue-50 to-white group cursor-pointer"
            onClick={handleRouteSelection}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                지도에서 경로 선택하기
              </CardTitle>
              <CardDescription className="text-blue-600 font-medium">
                체험용 • 빠른 시작
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-gray-600 leading-relaxed">
            지도에서 직접 장소들을 클릭하고 경로를 그려서 
            체험용 이야기를 만들어보세요.
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>타임라인 데이터 불필요</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>지도에서 직접 경로 그리기</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>즉시 체험 가능</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <Button 
              className="w-full group-hover:bg-blue-600 transition-colors"
            >
              <Route className="w-4 h-4 mr-2" />
              지도에서 경로 그리기
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
            💡 Google 타임라인 없이도 바로 체험할 수 있어요!
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}