/**
 * Map Container Component
 * FSD: features/map/ui
 *
 * Google Maps LoadScript를 제공하는 컨테이너 컴포넌트
 */

'use client'

import React from 'react'
import {  useJsApiLoader } from '@react-google-maps/api'
import { MapPin } from 'lucide-react'

interface MapContainerProps {
  children: (isLoaded: boolean, hasError: boolean) => React.ReactNode // 에러 상태도 전달
}

// 필요한 라이브러리 추가. Places API를 사용한다면 'places' 포함 권장
const libraries: Array<"geometry" | "drawing" | "visualization" | "places"> = ["places"]

export function MapContainer({ children }: MapContainerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY

 // ⭐️ LoadScript 대신 useJsApiLoader 훅 사용 ⭐️
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '', // apiKey가 없을 경우 빈 문자열 전달 (useJsApiLoader 요구사항)
    libraries: libraries,
    preventGoogleFontsLoading: true,
  });


  // API 키가 없는 경우 에러 표시
  if (!apiKey) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center p-8">
          <div className="p-4 bg-red-100 rounded-full w-fit mx-auto mb-4">
            <MapPin className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Google Maps API 키가 필요합니다</h3>
          <p className="text-sm text-gray-600 mb-4">
            .env.local 파일에 NEXT_PUBLIC_GOOGLE_MAP_KEY를 설정해주세요
          </p>
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded font-mono">
            NEXT_PUBLIC_GOOGLE_MAP_KEY=your_api_key_here
          </div>
        </div>
      </div>
    )
  }

  // 로딩 에러가 발생했을 때 사용자에게 에러 메시지 표시
  if (loadError) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-red-50 rounded-lg">
        <div className="text-center p-8">
          <div className="p-4 bg-red-100 rounded-full w-fit mx-auto mb-4">
            <MapPin className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">지도를 불러오는데 실패했습니다</h3>
          <p className="text-sm text-gray-600 mb-4">
            API 로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
          </p>
          {/* 재시도 버튼 등을 추가할 수도 있습니다. */}
        </div>
      </div>
    )
  }

  if(!isLoaded){
    return <div className="h-[600px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">지도를 불러오는 중...</p>
          </div>
        </div>
  }

  return (
       <>
      {process.env.NODE_ENV === 'development' && isLoaded && (
        console.log('Google Maps API loaded successfully by useJsApiLoader')
      )}
      {children(isLoaded, !!loadError)} {/* loadError는 Error 객체일 수 있으므로 boolean으로 변환 */}
    </>
  )
}