/**
 * Main Dashboard Composed Component
 * FSD: widgets/main
 * 
 * Component Composition Pattern이 적용된 메인 대시보드
 * 기존 404줄에서 약 100줄로 단순화
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMainPage } from '@/features/main'
import { DashboardLayout, DashboardHeader, DashboardContent } from '@/shared/ui/layout/DashboardLayout'
import { DashboardBrand } from '@/features/main/ui/DashboardBrand'
import { UserMenuSection } from '@/features/main/ui/UserMenuSection'
import { WelcomeSection } from '@/features/main/ui/WelcomeSection'
import { QuickActionsGrid } from '@/features/main/ui/QuickActionsGrid'
import { TimelineGuideCard } from '@/features/main/ui/TimelineGuideCard'
import { DateRangeSelector } from '@/features/main/ui/DateRangeSelector'
import { RecentActivityCard } from '@/features/main/ui/RecentActivityCard'
import { MapRouteSelector } from './MapRouteSelector'

export function MainDashboardComposed() {
  const router = useRouter()
  const {
    user,
    selectedDateRange,
    timelineData,
    isGeneratingStory,
    hasTimelineData,
    setSelectedDateRange,
    generateStory,
    getDateRangeLabel,
  } = useMainPage()

  // UI 상태 관리
  const [currentView, setCurrentView] = useState<'dashboard' | 'map-selector'>('dashboard')

  // 새 소설 만들기 핸들러
  const handleCreateNewStory = () => {
    router.push('/create-story')
  }

  // 내 소설 보기 핸들러
  const handleViewMyStories = () => {
    router.push('/my-stories')
  }

  // 경로 선택 완료 핸들러
  const handleRouteSelect = (selectedRoutes: any[]) => {
    console.log('Selected routes:', selectedRoutes)
    generateStory(selectedRoutes)
    setCurrentView('dashboard')
  }
  
  // 맵 선택기 취소 핸들러  
  const handleMapCancel = () => {
    setCurrentView('dashboard')
  }

  // 현재 뷰에 따른 렌더링
  if (currentView === 'map-selector') {
    const allLocations = timelineData.flatMap(data => data.locations || [])
    
    return (
      <MapRouteSelector
        timelineData={allLocations}
        onRouteSelect={handleRouteSelect}
        onCancel={handleMapCancel}
        maxRoutes={5}
      />
    )
  }

  // 메인 대시보드 렌더링
  return (
    <DashboardLayout>
      {/* Header */}
      <DashboardHeader>
        <DashboardBrand />
        <UserMenuSection user={user} />
      </DashboardHeader>

      {/* Main Content */}
      <DashboardContent>
        {/* Welcome Section */}
        <WelcomeSection user={user} />

        {/* Quick Actions */}
        <QuickActionsGrid 
          isGeneratingStory={isGeneratingStory}
          onCreateNewStory={handleCreateNewStory}
          onViewMyStories={handleViewMyStories}
        />

        {/* Google Takeout 안내 */}
        <TimelineGuideCard />

        {/* Date Range Selector */}
        <DateRangeSelector
          selectedRange={selectedDateRange}
          onRangeChange={setSelectedDateRange}
          getRangeLabel={getDateRangeLabel}
        />

        {/* Recent Activity */}
        <RecentActivityCard
          hasTimelineData={hasTimelineData}
          timelineDataLength={timelineData.length}
          hasGeneratedStory={timelineData.some(t => t.storyGenerated)}
        />
      </DashboardContent>
    </DashboardLayout>
  )
}