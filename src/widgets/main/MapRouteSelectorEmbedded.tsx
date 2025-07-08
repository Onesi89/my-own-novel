/**
 * Map Route Selector Embedded Widget
 * FSD: widgets/main
 * 
 * 모달 내부에서 사용되는 임베디드 지도 경로 선택 컴포넌트
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  MapPin, 
  Navigation, 
  Check, 
  X, 
  Route,
  Clock,
  Trash2,
  Plus,
  Save
} from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Button,
  Badge,
  Separator
} from '@/shared/ui'
import { GoogleMapComponent, PlaceSearchBox, MapContainer } from '@/features/map'

interface PlaceInfo {
  customName?: string
  category: 'home' | 'work' | 'leisure' | 'shopping' | 'dining' | 'transport' | 'other'
  description?: string
  storyHint?: string
  isPrivate?: boolean
  visitTime?: string
  duration?: number
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
}

interface PlaceSearchResult {
  placeId: string
  name: string
  address: string
  location: {
    lat: number
    lng: number
  }
  types: string[]
  rating?: number
  priceLevel?: number
}

interface MapRouteSelectorEmbeddedProps {
  timelineData: any[]
  onRouteSelect: (selectedRoutes: RoutePoint[]) => void
  onCancel: () => void
  maxRoutes?: number
}

export function MapRouteSelectorEmbedded({ 
  timelineData, 
  onRouteSelect, 
  onCancel,
  maxRoutes = 5 
}: MapRouteSelectorEmbeddedProps) {
  const [selectedRoutes, setSelectedRoutes] = useState<RoutePoint[]>([])
  const [availableRoutes, setAvailableRoutes] = useState<RoutePoint[]>([])
  const [highlightedRouteId, setHighlightedRouteId] = useState<string | null>(null)

  // 좌표 정규화 및 검증 함수
  const normalizeCoordinate = (coord: number, type: 'lat' | 'lng'): number => {
    if (type === 'lat') {
      if (Math.abs(coord) > 90) {
        return coord / 1e7
      }
      return coord
    } else {
      if (Math.abs(coord) > 180) {
        return coord / 1e7
      }
      return coord
    }
  }

  const isValidCoordinate = (lat: number, lng: number): boolean => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  }

  // 타임라인 데이터를 RoutePoint로 변환
  useEffect(() => {
    if (timelineData && timelineData.length > 0) {
      const routes = timelineData
        .filter(item => {
          const hasLatLng = (item.lat !== undefined && item.lng !== undefined) || 
                           (item.latitude !== undefined && item.longitude !== undefined)
          return hasLatLng
        })
        .map((item, index) => {
          const rawLat = item.lat ?? item.latitude ?? 0
          const rawLng = item.lng ?? item.longitude ?? 0
          
          const normalizedLat = normalizeCoordinate(rawLat, 'lat')
          const normalizedLng = normalizeCoordinate(rawLng, 'lng')
          
          if (!isValidCoordinate(normalizedLat, normalizedLng)) {
            return null
          }
          
          return {
            id: `route-${item.id || index}`,
            lat: normalizedLat,
            lng: normalizedLng,
            timestamp: item.timestamp || new Date().toISOString(),
            address: item.address || `위치 ${index + 1}`,
            duration: item.duration || 30,
            isSelected: false
          }
        })
        .filter(Boolean)
      
      setAvailableRoutes(routes)
    } else {
      setAvailableRoutes([])
    }
  }, [timelineData])

  // 경로 선택/해제 핸들러
  const handleRouteToggle = useCallback((routeId: string) => {
    setSelectedRoutes(prev => {
      const existing = prev.find(r => r.id === routeId)
      if (existing) {
        return prev.filter(r => r.id !== routeId)
      } else {
        if (prev.length >= maxRoutes) {
          return prev
        }
        const routeToAdd = availableRoutes.find(r => r.id === routeId)
        return routeToAdd ? [...prev, { ...routeToAdd, isSelected: true }] : prev
      }
    })
  }, [availableRoutes, maxRoutes])

  // 모든 경로 선택 해제
  const handleClearAll = () => {
    setSelectedRoutes([])
  }

  // 선택 완료
  const handleConfirmSelection = () => {
    if (selectedRoutes.length > 0) {
      onRouteSelect(selectedRoutes)
    }
  }

  // 장소 정보 업데이트
  const updatePlaceInfo = useCallback((routeId: string, placeInfo: PlaceInfo, timeData?: { visitTime: string, duration: number }) => {
    const updateRoute = (route: RoutePoint) => {
      if (route.id !== routeId) return route
      
      const updatedRoute = { ...route, customInfo: placeInfo }
      
      if (timeData) {
        updatedRoute.timestamp = timeData.visitTime
        updatedRoute.duration = timeData.duration
      }
      
      return updatedRoute
    }
    
    setAvailableRoutes(prev => prev.map(updateRoute))
    setSelectedRoutes(prev => prev.map(updateRoute))
  }, [])

  // 수동 경로 추가
  const addManualRoute = useCallback((lat: number, lng: number, address?: string) => {
    const newRoute: RoutePoint = {
      id: `manual-${Date.now()}`,
      lat,
      lng,
      timestamp: new Date().toISOString(),
      address: address || `수동 추가 위치 (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      duration: 30,
      isSelected: false
    }
    
    setAvailableRoutes(prev => [...prev, newRoute])
  }, [])

  // 검색 결과로 경로 추가
  const handlePlaceSearch = useCallback((place: PlaceSearchResult) => {
    const newRoute: RoutePoint = {
      id: `search-${place.placeId}-${Date.now()}`,
      lat: place.location.lat,
      lng: place.location.lng,
      timestamp: new Date().toISOString(),
      address: place.address,
      duration: 30,
      isSelected: false,
      customInfo: {
        customName: place.name,
        category: inferCategoryFromTypes(place.types),
        description: '', // 기본값을 빈 문자열로 설정하여 사용자가 직접 입력하도록 함
        storyHint: '' // 기본값을 빈 문자열로 설정하여 사용자가 직접 입력하도록 함
      }
    }
    
    setAvailableRoutes(prev => [...prev, newRoute])
    
    if (selectedRoutes.length < maxRoutes) {
      setSelectedRoutes(prev => [...prev, { ...newRoute, isSelected: true }])
    }
    
    setHighlightedRouteId(newRoute.id)
    setTimeout(() => {
      setHighlightedRouteId(null)
    }, 3000)
  }, [selectedRoutes.length, maxRoutes])

  // 장소 타입에서 카테고리 추론
  const inferCategoryFromTypes = (types: string[]): PlaceInfo['category'] => {
    const typeMap: Record<string, PlaceInfo['category']> = {
      'restaurant': 'dining',
      'cafe': 'dining',
      'food': 'dining',
      'meal_takeaway': 'dining',
      'shopping_mall': 'shopping',
      'store': 'shopping',
      'clothing_store': 'shopping',
      'hospital': 'other',
      'school': 'work',
      'university': 'work',
      'bank': 'other',
      'gas_station': 'transport',
      'subway_station': 'transport',
      'bus_station': 'transport',
      'train_station': 'transport',
      'park': 'leisure',
      'amusement_park': 'leisure',
      'gym': 'leisure',
      'spa': 'leisure',
      'library': 'leisure',
      'movie_theater': 'leisure',
      'home_goods_store': 'shopping'
    }

    for (const type of types) {
      if (typeMap[type]) {
        return typeMap[type]
      }
    }
    
    return 'other'
  }

  return (
    <MapContainer>
      {(isGoogleLoaded) => (
        <div className="h-full flex flex-col">
          {/* 검색 및 상태 바 */}
          <div className="flex-shrink-0 p-4 bg-white border-b space-y-3">
            {/* 검색박스 */}
            {isGoogleLoaded && (
              <PlaceSearchBox
                onPlaceSelect={handlePlaceSearch}
                onLocationSelect={addManualRoute}
                placeholder="장소나 주소를 검색하세요..."
                className="w-full"
              />
            )}
            
            {/* 상태 정보 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {selectedRoutes.length}/{maxRoutes} 선택됨
                </Badge>
                {availableRoutes.length > 0 && (
                  <Badge variant="secondary" className="text-sm">
                    총 {availableRoutes.length}개 경로
                  </Badge>
                )}
              </div>
              
              {selectedRoutes.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  전체 해제
                </Button>
              )}
            </div>
          </div>

          {/* 지도 영역 */}
          <div className="flex-1 relative">
            {isGoogleLoaded ? (
              <GoogleMapComponent
                routes={availableRoutes}
                selectedRoutes={selectedRoutes}
                onRouteClick={handleRouteToggle}
                onRouteEdit={updatePlaceInfo}
                onAddManualRoute={addManualRoute}
                highlightedRouteId={highlightedRouteId}
                height="100%"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">지도 초기화 중...</p>
                </div>
              </div>
            )}
          </div>

          {/* 하단 액션 바 */}
          <div className="flex-shrink-0 p-4 bg-white border-t">
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                취소
              </Button>
              
              <Button
                onClick={handleConfirmSelection}
                disabled={selectedRoutes.length === 0}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <Save className="w-4 h-4 mr-2" />
                선택 완료 ({selectedRoutes.length})
              </Button>
            </div>
            
            {selectedRoutes.length === 0 && (
              <p className="text-center text-sm text-gray-500 mt-2">
                지도에서 경로를 클릭하거나 검색하여 선택하세요
              </p>
            )}
          </div>
        </div>
      )}
    </MapContainer>
  )
}