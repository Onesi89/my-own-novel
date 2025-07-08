/**
 * Place Search Box Component
 * FSD: features/map/ui
 * 
 * 새로운 Google Places API를 사용한 장소 검색 컴포넌트
 */

'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { 
  Search, 
  MapPin, 
  Navigation,
  X,
  Clock,
  Loader2
} from 'lucide-react'
import { 
  Input,
  Button,
  Card,
  CardContent,
  Badge
} from '@/shared/ui'
import { getPlacesService, PlaceAutocompleteResult } from '../api/placesService'
import { INPUT_LIMITS } from '@/shared/lib/validation/inputValidation'

interface PlaceSearchResult {
  placeId: string
  name: string
  address: string
  location: {
    lat: number
    lng: number
  }
  types: string[]
}

interface PlaceSearchBoxProps {
  onPlaceSelect: (place: PlaceSearchResult) => void
  onLocationSelect?: (lat: number, lng: number, address: string) => void
  placeholder?: string
  className?: string
}

export function PlaceSearchBox({
  onPlaceSelect,
  onLocationSelect,
  placeholder = "장소나 주소를 검색하세요...",
  className = ""
}: PlaceSearchBoxProps) {
  const [searchValue, setSearchValue] = useState('')
  const [suggestions, setSuggestions] = useState<PlaceAutocompleteResult[]>([])
  const [recentSearches, setRecentSearches] = useState<PlaceSearchResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 상태 변화 디버깅 (필요시 주석 해제)
  // console.log('🔄 [PlaceSearchBox] 상태:', { searchValue, showSuggestions, isLoading })
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsPanelRef = useRef<HTMLDivElement>(null)

  // 중복 제거 - debouncedSearch에 통합됨

  // 안정적인 디바운스 콜백 생성
  const searchFunction = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const placesService = getPlacesService()
      const results = await placesService.autocomplete(query)
      setSuggestions(results)
      // 검색 완료 후 드롭다운 유지
      setShowSuggestions(true)
    } catch (err) {
      console.error('Search error:', err)
      setError('검색 중 오류가 발생했습니다.')
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const debouncedSearch = useDebouncedCallback(searchFunction, 300)

  // useEffect 제거 - handleInputChange에서 직접 호출

  // 장소 선택 처리
  const handlePlaceSelect = async (autocompleteResult: PlaceAutocompleteResult) => {
    setIsLoading(true)
    setError(null)

    try {
      const placesService = getPlacesService()
      const placeDetails = await placesService.getPlaceDetails(autocompleteResult.placeId)
      
      const placeResult: PlaceSearchResult = {
        placeId: placeDetails.placeId,
        name: placeDetails.name,
        address: placeDetails.address,
        location: placeDetails.location,
        types: placeDetails.types
      }

      // 최근 검색 기록 업데이트
      setRecentSearches(prev => {
        const filtered = prev.filter(p => p.placeId !== placeResult.placeId)
        return [placeResult, ...filtered].slice(0, 5)
      })

      // 콜백 호출
      onPlaceSelect(placeResult)
      
      if (onLocationSelect) {
        onLocationSelect(
          placeResult.location.lat,
          placeResult.location.lng,
          placeResult.address
        )
      }

      
      setTimeout(() => {
        if (inputRef.current) {
          // 검색창 초기화 (디바운스 취소 후 상태 초기화)
          debouncedSearch.cancel() // 진행 중인 디바운스 취소
          setSearchValue('')
          setSuggestions([])
          setShowSuggestions(false)
          setError(null)
          
          // 입력 필드 포커스 (상태는 이미 초기화됨)
          inputRef.current.focus()
        }
      }, 500)
    } catch (err) {
      console.error('Place select error:', err)
      setError('장소 정보를 가져오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 입력값 변경 - 단순하곤 안정적인 버전
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    // 상태 업데이트
    setSearchValue(value)
    setError(null)
    
    // 입력이 있으면 검색 실행
    if (value.length >= 2) {
      setShowSuggestions(true) // 검색 시작할 때 드롭다운 표시
      debouncedSearch(value)
    } else if (value.length === 0) {
      // 빈 입력이면 제안 숨김
      setSuggestions([])
      setShowSuggestions(false)
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  // 검색창 포커스 - 단순화
  const handleInputFocus = useCallback(() => {
    // 포커스 시만 제안 표시 상태 활성화 (실제 표시는 조건부)
    setShowSuggestions(true)
  }, [])

  // 검색창 블러 처리 개선
  const handleInputBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // 포커스가 suggestions 패널로 이동하는 경우 블러를 방지
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget && suggestionsPanelRef.current?.contains(relatedTarget)) {
      return
    }
    
    // 블러 시에는 showSuggestions 상태를 변경하지 않음
    // 드롭다운 숨김은 다른 조건으로 처리
  }, [])

  // 최근 검색 선택
  const handleRecentSearchSelect = (place: PlaceSearchResult) => {
    onPlaceSelect(place)
    
    if (onLocationSelect) {
      onLocationSelect(
        place.location.lat,
        place.location.lng,
        place.address
      )
    }

    // 상태 초기화 (최근 검색어 선택 시)
    debouncedSearch.cancel() // 진행 중인 디바운스 취소
    setSearchValue('') // 입력 상태 초기화
    setSuggestions([])
    setShowSuggestions(false)
    setError(null)
    
    // 입력 필드 포커스 (새로운 검색 준비)
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 50)
  }

  // 최근 검색 삭제
  const handleRemoveRecentSearch = (placeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setRecentSearches(prev => prev.filter(p => p.placeId !== placeId))
  }

  // 검색창 초기화
  const handleClearSearch = () => {
    debouncedSearch.cancel() // 진행 중인 디바운스 취소
    setSearchValue('')
    setSuggestions([])
    setError(null)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  // 장소 타입을 한국어로 변환
  const getPlaceTypeLabel = (types: string[]) => {
    const typeMap: Record<string, string> = {
      'restaurant': '음식점',
      'cafe': '카페',
      'shopping_mall': '쇼핑몰',
      'hospital': '병원',
      'school': '학교',
      'bank': '은행',
      'gas_station': '주유소',
      'subway_station': '지하철역',
      'bus_station': '버스정류장',
      'park': '공원',
      'gym': '헬스장',
      'library': '도서관',
      'convenience_store': '편의점',
      'lodging': '숙박',
      'tourist_attraction': '관광지',
      'store': '상점',
      'pharmacy': '약국',
      'church': '교회',
      'mosque': '모스크',
      'temple': '사원'
    }

    for (const type of types) {
      if (typeMap[type]) {
        return typeMap[type]
      }
    }
    return '장소'
  }

  // renderRating 함수 제거 - 현재 사용되지 않음

  return (
    <div className={`relative ${className}`}>
      {/* 최근 검색어 뱃지 */}
      {recentSearches.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {recentSearches.slice(0, 5).map((place) => (
              <div
                key={place.placeId}
                className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200 cursor-pointer"
                onClick={() => handleRecentSearchSelect(place)}
              >
                <MapPin className="w-3 h-3 text-gray-500" />
                <span className="text-gray-700 truncate max-w-32">{place.name}</span>
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveRecentSearch(place.placeId, e)
                  }}
                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-gray-300 rounded-full cursor-pointer"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          key="place-search-input"
          ref={inputRef}
          maxLength={INPUT_LIMITS.SEARCH_QUERY}
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={(e) => {
            // Enter 키로 제안 선택 방지
            if (e.key === 'Enter') {
              e.preventDefault()
              return
            }
          }}
          className="pl-10 pr-10"
          disabled={isLoading}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
        )}
        {!isLoading && searchValue && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={handleClearSearch}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="absolute top-full mt-1 w-full z-50">
          <Card className="shadow-lg">
            <CardContent className="p-3">
              <div className="text-sm text-red-600 flex items-center gap-2">
                <X className="w-4 h-4" />
                {error}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 검색 결과 드롭다운 */}
      {showSuggestions && !error && searchValue.length >= 2 && (
        <Card 
          ref={suggestionsPanelRef}
          className="absolute top-full mt-1 w-full z-50 shadow-lg"
          onMouseDown={(e) => {
            // 마우스 다운 시 기본 동작 방지하여 입력 필드 포커스 유지
            e.preventDefault()
          }}
        >
          <CardContent className="p-2 max-h-80 overflow-y-auto">
            {/* 검색 결과 영역 */}
            {searchValue.length >= 2 && suggestions.length > 0 && (
              <div className="space-y-1">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.placeId}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                    onMouseDown={(e) => {
                      // 클릭 시 포커스 방지
                      e.preventDefault()
                    }}
                    onClick={() => handlePlaceSelect(suggestion)}
                  >
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {suggestion.displayName}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {getPlaceTypeLabel(suggestion.types)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {suggestion.formattedAddress}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 로딩 상태 */}
            {isLoading && searchValue.length >= 2 && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">검색 중...</span>
              </div>
            )}

            {/* 검색 결과 없음 */}
            {!isLoading && searchValue.length >= 2 && suggestions.length === 0 && (
              <div className="text-sm text-gray-500 p-2">
                <div className="flex items-center gap-2">
                  <Navigation className="w-3 h-3" />
                  검색 결과가 없습니다
                </div>
              </div>
            )}

            {/* 검색 가이드 */}
            {searchValue.length > 0 && searchValue.length < 2 && (
              <div className="text-sm text-gray-500 p-2">
                <div className="flex items-center gap-2">
                  <Navigation className="w-3 h-3" />
                  최소 2글자 이상 입력해주세요
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}