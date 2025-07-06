/**
 * Place Info Modal Component
 * FSD: features/map/ui
 * 
 * 장소 정보 입력 모달 - 경로 선택 시 사용자가 장소 정보를 입력하는 모달
 */

'use client'

import React, { useState, useEffect } from 'react'
import { 
  MapPin, 
  Tag, 
  FileText, 
  Home, 
  Briefcase, 
  ShoppingCart,
  Coffee,
  Car,
  Gamepad2,
  MoreHorizontal,
  X,
  Check,
  AlertCircle
} from 'lucide-react'
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Button,
  Input,
  Label,
  Textarea,
  Card,
  CardContent,
  Badge,
  Alert,
  AlertDescription
} from '@/shared/ui'

interface PlaceInfo {
  customName?: string
  category: 'home' | 'work' | 'leisure' | 'shopping' | 'dining' | 'transport' | 'other'
  description?: string
  storyHint?: string
  isPrivate?: boolean
  visitTime?: string
  duration?: number
}

interface TimelineLocation {
  id: string
  lat: number
  lng: number
  timestamp: string
  address?: string
  duration?: number
}

interface PlaceInfoModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (placeInfo: PlaceInfo, timeData?: { visitTime: string, duration: number }) => void
  location: TimelineLocation | null
  initialData?: PlaceInfo
}

const PLACE_CATEGORIES = [
  { id: 'home', label: '집', icon: Home, color: 'bg-blue-100 text-blue-700' },
  { id: 'work', label: '직장', icon: Briefcase, color: 'bg-green-100 text-green-700' },
  { id: 'dining', label: '식당', icon: Coffee, color: 'bg-orange-100 text-orange-700' },
  { id: 'shopping', label: '쇼핑', icon: ShoppingCart, color: 'bg-purple-100 text-purple-700' },
  { id: 'leisure', label: '여가', icon: Gamepad2, color: 'bg-pink-100 text-pink-700' },
  { id: 'transport', label: '교통', icon: Car, color: 'bg-gray-100 text-gray-700' },
  { id: 'other', label: '기타', icon: MoreHorizontal, color: 'bg-slate-100 text-slate-700' }
] as const

const STORY_HINTS = [
  '신비로운 일이 일어났던 곳',
  '중요한 만남이 있었던 곳',
  '즐거운 추억이 있는 곳',
  '조용히 휴식을 취하는 곳',
  '새로운 도전을 시작한 곳',
  '감동적인 순간을 경험한 곳'
]

