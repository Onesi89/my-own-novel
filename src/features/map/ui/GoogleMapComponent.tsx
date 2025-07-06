/**
 * Google Map Component
 * FSD: features/map/ui
 * 
 * 구글 지도 통합 컴포넌트 - react-google-maps/api 사용
 */

'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { 
  GoogleMap, 
  Marker, 
  Polyline,
  InfoWindow
} from '@react-google-maps/api'
import { 
  MapPin, 
  Clock,
  Edit,
  Trash2,
  X
} from 'lucide-react'
import { 
  Button,
  Badge,
  Card,
  CardContent
} from '@/shared/ui'
import { PlaceInfoModal } from './PlaceInfoModal'

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

interface PlaceInfo {
  customName?: string
  category: 'home' | 'work' | 'leisure' | 'shopping' | 'dining' | 'transport' | 'other'
  description?: string
  storyHint?: string
  isPrivate?: boolean
  visitTime?: string
  duration?: number
}

interface GoogleMapComponentProps {
  routes: RoutePoint[]
  selectedRoutes: RoutePoint[]
  onRouteClick: (routeId: string) => void
  onRouteEdit: (routeId: string, placeInfo: PlaceInfo, timeData?: { visitTime: string, duration: number }) => void
  onAddManualRoute?: (lat: number, lng: number) => void
  highlightedRouteId?: string | null
  center?: { lat: number; lng: number }
  zoom?: number
  height?: string
  children?: React.ReactNode
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
}

const defaultCenter = {
  lat: 37.5665, // 서울시청
  lng: 126.9780
}

const defaultOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  minZoom: 10,
  maxZoom: 18,
  gestureHandling: 'auto',
  styles: [
    {
      featureType: "poi",
      elementType: "labels.icon",
      stylers: [{ visibility: "off" }]
    }
  ]
}

