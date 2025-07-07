/**
 * Story Generation Card Component
 * FSD: features/story/ui/CreateStory
 * 
 * 소설 생성하기 카드 (Google 타임라인 업로드)
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Upload, ArrowRight, FileText } from 'lucide-react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui'
import { useStoryCreation } from '../../context/StoryCreationContext'
import { useMainPage } from '@/features/main'

export function StoryGenerationCard() {
  const { openModal } = useStoryCreation()
  const { timelineData } = useMainPage()
  
  const allLocations = timelineData.flatMap(data => data.locations || [])
  const hasTimelineData = allLocations.length > 0

  const handleStoryGeneration = () => {
    // Google 타임라인 파일 업로드 모달 열기
    openModal('isTimelineUploadOpen')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
    >
      <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-200 bg-gradient-to-br from-purple-50 to-white group cursor-pointer"
            onClick={handleStoryGeneration}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Google 타임라인 업로드
              </CardTitle>
              <CardDescription className="text-purple-600 font-medium">
                개인화 • 실제 데이터 기반
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-gray-600 leading-relaxed">
            Google 타임라인을 업로드하여 실제 이동 경로를 바탕으로 
            개인화된 소설을 만들어보세요.
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>실제 위치 데이터 기반</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>개인화된 스토리</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>다양한 장르 선택 가능</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <Button 
              variant="outline"
              className="w-full border-purple-200 text-purple-700 group-hover:bg-purple-50 transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              타임라인 업로드하기
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {hasTimelineData && (
            <div className="text-xs text-green-600 bg-green-50 p-2 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>타임라인 데이터 {allLocations.length}개 위치 로드됨</span>
            </div>
          )}
          
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
            💡 Google Takeout에서 위치 기록 데이터를 JSON 형식으로 다운로드하세요
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}