/**
 * Create Story Client Component (Composed)
 * FSD: widgets/main
 * 
 * Component Composition Pattern이 적용된 새 소설 만들기 클라이언트
 * 기존 855줄에서 약 200줄로 단순화
 */

'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMainPage } from '@/features/main'
import { StoryCreationProvider, useStoryCreation } from '@/features/story/context/StoryCreationContext'
import { StoryCreationHeader } from '@/features/story/ui/StoryCreationHeader'
import { FileUploadSection } from '@/features/story/ui/FileUploadSection'
import { RouteSelectionSection } from '@/features/story/ui/RouteSelectionSection'
import { RouteConfirmModal } from '@/features/story/ui/RouteConfirmModal'
import { MapRouteSelectorEmbedded } from './MapRouteSelectorEmbedded'
import { InlineStorySetup } from '@/features/story/InlineStorySetup'
import { InteractiveStoryFlow } from '@/features/story/InteractiveStoryFlow'
import { RouteEditingFlow } from '@/features/story/RouteEditingFlow'

// 내부 컴포넌트 (컨텍스트 사용)
function CreateStoryContent() {
  const { state, openModal, closeModal, setSelectedRoutes, setStorySettings } = useStoryCreation()
  const {
    timelineData,
    isLoadingTimeline,
    isGeneratingStory,
    isUploadingFile,
    uploadGoogleTakeout,
    generateStory
  } = useMainPage()

  // 플랫화된 위치 데이터
  const allLocations = timelineData.flatMap(data => data.locations || [])
  const hasTimelineData = allLocations.length > 0

  // 파일 업로드 핸들러
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const fileSizeMB = file.size / (1024 * 1024)
      
      if (fileSizeMB > 50) {
        if (!state.filterDates.start || !state.filterDates.end) {
          alert('파일이 큽니다 (50MB+). 날짜 범위를 선택해서 필터링 후 업로드하세요.')
          return
        }
        await processAndUploadLargeFile(file)
      } else {
        uploadGoogleTakeout(file)
      }
    }
    event.target.value = ''
  }

  // 대용량 파일 처리
  const processAndUploadLargeFile = async (file: File) => {
    try {
      const { processGoogleTakeoutFile } = await import('@/features/timeline/api/clientFileProcessor')
      
      const result = await processGoogleTakeoutFile(file, {
        startDate: state.filterDates.start,
        endDate: state.filterDates.end,
        maxLocations: 1000
      })

      if (result.success && result.data) {
        const filteredData = {
          locations: result.data.locations,
          metadata: result.data.metadata
        }
        
        const blob = new Blob([JSON.stringify(filteredData)], { type: 'application/json' })
        const processedFile = new File([blob], `filtered_${file.name}`, { type: 'application/json' })
        
        uploadGoogleTakeout(processedFile)
      } else {
        alert(`파일 처리 실패: ${result.error}`)
      }
    } catch (error) {
      console.error('대용량 파일 처리 오류:', error)
      alert('파일 처리 중 오류가 발생했습니다.')
    }
  }

  // 경로 선택 모달 열기
  const handleOpenRouteSelection = () => {
    openModal('isRouteSelectionOpen')
  }

  // 경로 선택 완료
  const handleRouteSelectionComplete = (routes: any[]) => {
    setSelectedRoutes(routes)
    closeModal('isRouteSelectionOpen')
    openModal('isRouteConfirmOpen')
  }

  // 경로 수정
  const handleEditRoutes = () => {
    closeModal('isRouteConfirmOpen')
    openModal('isRouteEditingOpen')
  }

  // 스토리 설정 진행
  const handleProceedToStorySetup = () => {
    closeModal('isRouteConfirmOpen')
    openModal('isInlineStorySetupOpen')
  }

  // 스토리 설정 완료
  const handleStorySetupComplete = (settings: any) => {
    setStorySettings(settings)
    closeModal('isInlineStorySetupOpen')
    openModal('isInteractiveStoryOpen')
  }

  // 경로 편집 완료
  const handleRouteEditingComplete = (editedRoutes: any[]) => {
    setSelectedRoutes(editedRoutes)
    closeModal('isRouteEditingOpen')
    openModal('isRouteConfirmOpen')
  }

  // 메인 콘텐츠 렌더링
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StoryCreationHeader />
        
        <AnimatePresence mode="wait">
          <motion.div
            key="main-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* 파일 업로드 섹션 */}
            <FileUploadSection 
              isUploadingFile={isUploadingFile}
              onFileUpload={handleFileUpload}
            />
            
            {/* 경로 선택 섹션 */}
            <RouteSelectionSection
              hasTimelineData={hasTimelineData}
              onOpenRouteSelection={handleOpenRouteSelection}
            />
          </motion.div>
        </AnimatePresence>

        {/* 모달들 */}
        {state.modals.isRouteSelectionOpen && (
          <MapRouteSelectorEmbedded
            timelineData={allLocations}
            onRouteSelect={handleRouteSelectionComplete}
            onCancel={() => closeModal('isRouteSelectionOpen')}
            maxRoutes={5}
          />
        )}

        <RouteConfirmModal
          onEdit={handleEditRoutes}
          onProceedToStorySetup={handleProceedToStorySetup}
        />

        {state.modals.isInlineStorySetupOpen && (
          <InlineStorySetup
            routesCount={state.selectedRoutes.length}
            onComplete={handleStorySetupComplete}
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
            onComplete={handleRouteEditingComplete}
            onBack={() => closeModal('isRouteEditingOpen')}
          />
        )}
      </div>
    </div>
  )
}

// 메인 컴포넌트 (Provider로 감싸기)
export function CreateStoryClientComposed() {
  return (
    <StoryCreationProvider>
      <CreateStoryContent />
    </StoryCreationProvider>
  )
}