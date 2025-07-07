/**
 * Create Story Client Simple Component
 * FSD: widgets/main
 * 
 * 단순한 두 개 카드 UI - Component Composition Pattern 적용
 * 1. 지도에서 경로 선택하기
 * 2. 소설 생성하기
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  MapPin,
  Route,
  FileText,
  Sparkles
} from 'lucide-react'
import { 
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/shared/ui'
import { useMainPage } from '@/features/main'
import { StoryCreationProvider, useStoryCreation } from '@/features/story/context/StoryCreationContext'

// 메인 카드 컴포넌트들
import { RouteSelectionCard } from '@/features/story/ui/CreateStory/RouteSelectionCard'
import { StoryGenerationCard } from '@/features/story/ui/CreateStory/StoryGenerationCard'

// 모달 컴포넌트들
import { MapRouteSelectorEmbedded } from './MapRouteSelectorEmbedded'
// import { DirectMapSelector } from '@/features/map/ui/DirectMapSelector'
// import { TimelineUploadModal } from '@/features/story/ui/TimelineUploadModal'
import { InlineStorySetup } from '@/features/story/InlineStorySetup'
import { InteractiveStoryFlow } from '@/features/story/InteractiveStoryFlow'
import { RouteEditingFlow } from '@/features/story/RouteEditingFlow'

// 내부 컴포넌트 (컨텍스트 사용)
function CreateStoryContent() {
  const router = useRouter()
  const { state, openModal, closeModal } = useStoryCreation()
  const { timelineData } = useMainPage()

  // 뒤로가기
  const handleBack = () => {
    router.push('/dashboard')
  }

  // 플래튼된 위치 데이터
  const allLocations = timelineData.flatMap(data => data.locations || [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">대시보드로 돌아가기</span>
            </Button>
            
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">새 소설 만들기</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            어떻게 소설을 만드시겠어요?
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            두 가지 방법 중 하나를 선택해서 나만의 특별한 이야기를 만들어보세요.
          </p>
        </div>

        {/* 두 개의 메인 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 경로 선택 카드 */}
          <RouteSelectionCard />
          
          {/* 소설 생성 카드 */}
          <StoryGenerationCard />
        </div>

        {/* 추가 정보 */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">처음 사용하시나요?</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              지도에서 경로를 선택하면 체험용 이야기를, Google 타임라인을 업로드하면 
              실제 이동 경로를 바탕으로 한 개인화된 소설을 만들 수 있습니다.
            </p>
          </div>
        </motion.div>
      </main>

      {/* 모달들 */}
      
      {/* 지도에서 직접 경로 그리기 모달 - TODO: 구현 필요 */}
      {state.modals.isDirectMapSelectionOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg">
            <h2 className="text-xl font-bold mb-4">지도에서 경로 그리기</h2>
            <p className="text-gray-600 mb-4">이 기능은 곧 구현될 예정입니다.</p>
            <button 
              onClick={() => closeModal('isDirectMapSelectionOpen')}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Google 타임라인 업로드 모달 - TODO: 구현 필요 */}
      {state.modals.isTimelineUploadOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Google 타임라인 업로드</h2>
            <p className="text-gray-600 mb-4">이 기능은 곧 구현될 예정입니다.</p>
            <button 
              onClick={() => closeModal('isTimelineUploadOpen')}
              className="px-4 py-2 bg-purple-600 text-white rounded"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 업로드된 타임라인에서 경로 선택 모달 */}
      {state.modals.isMapSelectorOpen && allLocations.length > 0 && (
        <MapRouteSelectorEmbedded
          timelineData={allLocations}
          onRouteSelect={(routes) => {
            // 선택된 경로로 스토리 설정 모달 열기
            openModal('isInlineStorySetupOpen')
            closeModal('isMapSelectorOpen')
          }}
          onCancel={() => closeModal('isMapSelectorOpen')}
          maxRoutes={5}
        />
      )}

      {state.modals.isInlineStorySetupOpen && (
        <InlineStorySetup
          routesCount={state.selectedRoutes.length}
          onComplete={(settings) => {
            // 인터랙티브 스토리 플로우로 이동
            openModal('isInteractiveStoryOpen')
            closeModal('isInlineStorySetupOpen')
          }}
          onBack={() => closeModal('isInlineStorySetupOpen')}
        />
      )}

      {state.modals.isInteractiveStoryOpen && state.storySettings && (
        <InteractiveStoryFlow
          routes={state.selectedRoutes}
          settings={state.storySettings}
          onComplete={(session) => {
            console.log('Story completed:', session)
            closeModal('isInteractiveStoryOpen')
          }}
          onBack={() => closeModal('isInteractiveStoryOpen')}
        />
      )}

      {state.modals.isRouteEditingOpen && (
        <RouteEditingFlow
          routes={state.selectedRoutes}
          onComplete={(editedRoutes) => {
            console.log('Routes edited:', editedRoutes)
            closeModal('isRouteEditingOpen')
          }}
          onBack={() => closeModal('isRouteEditingOpen')}
        />
      )}
    </div>
  )
}

// 메인 컴포넌트
export function CreateStoryClientSimple() {
  return (
    <StoryCreationProvider>
      <CreateStoryContent />
    </StoryCreationProvider>
  )
}