export function PlaceInfoModal({ 
  isOpen, 
  onClose, 
  onSave, 
  location, 
  initialData 
}: PlaceInfoModalProps) {
  const [formData, setFormData] = useState<PlaceInfo>({
    customName: '',
    category: 'other',
    description: '',
    storyHint: '',
    isPrivate: false,
    visitTime: '',
    duration: 30
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 시간을 datetime-local 형식으로 변환
  const formatTimeForInput = (timestamp: string): string => {
    const date = new Date(timestamp)
    return date.toISOString().slice(0, 16)
  }

  // datetime-local 입력을 ISO 문자열로 변환
  const formatInputToISO = (datetimeLocal: string): string => {
    return new Date(datetimeLocal).toISOString()
  }

  // 초기 데이터 설정
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        visitTime: initialData.visitTime || (location?.timestamp ? formatTimeForInput(location.timestamp) : ''),
        duration: initialData.duration || location?.duration || 30
      })
    } else if (location) {
      // 주소에서 장소 이름 추출 시도
      const addressParts = location.address?.split(',') || []
      const suggestedName = addressParts[0]?.trim() || ''
      
      setFormData(prev => ({
        ...prev,
        customName: suggestedName,
        visitTime: location.timestamp ? formatTimeForInput(location.timestamp) : '',
        duration: location.duration || 30
      }))
    }
  }, [initialData, location])

  // 폼 유효성 검증
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.customName?.trim()) {
      newErrors.customName = '장소 이름을 입력해주세요'
    }
    
    if (!formData.category) {
      newErrors.category = '장소 종류를 선택해주세요'
    }
    
    if (!formData.description?.trim()) {
      newErrors.description = '장소 설명을 입력해주세요'
    } else if (formData.description.trim().length < 10) {
      newErrors.description = '장소 설명은 최소 10글자 이상 입력해주세요'
    }
    
    if (!formData.storyHint?.trim()) {
      newErrors.storyHint = '스토리 힌트를 입력해주세요'
    } else if (formData.storyHint.trim().length < 5) {
      newErrors.storyHint = '스토리 힌트는 최소 5글자 이상 입력해주세요'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 저장 처리
  const handleSave = () => {
    if (!validateForm()) return
    
    const placeInfo = {
      ...formData,
      customName: formData.customName?.trim(),
      description: formData.description?.trim(),
      storyHint: formData.storyHint?.trim()
    }
    
    const timeData = formData.visitTime ? {
      visitTime: formatInputToISO(formData.visitTime),
      duration: formData.duration || 30
    } : undefined
    
    onSave(placeInfo, timeData)
    
    handleClose()
  }

  // 모달 닫기
  const handleClose = () => {
    setFormData({
      customName: '',
      category: 'other',
      description: '',
      storyHint: '',
      isPrivate: false,
      visitTime: '',
      duration: 30
    })
    setErrors({})
    onClose()
  }

  // 카테고리 선택
  const handleCategorySelect = (categoryId: PlaceInfo['category']) => {
    setFormData(prev => ({ ...prev, category: categoryId }))
    setErrors(prev => ({ ...prev, category: '' }))
  }

  // 스토리 힌트 선택
  const handleStoryHintSelect = (hint: string) => {
    setFormData(prev => ({ ...prev, storyHint: hint }))
  }

  // 시간 포맷팅
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!location) return null

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            장소 정보 입력
          </SheetTitle>
          <SheetDescription>
            이 장소에 대한 정보를 필수로 입력해야 합니다. 상세한 정보일수록 더 흥미로운 소설이 만들어집니다.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* 필수 입력 안내 */}
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>모든 필드가 필수입니다.</strong> 장소 이름, 종류, 상세 설명, 스토리 힌트를 모두 입력해주세요.
            </AlertDescription>
          </Alert>

          {/* 장소 기본 정보 */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-600">
                    {location.address || '알 수 없는 위치'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">
                    {formatTime(location.timestamp)}
                  </p>
                  {location.duration && (
                    <Badge variant="outline" className="text-xs">
                      {location.duration}분 체류
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 장소 이름 입력 */}
          <div className="space-y-2">
            <Label htmlFor="placeName" className="text-sm font-medium">
              장소 이름 *
            </Label>
            <Input
              id="placeName"
              value={formData.customName}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, customName: e.target.value }))
                setErrors(prev => ({ ...prev, customName: '' }))
              }}
              placeholder="예: 우리 집, 회사, 카페 등"
              className={errors.customName ? 'border-red-500' : ''}
            />
            {errors.customName && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.customName}
              </p>
            )}
          </div>

          {/* 장소 종류 선택 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              장소 종류 *
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {PLACE_CATEGORIES.map((category) => {
                const Icon = category.icon
                const isSelected = formData.category === category.id
                
                return (
                  <Button
                    key={category.id}
                    variant={isSelected ? 'default' : 'outline'}
                    className={`h-12 flex items-center gap-2 ${
                      isSelected ? '' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{category.label}</span>
                  </Button>
                )
              })}
            </div>
            {errors.category && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.category}
              </p>
            )}
          </div>

          {/* 방문 시간 및 체류 시간 */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">
              방문 정보 (선택사항)
            </Label>
            
            <div className="grid grid-cols-1 gap-4">
              {/* 방문 시간 */}
              <div className="space-y-2">
                <Label htmlFor="visitTime" className="text-xs text-gray-600">
                  방문 시간
                </Label>
                <Input
                  id="visitTime"
                  type="datetime-local"
                  value={formData.visitTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, visitTime: e.target.value }))}
                  className="text-sm"
                />
              </div>

              {/* 체류 시간 */}
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-xs text-gray-600">
                  체류 시간 (분)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="1440"
                    value={formData.duration || 30}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      duration: parseInt(e.target.value) || 30 
                    }))}
                    className="text-sm"
                  />
                  <span className="text-xs text-gray-500">분</span>
                </div>
              </div>
            </div>
          </div>

          {/* 장소 설명 */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              장소 설명 (사건, 상황) *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, description: e.target.value }))
                setErrors(prev => ({ ...prev, description: '' }))
              }}
              placeholder="이 장소에서 일어난 일이나 특별한 상황을 자세히 설명해주세요 (최소 10글자)"
              className={`min-h-[80px] ${errors.description ? 'border-red-500' : ''}`}
            />
            {errors.description && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.description}
              </p>
            )}
          </div>

          {/* 스토리 힌트 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              스토리 힌트 *
            </Label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {STORY_HINTS.map((hint) => (
                  <Button
                    key={hint}
                    variant={formData.storyHint === hint ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                    onClick={() => handleStoryHintSelect(hint)}
                  >
                    {hint}
                  </Button>
                ))}
              </div>
              <Input
                value={formData.storyHint}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, storyHint: e.target.value }))
                  setErrors(prev => ({ ...prev, storyHint: '' }))
                }}
                placeholder="또는 직접 입력하세요 (최소 5글자)"
                className={`text-sm ${errors.storyHint ? 'border-red-500' : ''}`}
              />
              {errors.storyHint && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.storyHint}
                </p>
              )}
            </div>
          </div>

          {/* 개인정보 설정 */}
          <div className="space-y-3">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                소설 공유 시 개인정보 보호를 위해 실제 주소는 표시되지 않습니다.
              </AlertDescription>
            </Alert>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrivate"
                checked={formData.isPrivate}
                onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <Label htmlFor="isPrivate" className="text-sm text-gray-700">
                이 장소를 소설에서 비공개로 처리
              </Label>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              취소
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              저장
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}