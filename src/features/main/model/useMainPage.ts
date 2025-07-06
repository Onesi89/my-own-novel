/**
 * Main Page Hook
 * FSD: features/main/model
 * 
 * 메인페이지 비즈니스 로직 및 상태 관리
 * cursor rules 준수: 커스텀 훅 패턴, 타입 안전성, 에러 핸들링
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/features/auth'
import { useToast } from '@/shared/lib'
import { 
  fetchTimelineData, 
  uploadGoogleTakeoutFile,
  getDateRangeForRequest, 
  validateTimelineData,
  calculateTimelineStats,
  type TimelineLocation
} from '@/features/timeline'

export type DateRange = 'today' | 'yesterday' | 'week' | 'month' | 'custom'

export interface TimelineData {
  id: string
  date: string
  locations: TimelineLocation[]
  storyGenerated?: boolean
}

export interface MainPageState {
  selectedDateRange: DateRange
  timelineData: TimelineData[]
  isLoadingTimeline: boolean
  isGeneratingStory: boolean
  isUploadingFile: boolean
  error: string | null
  lastSyncTime: Date | null
}

export function useMainPage() {
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  const [state, setState] = useState<MainPageState>({
    selectedDateRange: 'today',
    timelineData: [],
    isLoadingTimeline: false,
    isGeneratingStory: false,
    isUploadingFile: false,
    error: null,
    lastSyncTime: null,
  })

  // 날짜 범위 변경
  const setSelectedDateRange = useCallback((range: DateRange) => {
    setState(prev => ({
      ...prev,
      selectedDateRange: range,
      error: null,
    }))
  }, [])

  // 타임라인 데이터 동기화
  const syncTimelineData = useCallback(async () => {
    if (!isAuthenticated || !user) {
      toast({
        title: '인증 필요',
        description: '로그인이 필요한 서비스입니다.',
        variant: 'destructive',
      })
      return
    }

    setState(prev => ({
      ...prev,
      isLoadingTimeline: true,
      error: null,
    }))

    try {
      // 선택된 날짜 범위에 따른 요청 파라미터 생성
      const { start, end } = getDateRangeForRequest(state.selectedDateRange)
      
      console.log(`🔄 Timeline 동기화 시작: ${start} ~ ${end}`)

      // 실제 Timeline API 호출
      const response = await fetchTimelineData({ start, end })

      if (!response.success || !response.data) {
        throw new Error(response.error || '타임라인 데이터를 가져올 수 없습니다.')
      }

      // 데이터 유효성 검사
      const validation = validateTimelineData(response.data.locations)
      if (!validation.isValid) {
        console.warn('Timeline 데이터 유효성 검사 실패:', validation.errors)
        // 경고만 출력하고 계속 진행
      }

      // TimelineData 형식으로 변환
      const timelineData: TimelineData[] = [{
        id: `timeline_${start}_${end}`,
        date: start,
        locations: response.data.locations,
        storyGenerated: false,
      }]

      // 통계 계산
      const stats = calculateTimelineStats(response.data.locations)

      setState(prev => ({
        ...prev,
        timelineData,
        isLoadingTimeline: false,
        lastSyncTime: new Date(),
        error: null,
      }))

      toast({
        title: '동기화 완료',
        description: `${stats.totalLocations}개 위치, ${stats.uniqueDays}일간의 데이터를 가져왔습니다.`,
      })

      console.log('✅ Timeline 동기화 완료:', {
        locations: stats.totalLocations,
        days: stats.uniqueDays,
        accuracy: stats.averageAccuracy
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '타임라인 동기화 중 오류가 발생했습니다.'
      
      setState(prev => ({
        ...prev,
        isLoadingTimeline: false,
        error: errorMessage,
      }))

      toast({
        title: '동기화 실패',
        description: errorMessage,
        variant: 'destructive',
      })

      console.error('❌ Timeline 동기화 실패:', error)
    }
  }, [isAuthenticated, user, state.selectedDateRange, toast])

  // Google Takeout 파일 업로드
  const uploadGoogleTakeout = useCallback(async (file: File) => {
    if (!isAuthenticated || !user) {
      toast({
        title: '인증 필요',
        description: '로그인이 필요한 서비스입니다.',
        variant: 'destructive',
      })
      return
    }

    setState(prev => ({
      ...prev,
      isUploadingFile: true,
      error: null,
    }))

    try {
      console.log(`📂 Google Takeout 파일 업로드 시작: ${file.name} (${Math.round(file.size / 1024)}KB)`)

      // 파일 업로드 및 처리
      const response = await uploadGoogleTakeoutFile(file)

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Google Takeout 파일 처리에 실패했습니다.')
      }

      // TimelineData 형식으로 변환
      const timelineData: TimelineData[] = [{
        id: `takeout_${Date.now()}`,
        date: response.data.metadata.start,
        locations: response.data.locations,
        storyGenerated: false,
      }]

      // 통계 계산
      const stats = calculateTimelineStats(response.data.locations)

      setState(prev => ({
        ...prev,
        timelineData,
        isUploadingFile: false,
        lastSyncTime: new Date(),
        error: null,
      }))

      toast({
        title: '업로드 완료',
        description: `${stats.totalLocations}개 위치, ${stats.uniqueDays}일간의 데이터를 불러왔습니다.`,
      })

      console.log('✅ Google Takeout 업로드 완료:', {
        totalLocations: response.data.metadata.totalLocations,
        timeRange: `${response.data.metadata.start} ~ ${response.data.metadata.end}`,
        accuracy: stats.averageAccuracy
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google Takeout 파일 업로드 중 오류가 발생했습니다.'
      
      setState(prev => ({
        ...prev,
        isUploadingFile: false,
        error: errorMessage,
      }))

      toast({
        title: '업로드 실패',
        description: errorMessage,
        variant: 'destructive',
      })

      console.error('❌ Google Takeout 업로드 실패:', error)
    }
  }, [isAuthenticated, user, toast])

  // 소설 생성
  const generateStory = useCallback(async (
    selectedRoutes: any[], 
    preferences?: any, 
    aiProvider: 'claude' | 'gemini' = 'gemini',
    timelineId?: string
  ) => {
    if (!isAuthenticated || !user) {
      toast({
        title: '인증 필요',
        description: '로그인이 필요한 서비스입니다.',
        variant: 'destructive',
      })
      return
    }

    if (!selectedRoutes || selectedRoutes.length === 0) {
      toast({
        title: '경로 선택 필요',
        description: '먼저 이동 경로를 선택해주세요.',
        variant: 'destructive',
      })
      return
    }

    setState(prev => ({
      ...prev,
      isGeneratingStory: true,
      error: null,
    }))

    try {
      console.log('🚀 소설 생성 시작:', { 
        routeCount: selectedRoutes.length, 
        aiProvider,
        preferences 
      })

      // 실제 소설 생성 API 호출
      const response = await fetch('/api/stories/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedRoutes,
          preferences: preferences || {
            genre: 'adventure',
            style: 'first_person',
            tone: 'light',
            length: 6000
          },
          timelineId,
          aiProvider
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || '소설 생성에 실패했습니다.')
      }

      setState(prev => ({
        ...prev,
        isGeneratingStory: false,
        timelineData: prev.timelineData.map(item => ({
          ...item,
          storyGenerated: true,
        })),
      }))

      toast({
        title: '소설 생성 완료',
        description: `${aiProvider === 'gemini' ? 'Gemini 2.5 Flash' : 'Claude 3.5 Sonnet'}로 소설이 생성되었습니다!`,
      })

      // 생성된 소설로 이동 (추후 구현)
      console.log('✅ 소설 생성 완료:', result.data)
      
      return result.data

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '소설 생성 중 오류가 발생했습니다.'
      
      setState(prev => ({
        ...prev,
        isGeneratingStory: false,
        error: errorMessage,
      }))

      toast({
        title: '소설 생성 실패',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }, [isAuthenticated, user, toast])

  // 에러 초기화
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }))
  }, [])

  // 초기 데이터 로드 (사용자가 인증된 경우)
  useEffect(() => {
    if (isAuthenticated && user && state.timelineData.length === 0) {
      // 자동으로 오늘 데이터 동기화하지 않음 - 사용자가 직접 버튼을 클릭해야 함
      console.log('User authenticated, ready for timeline sync')
    }
  }, [isAuthenticated, user, state.timelineData.length])

  return {
    // 상태
    ...state,
    user,
    isAuthenticated,
    
    // 파생 상태
    hasTimelineData: state.timelineData.length > 0,
    canGenerateStory: state.timelineData.length > 0 && !state.isGeneratingStory,
    isLoading: state.isLoadingTimeline || state.isGeneratingStory || state.isUploadingFile,
    
    // 액션
    setSelectedDateRange,
    syncTimelineData,
    uploadGoogleTakeout,
    generateStory,
    clearError,
    
    // 유틸리티
    getDateRangeLabel: (range: DateRange) => {
      const labels = {
        today: '오늘',
        yesterday: '어제',
        week: '지난 주',
        month: '지난 달',
        custom: '직접 선택',
      }
      return labels[range]
    },
  }
}