export function GoogleMapComponent({
  routes,
  selectedRoutes,
  onRouteClick,
  onRouteEdit,
  onAddManualRoute,
  highlightedRouteId,
  center,
  zoom = 12,
  height = '600px'
}: GoogleMapComponentProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [infoWindowRoute, setInfoWindowRoute] = useState<RoutePoint | null>(null)
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState<RoutePoint | null>(null)

  // 지도 로드 완료
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
  }, [])

  // 지도 언마운트
  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  // 지도 클릭 (수동 경로 추가)
  const onMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng && onAddManualRoute) {
      const lat = event.latLng.lat()
      const lng = event.latLng.lng()
      onAddManualRoute(lat, lng)
    }
  }, [onAddManualRoute])

  // 마커 클릭 (부드러운 줌 처리)
  const onMarkerClick = useCallback((route: RoutePoint) => {
    onRouteClick(route.id)
    setInfoWindowRoute(route)
    
    // 마커 클릭 시 부드러운 중심 이동 (줌 변경 최소화)
    if (map) {
      const currentZoom = map.getZoom()
      
      // panTo를 사용해 부드럽게 이동하고, 줌은 최소한만 조정
      map.panTo({ lat: route.lat, lng: route.lng })
      
      // 줌이 너무 낮은 경우에만 적당히 확대
      if (currentZoom && currentZoom < 14) {
        setTimeout(() => {
          map.setZoom(14)
        }, 300)
      }
    }
  }, [onRouteClick, map])

  // 장소 정보 편집
  const handleEditPlace = useCallback((route: RoutePoint) => {
    setEditingRoute(route)
    setIsPlaceModalOpen(true)
    setInfoWindowRoute(null)
  }, [])

  // 장소 정보 저장
  const handleSavePlaceInfo = useCallback((placeInfo: PlaceInfo, timeData?: { visitTime: string, duration: number }) => {
    if (editingRoute) {
      onRouteEdit(editingRoute.id, placeInfo, timeData)
      setEditingRoute(null)
      setIsPlaceModalOpen(false)
    }
  }, [editingRoute, onRouteEdit])

  // 마커 아이콘 생성
  const getMarkerIcon = useCallback((route: RoutePoint) => {
    if (!window.google) return undefined
    
    const isSelected = selectedRoutes.some(r => r.id === route.id)
    const color = isSelected ? '#3B82F6' : '#6B7280' // blue-500 : gray-500
    
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      scale: isSelected ? 12 : 8
    }
  }, [selectedRoutes])

  // 경로 라인 생성
  const getPolylineOptions = useCallback(() => {
    return {
      strokeColor: '#0000ff',
      strokeOpacity: 1,
      strokeWeight: 10,
      geodesic: true
    }
  }, [])

  // 지도 중심 자동 조정
  useEffect(() => {
    if (map && routes.length > 0 && window.google) {
      const bounds = new google.maps.LatLngBounds()
      routes.forEach(route => {
        bounds.extend({ lat: route.lat, lng: route.lng })
      })
      
      // 부드러운 줌 조정을 위한 패딩 추가
      map.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
      })
      
      // 적절한 줌 레벨 유지 (최대 16레벨로 제한)
      const listener = google.maps.event.addListener(map, 'idle', () => {
        const currentZoom = map.getZoom()
        if (currentZoom && currentZoom > 16) {
          map.setZoom(16)
        } else if (currentZoom && currentZoom < 12) {
          map.setZoom(12)
        }
        google.maps.event.removeListener(listener)
      })
    }
  }, [map, routes])

  // 시간 포맷팅
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const mapCenter = center || (routes.length > 0 ? { lat: routes[0].lat, lng: routes[0].lng } : defaultCenter)

  // 디버깅: routes 데이터 로깅
  useEffect(() => {
    console.log('GoogleMapComponent routes:', routes.length, 'items')
    if (routes.length > 0) {
      console.log('Sample route:', routes[0])
    }
  }, [routes])

  // 하이라이트된 경로에 대해 자동으로 InfoWindow 표시
  useEffect(() => {
    if (highlightedRouteId) {
      const highlightedRoute = routes.find(route => route.id === highlightedRouteId)
      if (highlightedRoute) {
        setInfoWindowRoute(highlightedRoute)
      }
    }
  }, [highlightedRouteId, routes])

  return (
    <>
      <div style={{ height }}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={zoom}
          options={defaultOptions}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={onMapClick}
        >
          {/* 마커 표시 */}
          {routes.map((route) => (
            <Marker
              key={route.id}
              position={{ lat: route.lat, lng: route.lng }}
              icon={getMarkerIcon(route)}
              onClick={() => onMarkerClick(route)}
              title={route.customInfo?.customName || route.address || '위치'}
            />
          ))}

          {/* 전체 타임라인 경로 라인 표시 (연한 파란색) */}
          {routes.length > 1 && (
            <Polyline
              path={routes
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                .map(route => ({ lat: route.lat, lng: route.lng }))}
              options={{
                strokeColor: '#93C5FD',
                strokeOpacity: 0.6,
                strokeWeight: 2,
                geodesic: true
              }}
            />
          )}

          {/* 선택된 경로 라인 표시 (진한 파란색) */}
          {selectedRoutes.length > 1 && (
            <Polyline
              path={selectedRoutes
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                .map(route => ({ lat: route.lat, lng: route.lng }))}
              options={getPolylineOptions()}
            />
          )}

          {/* 정보 윈도우 */}
          {infoWindowRoute && (
            <InfoWindow
              position={{ lat: infoWindowRoute.lat, lng: infoWindowRoute.lng }}
              onCloseClick={() => setInfoWindowRoute(null)}
            >
                <Card className="border-0 shadow-none min-w-[250px]">
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {infoWindowRoute.customInfo && (
                            <span className="text-lg">
                              {getCategoryIcon(infoWindowRoute.customInfo.category)}
                            </span>
                          )}
                          <h3 className="font-medium text-gray-900">
                            {infoWindowRoute.customInfo?.customName || 
                             infoWindowRoute.address || 
                             '알 수 없는 위치'}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(infoWindowRoute.timestamp)}</span>
                          {infoWindowRoute.duration && (
                            <Badge variant="outline" className="text-xs ml-2">
                              {infoWindowRoute.duration}분
                            </Badge>
                          )}
                        </div>
                        {infoWindowRoute.customInfo?.description && (
                          <p className="text-sm text-gray-600 mt-2">
                            {infoWindowRoute.customInfo.description}
                          </p>
                        )}
                        {infoWindowRoute.customInfo?.storyHint && (
                          <div className="mt-2">
                            <Badge variant="secondary" className="text-xs">
                              💡 {infoWindowRoute.customInfo.storyHint}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInfoWindowRoute(null)}
                        className="text-gray-400 hover:text-gray-600 p-1 h-6 w-6 -mt-1 -mr-1"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditPlace(infoWindowRoute)}
                        className="flex-1 text-xs"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        편집
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedRoutes.some(r => r.id === infoWindowRoute.id) ? 'default' : 'outline'}
                        onClick={() => onRouteClick(infoWindowRoute.id)}
                        className="flex-1 text-xs"
                      >
                        {selectedRoutes.some(r => r.id === infoWindowRoute.id) ? (
                          <>
                            <Trash2 className="w-3 h-3 mr-1" />
                            해제
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3 h-3 mr-1" />
                            선택
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </InfoWindow>
            )}
        </GoogleMap>
      </div>

      {/* 장소 정보 편집 모달 */}
      <PlaceInfoModal
        isOpen={isPlaceModalOpen}
        onClose={() => {
          setIsPlaceModalOpen(false)
          setEditingRoute(null)
        }}
        onSave={handleSavePlaceInfo}
        location={editingRoute}
        initialData={editingRoute?.customInfo}
      />
    </>
  )
}