/**
 * Timeline Data Processor Hook
 * FSD: features/timeline/model
 * 
 * 구글 타임라인 데이터 처리 및 자동 경로 표시를 위한 커스텀 훅
 */

import { useState, useCallback, useMemo } from 'react'
import type { TimelineLocation } from '../types'

interface PlaceInfo {
  customName?: string
  category: 'home' | 'work' | 'leisure' | 'shopping' | 'dining' | 'transport' | 'other'
  description?: string
  storyHint?: string
  isPrivate?: boolean
}

interface RoutePoint {
  id: string
  lat: number
  lng: number
  timestamp: string
  address?: string
  duration?: number
  isSelected: boolean
  customInfo?: PlaceInfo
  storyPriority?: number
  confidence?: number
}

interface AutoRouteConfig {
  enableClustering: boolean
  maxDisplayRoutes: number
  priorityWeights: {
    duration: number
    recency: number
    category: number
    userRating: number
  }
}

interface TimelineDataProcessorState {
  processedRoutes: RoutePoint[]
  selectedRoutes: RoutePoint[]
  autoSelectedRoutes: RoutePoint[]
  isProcessing: boolean
  processingError: string | null
  lastProcessedTime: Date | null
}

const DEFAULT_CONFIG: AutoRouteConfig = {
  enableClustering: true,
  maxDisplayRoutes: 10,
  priorityWeights: {
    duration: 0.4,
    recency: 0.3,
    category: 0.2,
    userRating: 0.1
  }
}

export function useTimelineDataProcessor(config: Partial<AutoRouteConfig> = {}) {
  const [state, setState] = useState<TimelineDataProcessorState>({
    processedRoutes: [],
    selectedRoutes: [],
    autoSelectedRoutes: [],
    isProcessing: false,
    processingError: null,
    lastProcessedTime: null
  })

  const mergedConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config
  }), [config])

  // 타임라인 데이터를 RoutePoint로 변환
  const processTimelineData = useCallback(async (timelineData: TimelineLocation[]) => {
    setState(prev => ({ ...prev, isProcessing: true, processingError: null }))

    try {
      // 1. 데이터 정규화 및 필터링
      const normalizedData = normalizeTimelineData(timelineData)
      
      // 2. 중복 제거 및 클러스터링
      const clusteredData = mergedConfig.enableClustering 
        ? await performClustering(normalizedData)
        : normalizedData

      // 3. 우선순위 계산
      const prioritizedData = calculatePriority(clusteredData, mergedConfig.priorityWeights)

      // 4. RoutePoint로 변환
      const processedRoutes: RoutePoint[] = prioritizedData.map((location, index) => ({
        id: location.id,
        lat: location.latitude,
        lng: location.longitude,
        timestamp: location.timestamp,
        address: location.address,
        duration: location.duration,
        isSelected: false,
        storyPriority: Math.max(1, Math.min(5, Math.round(location.confidence || 3))),
        confidence: location.confidence || 0.5
      }))

      // 5. 자동 경로 선택
      const autoSelected = selectOptimalRoutes(processedRoutes, mergedConfig.maxDisplayRoutes)

      setState(prev => ({
        ...prev,
        processedRoutes,
        autoSelectedRoutes: autoSelected,
        selectedRoutes: autoSelected.slice(0, 5), // 최대 5개까지만 기본 선택
        isProcessing: false,
        lastProcessedTime: new Date()
      }))

      return { success: true, data: processedRoutes }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '데이터 처리 중 오류가 발생했습니다'
      setState(prev => ({
        ...prev,
        isProcessing: false,
        processingError: errorMessage
      }))
      return { success: false, error: errorMessage }
    }
  }, [mergedConfig])

  // 경로 선택/해제
  const toggleRouteSelection = useCallback((routeId: string) => {
    setState(prev => {
      const route = prev.processedRoutes.find(r => r.id === routeId)
      if (!route) return prev

      const isCurrentlySelected = prev.selectedRoutes.some(r => r.id === routeId)
      
      if (isCurrentlySelected) {
        // 선택 해제
        return {
          ...prev,
          selectedRoutes: prev.selectedRoutes.filter(r => r.id !== routeId)
        }
      } else {
        // 선택 (최대 5개 제한)
        if (prev.selectedRoutes.length >= 5) {
          return prev // 최대 개수 초과 시 선택하지 않음
        }
        return {
          ...prev,
          selectedRoutes: [...prev.selectedRoutes, { ...route, isSelected: true }]
        }
      }
    })
  }, [])

  // 장소 정보 업데이트
  const updatePlaceInfo = useCallback((routeId: string, placeInfo: PlaceInfo) => {
    setState(prev => ({
      ...prev,
      processedRoutes: prev.processedRoutes.map(route =>
        route.id === routeId ? { ...route, customInfo: placeInfo } : route
      ),
      selectedRoutes: prev.selectedRoutes.map(route =>
        route.id === routeId ? { ...route, customInfo: placeInfo } : route
      )
    }))
  }, [])

  // 모든 선택 해제
  const clearAllSelections = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedRoutes: []
    }))
  }, [])

  // 자동 선택 적용
  const applyAutoSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedRoutes: [...prev.autoSelectedRoutes.slice(0, 5)]
    }))
  }, [])

  return {
    // 상태
    processedRoutes: state.processedRoutes,
    selectedRoutes: state.selectedRoutes,
    autoSelectedRoutes: state.autoSelectedRoutes,
    isProcessing: state.isProcessing,
    processingError: state.processingError,
    lastProcessedTime: state.lastProcessedTime,
    
    // 파생 상태
    canSelectMore: state.selectedRoutes.length < 5,
    hasAutoSelection: state.autoSelectedRoutes.length > 0,
    hasProcessedData: state.processedRoutes.length > 0,
    
    // 액션
    processTimelineData,
    toggleRouteSelection,
    updatePlaceInfo,
    clearAllSelections,
    applyAutoSelection
  }
}

