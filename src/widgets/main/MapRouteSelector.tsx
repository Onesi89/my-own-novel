/**
 * Map Route Selector Widget
 * FSD: widgets/main
 * 
 * 구글 지도 기반 이동경로 선택 UI 컴포넌트
 * 새 소설 만들기 클릭 시 표시되는 지도 뷰
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  MapPin, 
  Navigation, 
  Check, 
  X, 
  ArrowLeft,
  Map,
  Route,
  Clock,
  Trash2,
  Plus,
  ArrowUp
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
import { usePathname } from 'next/navigation'
import { randomUUID } from 'crypto'

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

interface MapRouteSelectorProps {
  timelineData: any[]
  onRouteSelect: (selectedRoutes: RoutePoint[]) => void
  onCancel: () => void
  maxRoutes?: number
}

export function MapRouteSelector({ 
  timelineData, 
  onRouteSelect, 
  onCancel,
  maxRoutes = 5 
}: MapRouteSelectorProps) {
  const [selectedRoutes, setSelectedRoutes] = useState<RoutePoint[]>([])
  const [availableRoutes, setAvailableRoutes] = useState<RoutePoint[]>([])
  const [currentView, setCurrentView] = useState<'map' | 'list'>('map')
  const [highlightedRouteId, setHighlightedRouteId] = useState<string | null>(null)

  // 좌표 정규화 및 검증 함수
  const normalizeCoordinate = (coord: number, type: 'lat' | 'lng'): number => {
    if (type === 'lat') {
      // E7 형식 검증: 위도는 -90도~90도 범위를 벗어나면 E7 형식으로 간주
      if (Math.abs(coord) > 90) {
        return coord / 1e7
      }
      return coord
    } else {
      // E7 형식 검증: 경도는 -180도~180도 범위를 벗어나면 E7 형식으로 간주
      if (Math.abs(coord) > 180) {
        return coord / 1e7
      }
      return coord
    }
  }

  // 좌표 유효성 검사 함수
  const isValidCoordinate = (lat: number, lng: number): boolean => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  }

  // 타임라인 데이터를 RoutePoint로 변환
  useEffect(() => {
    if (timelineData && timelineData.length > 0) {
      console.log('Processing timeline data:', timelineData.length, 'locations')
      console.log('Sample location data:', timelineData[0])
      
      const routes = timelineData
        .filter(item => {
          // latitude/longitude 또는 lat/lng 필드 확인
          const hasLatLng = (item.lat !== undefined && item.lng !== undefined) || 
                           (item.latitude !== undefined && item.longitude !== undefined)
          return hasLatLng
        })
        .map((item, index) => {
          // latitude/longitude 또는 lat/lng 필드를 정규화
          const rawLat = item.lat ?? item.latitude ?? 0
          const rawLng = item.lng ?? item.longitude ?? 0
          
          // 좌표 정규화
          const normalizedLat = normalizeCoordinate(rawLat, 'lat')
          const normalizedLng = normalizeCoordinate(rawLng, 'lng')
          
          // 좌표 유효성 검사
          if (!isValidCoordinate(normalizedLat, normalizedLng)) {
            console.warn(`Invalid coordinates for item ${index}:`, {
              raw: { lat: rawLat, lng: rawLng },
              normalized: { lat: normalizedLat, lng: normalizedLng }
            })
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
        .filter(Boolean) // null 값 제거
      
      console.log('Processed routes:', routes.length, routes.slice(0, 3))
      console.log('Available routes set, length:', routes.length)
      setAvailableRoutes(routes)
    } else {
      console.log('No timeline data available')
      setAvailableRoutes([])
    }
  }, [timelineData])

  // 경로 선택/해제 핸들러
  const handleRouteToggle = useCallback((routeId: string) => {
    setSelectedRoutes(prev => {
      const existing = prev.find(r => r.id === routeId)
      if (existing) {
        // 이미 선택된 경로면 제거
        return prev.filter(r => r.id !== routeId)
      } else {
        // 최대 개수 체크
        if (prev.length >= maxRoutes) {
          return prev
        }
        // 새 경로 추가
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

  // 시간 포맷팅
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 날짜 포맷팅
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    })
  }

  // 카테고리 아이콘 매핑
  const getCategoryIcon = (category: PlaceInfo['category']) => {
    const icons = {
      home: '🏠',
      work: '🏢',
      dining: '🍽️',
      shopping: '🛍️',
      leisure: '🎮',
      transport: '🚗',
      other: '📍'
    }
    return icons[category] || '📍'
  }

  // 장소 정보 업데이트
  const updatePlaceInfo = useCallback((routeId: string, placeInfo: PlaceInfo, timeData?: { visitTime: string, duration: number }) => {
    const updateRoute = (route: RoutePoint) => {
      if (route.id !== routeId) return route
      
      const updatedRoute = { ...route, customInfo: placeInfo }
      
      // 시간 데이터가 있으면 업데이트
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
    
    // 자동으로 선택 (5개 미만인 경우)
    if (selectedRoutes.length < maxRoutes) {
      setSelectedRoutes(prev => [...prev, { ...newRoute, isSelected: true }])
    }
    
    // 검색으로 추가된 장소를 지도에서 하이라이트
    setHighlightedRouteId(newRoute.id)
    
    // 3초 후 하이라이트 해제
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50" onClick={onCancel}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back Button & Title */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Map className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">이동 경로 선택</h1>
              </div>
            </div>

            {/* View Toggle & Actions */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <Button
                  variant={currentView === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('map')}
                  className="text-xs"
                >
                  <Map className="w-4 h-4 mr-1" />
                  지도
                </Button>
                <Button
                  variant={currentView === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('list')}
                  className="text-xs"
                >
                  <Route className="w-4 h-4 mr-1" />
                  목록
                </Button>
              </div>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {selectedRoutes.length}/{maxRoutes} 선택
                </Badge>
                {selectedRoutes.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    전체 해제
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Map/List View */}
          <div className="lg:col-span-3">
            {currentView === 'map' ? (
              <Card className="h-[700px]">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    지도에서 경로 선택
                  </CardTitle>
                  <CardDescription>
                    장소를 검색하거나 지도를 클릭하여 최대 {maxRoutes}개의 이동 경로를 선택하세요.
                  </CardDescription>
                  
                  {/* 검색박스 */}
                  {isGoogleLoaded && (
                    <div className="mt-4">
                      <PlaceSearchBox
                        onPlaceSelect={handlePlaceSearch}
                        onLocationSelect={addManualRoute}
                        placeholder="장소나 주소를 검색하세요..."
                        className="w-full"
                      />
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-0 h-[500px]">
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
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Route className="w-5 h-5" />
                    이동 경로 목록
                  </CardTitle>
                  <CardDescription>
                    아래 목록에서 소설에 포함할 이동 경로를 선택하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[600px] overflow-y-auto">
                  <div className="space-y-3">
                    {availableRoutes.map((route, index) => {
                      const isSelected = selectedRoutes.some(r => r.id === route.id)
                      const canSelect = selectedRoutes.length < maxRoutes || isSelected
                      
                      return (
                        <div
                          key={route.id}
                          className={`
                            p-4 rounded-lg border cursor-pointer transition-all
                            ${isSelected 
                              ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/20' 
                              : canSelect 
                                ? 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300' 
                                : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                            }
                          `}
                          onClick={() => canSelect && handleRouteToggle(route.id)}
                          role="button"
                          tabIndex={canSelect ? 0 : -1}
                          aria-label={`경로 ${index + 1} ${isSelected ? '선택됨' : '선택 안됨'}`}
                          onKeyDown={(e) => {
                            if (canSelect && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault()
                              handleRouteToggle(route.id)
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center
                                ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}
                              `}>
                                {isSelected ? (
                                  <Check className="w-5 h-5" />
                                ) : (
                                  <span className="text-sm font-medium">{index + 1}</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-gray-900">
                                    {route.address}
                                  </h3>
                                  <Badge variant="outline" className="text-xs">
                                    {formatDate(route.timestamp)}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(route.timestamp)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Navigation className="w-3 h-3" />
                                    {route.duration}분 체류
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {!canSelect && !isSelected && (
                              <div className="text-xs text-gray-400">
                                최대 {maxRoutes}개까지 선택 가능
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    
                    {availableRoutes.length === 0 && (
                      <div className="text-center py-12">
                        <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                          <Route className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 mb-2">업로드된 이동 경로가 없습니다</p>
                        <div className="text-sm text-gray-400 space-y-1">
                          <p>• 지도 뷰에서 검색하여 장소를 추가하거나</p>
                          <p>• 지도를 클릭하여 수동으로 위치를 추가하세요</p>
                          <p>• Google 타임라인을 업로드하면 자동으로 경로가 표시됩니다</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Selection Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">선택한 경로</CardTitle>
                <CardDescription>
                  소설에 포함될 이동 경로들입니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedRoutes.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      {selectedRoutes.map((route, index) => (
                        <Card
                          key={route.id}
                          className="relative bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-3">
                            {/* 헤더: 번호, 아이콘, 이름 */}
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {index + 1}
                              </div>
                              {route.customInfo && (
                                <span className="text-sm flex-shrink-0">
                                  {getCategoryIcon(route.customInfo.category)}
                                </span>
                              )}
                              <h4 className="text-sm font-semibold text-gray-900 truncate flex-1">
                                {route.customInfo?.customName || route.address}
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRouteToggle(route.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 flex-shrink-0 -mr-1"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>

                            {/* 원래 주소 (커스텀 이름이 있는 경우) */}
                            {route.customInfo?.customName && (
                              <p className="text-xs text-gray-500 mb-2 truncate pl-7">
                                📍 {route.address}
                              </p>
                            )}

                            {/* 시간 정보 */}
                            <div className="flex items-center gap-2 text-xs text-gray-600 mb-2 pl-7">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span>{formatTime(route.timestamp)}</span>
                              {route.duration && (
                                <>
                                  <span>•</span>
                                  <span>{route.duration}분</span>
                                </>
                              )}
                            </div>

                            {/* 장소 설명 */}
                            {route.customInfo?.description && (
                              <div className="mb-2 pl-7">
                                <p 
                                  className="text-xs text-gray-700 bg-white/60 rounded px-2 py-1"
                                  style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {route.customInfo.description}
                                </p>
                              </div>
                            )}

                            {/* 스토리 힌트 */}
                            {route.customInfo?.storyHint && (
                              <div className="pl-7">
                                <Badge variant="secondary" className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 border-yellow-200">
                                  💡 {route.customInfo.storyHint}
                                </Badge>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">총 경로 수</span>
                        <span className="font-medium">{selectedRoutes.length}개</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">예상 소설 길이</span>
                        <span className="font-medium">
                          {Math.ceil(selectedRoutes.length * 1.2)}천자
                        </span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Button
                        onClick={handleConfirmSelection}
                        className="w-full"
                        disabled={selectedRoutes.length === 0}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        선택 완료
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleClearAll}
                        className="w-full"
                        disabled={selectedRoutes.length === 0}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        전체 해제
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">
                      아직 선택한 경로가 없습니다
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      최대 {maxRoutes}개까지 선택 가능
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
      )}
    </MapContainer>
  )
}