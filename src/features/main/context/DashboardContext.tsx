/**
 * Dashboard Context
 * FSD: features/main/context
 * 
 * MainDashboard의 상태 관리를 위한 컨텍스트
 */

'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '@/features/auth'
import { useMainPage } from '@/features/main'

interface DashboardContextType {
  // useAuth에서 가져오는 것들
  user: any
  logout: () => Promise<void>
  
  // useMainPage에서 가져오는 것들
  selectedDateRange: any
  timelineData: any[]
  isLoadingTimeline: boolean
  isGeneratingStory: boolean
  isUploadingFile: boolean
  hasTimelineData: boolean
  canGenerateStory: boolean
  lastSyncTime: Date | null
  setSelectedDateRange: (range: any) => void
  syncTimelineData: () => Promise<void>
  uploadGoogleTakeout: (file: File, startDate?: string, endDate?: string) => Promise<void>
  generateStory: (routes: any[]) => Promise<void>
  getDateRangeLabel: (range: any) => string
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

interface DashboardProviderProps {
  children: ReactNode
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const { user, logout } = useAuth()
  const mainPageData = useMainPage()

  const contextValue: DashboardContextType = {
    user,
    logout,
    ...mainPageData
  }

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}