// 내부 유틸리티 함수들

function normalizeTimelineData(data: TimelineLocation[]): TimelineLocation[] {
  return data
    .filter(location => {
      // 유효한 좌표인지 확인
      return location.latitude && location.longitude && 
             Math.abs(location.latitude) <= 90 && 
             Math.abs(location.longitude) <= 180
    })
    .map(location => ({
      ...location,
      // E7 형식을 일반 좌표로 변환
      latitude: Math.abs(location.latitude) > 180 ? location.latitude / 1e7 : location.latitude,
      longitude: Math.abs(location.longitude) > 180 ? location.longitude / 1e7 : location.longitude,
      // 타임스탬프 정규화
      timestamp: new Date(location.timestamp).toISOString()
    }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

async function performClustering(data: TimelineLocation[]): Promise<TimelineLocation[]> {
  // 지리적 클러스터링 구현
  const CLUSTER_DISTANCE_THRESHOLD = 0.001 // 약 100m
  const clustered: TimelineLocation[] = []
  
  for (const location of data) {
    const existingCluster = clustered.find(cluster => {
      const distance = calculateDistance(
        location.latitude, location.longitude,
        cluster.latitude, cluster.longitude
      )
      return distance < CLUSTER_DISTANCE_THRESHOLD
    })
    
    if (existingCluster) {
      // 기존 클러스터에 병합 (더 긴 체류 시간을 가진 것을 우선)
      if ((location.duration || 0) > (existingCluster.duration || 0)) {
        const index = clustered.indexOf(existingCluster)
        clustered[index] = { ...location, duration: (location.duration || 0) + (existingCluster.duration || 0) }
      }
    } else {
      clustered.push(location)
    }
  }
  
  return clustered
}

function calculatePriority(
  data: TimelineLocation[], 
  weights: AutoRouteConfig['priorityWeights']
): (TimelineLocation & { confidence: number })[] {
  const now = new Date().getTime()
  const maxDuration = Math.max(...data.map(d => d.duration || 0))
  
  return data.map(location => {
    const duration = location.duration || 0
    const recency = 1 - (now - new Date(location.timestamp).getTime()) / (7 * 24 * 60 * 60 * 1000) // 7일 기준
    
    const durationScore = maxDuration > 0 ? duration / maxDuration : 0
    const recencyScore = Math.max(0, Math.min(1, recency))
    const categoryScore = 0.5 // TODO: 카테고리별 가중치 적용
    const userRatingScore = 0.5 // TODO: 사용자 평가 반영
    
    const confidence = 
      weights.duration * durationScore +
      weights.recency * recencyScore +
      weights.category * categoryScore +
      weights.userRating * userRatingScore
    
    return {
      ...location,
      confidence: Math.max(0, Math.min(1, confidence))
    }
  })
}

function selectOptimalRoutes(routes: RoutePoint[], maxCount: number): RoutePoint[] {
  // 신뢰도 기준 정렬
  const sortedRoutes = [...routes].sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
  
  // 시간 순서와 지리적 연결성을 고려한 선택
  const selected: RoutePoint[] = []
  
  for (const route of sortedRoutes) {
    if (selected.length >= maxCount) break
    
    // 이미 비슷한 시간대/위치에 선택된 경로가 있는지 확인
    const hasSimilar = selected.some(selectedRoute => {
      const timeDiff = Math.abs(
        new Date(route.timestamp).getTime() - new Date(selectedRoute.timestamp).getTime()
      )
      const distance = calculateDistance(
        route.lat, route.lng,
        selectedRoute.lat, selectedRoute.lng
      )
      
      return timeDiff < 30 * 60 * 1000 && distance < 0.01 // 30분 이내, 1km 이내
    })
    
    if (!hasSimilar) {
      selected.push(route)
    }
  }
  
  return selected.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}