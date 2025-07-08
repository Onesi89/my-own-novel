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
import { sanitizeSearchQuery, INPUT_LIMITS } from '@/shared/lib/validation/inputValidation'

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
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsPanelRef = useRef<HTMLDivElement>(null)

  // 디바운스된 검색 함수
  const searchPlaces = useCallback(async (query: string) => {
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
      setShowSuggestions(true)
    } catch (err) {
      console.error('Search error:', err)
      setError('검색 중 오류가 발생했습니다.')
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // useDebouncedCallback 사용으로 debounce 간소화
  const debouncedSearch = useDebouncedCallback(searchPlaces, 300)

  // 검색어 변경 시 자동 검색
  useEffect(() => {
    debouncedSearch(searchValue)
  }, [searchValue, debouncedSearch])

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
        types: placeDetails.types,
        rating: placeDetails.rating,
        priceLevel: placeDetails.priceLevel
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

      // 검색창 초기화 (더 단순하게)
      setSearchValue('')
      setSuggestions([])
      setShowSuggestions(false)
      
      // 입력 필드 포커스 해제
      if (inputRef.current) {
        inputRef.current.blur()
      }
    } catch (err) {
      console.error('Place select error:', err)
      setError('장소 정보를 가져오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 입력값 변경
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    const value = sanitizeSearchQuery(rawValue)
    setSearchValue(value)
    setError(null)
    
    // 입력이 있으면 제안 표시
    if (value.length > 0) {
      setShowSuggestions(true)
    }
  }

  // 검색창 포커스
  const handleInputFocus = () => {
    setShowSuggestions(true)
  }

  // 검색창 블러 처리 개선
  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // 포커스가 suggestions 패널로 이동하는 경우 블러를 방지
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget && suggestionsPanelRef.current?.contains(relatedTarget)) {
      return
    }
    
    // 간단한 지연 후 제안 숨김
    setTimeout(() => {
      if (inputRef.current !== document.activeElement) {
        setShowSuggestions(false)
      }
    }, 150)
  }

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

    // 상태 초기화
    setSearchValue('')
    setSuggestions([])
    setShowSuggestions(false)
  }

  // 최근 검색 삭제
  const handleRemoveRecentSearch = (placeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setRecentSearches(prev => prev.filter(p => p.placeId !== placeId))
  }

  // 검색창 초기화
  const handleClearSearch = () => {
    setSearchValue('')
    setSuggestions([])
    setError(null)
    if (inputRef.current) {
      inputRef.current.focus()
      setShowSuggestions(true)
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

  // 별점 표시
  const renderRating = (rating?: number) => {
    if (!rating) return null
    
    return (
      <div className="flex items-center gap-1">
        <span className="text-yellow-500 text-sm">★</span>
        <span className="text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          ref={inputRef}
          maxLength={INPUT_LIMITS.SEARCH_QUERY}
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={(e) => {
            // 키보드 입력 시 제안 표시
            if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
              setShowSuggestions(true)
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

      {/* 검색 제안 및 최근 검색 */}
      {showSuggestions && !error && (
        <Card 
          ref={suggestionsPanelRef}
          className="absolute top-full mt-1 w-full z-50 shadow-lg"
          onMouseDown={(e) => e.preventDefault()} // 마우스 다운 시 포커스 유지
          onMouseLeave={() => {
            // 마우스가 패널을 벗어나면 제안 숨김 (입력 필드에 포커스가 없는 경우)
            if (!inputRef.current || inputRef.current !== document.activeElement) {
              setTimeout(() => {
                if (!isLoading) {
                  setShowSuggestions(false)
                }
              }, 100)
            }
          }}
        >
          <CardContent className="p-2">
            {/* 검색 제안 */}
            {searchValue.length >= 2 && suggestions.length > 0 && (
              <div className="space-y-1">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.placeId}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
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

            {/* 최근 검색 */}
            {searchValue.length === 0 && recentSearches.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-2 py-1 text-sm text-gray-500">
                  <Clock className="w-3 h-3" />
                  최근 검색
                </div>
                <div className="space-y-1">
                  {recentSearches.map((place) => (
                    <div
                      key={place.placeId}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer group"
                      onClick={() => handleRecentSearchSelect(place)}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 truncate">
                              {place.name}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {getPlaceTypeLabel(place.types)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {place.address}
                          </p>
                          {renderRating(place.rating)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                        onClick={(e) => handleRemoveRecentSearch(place.placeId, e)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
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