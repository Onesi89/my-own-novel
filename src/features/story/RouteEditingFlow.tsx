/**
 * Route Editing Flow Component
 * FSD: features/story
 * 
 * 선택된 경로들의 강제 편집 플로우 - 각 경로마다 설명과 스토리 힌트를 필수로 입력
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { 
  MapPin, 
  ArrowLeft, 
  ArrowRight, 
  Check,
  Clock,
  Navigation,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import { 
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  Badge,
  Alert,
  AlertDescription
} from '@/shared/ui'

interface RoutePoint {
  id: string
  lat: number
  lng: number
  timestamp: string
  address?: string
  duration?: number
  customInfo?: {
    customName?: string
    category: string
    description?: string
    storyHint?: string
  }
}

interface RouteEditData {
  customName: string
  description: string
  storyHint: string
}

interface RouteEditingFlowProps {
  routes: RoutePoint[]
  onComplete: (editedRoutes: RoutePoint[]) => void
  onBack: () => void
}

const STORY_HINTS = [
  '신비로운 일이 일어났던 곳',
  '중요한 만남이 있었던 곳',
  '즐거운 추억이 있는 곳',
  '조용히 휴식을 취하는 곳',
  '새로운 도전을 시작한 곳',
  '감동적인 순간을 경험한 곳',
  '예상치 못한 발견을 한 곳',
  '특별한 사람과 시간을 보낸 곳'
]

export function RouteEditingFlow({ routes, onComplete, onBack }: RouteEditingFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [editedRoutes, setEditedRoutes] = useState<RoutePoint[]>(routes)
  const [selectedHint, setSelectedHint] = useState<string>('')

  const currentRoute = editedRoutes[currentIndex]
  const progress = ((currentIndex + 1) / editedRoutes.length) * 100
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<RouteEditData>({
    defaultValues: {
      customName: '',
      description: '',
      storyHint: ''
    }
  })

  // 현재 경로가 변경될 때 폼 초기화
  useEffect(() => {
    if (currentRoute) {
      const customName = currentRoute.customInfo?.customName || 
                        currentRoute.address?.split(',')[0]?.trim() || 
                        `장소 ${currentIndex + 1}`
      
      const description = currentRoute.customInfo?.description || ''
      const storyHint = currentRoute.customInfo?.storyHint || ''
      
      reset({
        customName,
        description,
        storyHint
      })
      
      setSelectedHint(storyHint)
    }
  }, [currentIndex, currentRoute, reset])

  // 스토리 힌트 선택
  const handleHintSelect = (hint: string) => {
    setSelectedHint(hint)
    setValue('storyHint', hint)
  }

  // 다음 경로로 이동
  const handleNext = (data: RouteEditData) => {
    // 현재 경로 정보 업데이트
    const updatedRoutes = [...editedRoutes]
    updatedRoutes[currentIndex] = {
      ...currentRoute,
      customInfo: {
        ...currentRoute.customInfo,
        customName: data.customName.trim(),
        description: data.description.trim(),
        storyHint: data.storyHint.trim(),
        category: currentRoute.customInfo?.category || 'other'
      }
    }
    setEditedRoutes(updatedRoutes)

    // 다음 경로로 이동 또는 완료
    if (currentIndex < editedRoutes.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      // 모든 경로 편집 완료
      onComplete(updatedRoutes)
    }
  }

  // 이전 경로로 이동
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
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

  if (!currentRoute) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="flex items-center gap-2 hover:bg-purple-50"
              >
                <ArrowLeft className="w-4 h-4" />
                뒤로가기
              </Button>
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl font-bold text-purple-900">경로 정보 입력</h1>
              </div>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              {currentIndex + 1} / {editedRoutes.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white/50 border-b border-purple-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="w-full bg-purple-200 rounded-full h-2">
            <motion.div 
              className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-sm text-purple-700 mt-2">
            각 장소의 설명과 스토리 힌트를 입력하면 더 흥미진진한 소설이 만들어집니다
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <form onSubmit={handleSubmit(handleNext)} className="space-y-8">
              {/* 현재 장소 정보 */}
              <Card className="border-2 border-purple-200 bg-white/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-900">
                    <MapPin className="w-5 h-5" />
                    현재 편집 중인 장소
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <p className="text-sm text-gray-600">
                      {currentRoute.address || '알 수 없는 위치'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {formatTime(currentRoute.timestamp)}
                      </span>
                    </div>
                    {currentRoute.duration && (
                      <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-gray-500" />
                        <Badge variant="outline" className="text-xs">
                          {currentRoute.duration}분 체류
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 필수 정보 입력 알림 */}
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>모든 필드가 필수입니다.</strong> 장소 이름, 상세 설명, 스토리 힌트를 모두 입력해주세요.
                </AlertDescription>
              </Alert>

              {/* 장소 이름 */}
              <div className="space-y-2">
                <Label htmlFor="customName" className="text-sm font-medium text-gray-800">
                  장소 이름 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customName"
                  {...register('customName', { 
                    required: '장소 이름을 입력해주세요',
                    minLength: {
                      value: 2,
                      message: '장소 이름은 최소 2글자 이상이어야 합니다'
                    }
                  })}
                  placeholder="예: 우리 집, 회사, 단골 카페 등"
                  className={`${errors.customName ? 'border-red-500' : 'border-purple-200'} focus:border-purple-500`}
                />
                {errors.customName && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.customName.message}
                  </p>
                )}
              </div>

              {/* 상세 설명 */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-800">
                  상세 설명 (사건, 상황) <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  {...register('description', { 
                    required: '상세 설명을 입력해주세요',
                    minLength: {
                      value: 10,
                      message: '설명은 최소 10글자 이상 입력해주세요'
                    }
                  })}
                  placeholder="이 장소에서 일어난 일이나 특별한 상황을 자세히 설명해주세요. 
예: 친구들과 즐거운 시간을 보냈던 곳, 중요한 회의가 있었던 장소, 혼자만의 시간을 즐겼던 공간 등"
                  className={`min-h-[100px] ${errors.description ? 'border-red-500' : 'border-purple-200'} focus:border-purple-500`}
                  rows={4}
                />
                {errors.description && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* 스토리 힌트 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-800">
                  스토리 힌트 <span className="text-red-500">*</span>
                </Label>
                
                {/* 미리 정의된 힌트 */}
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">추천 힌트 중 선택하거나 직접 입력하세요:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {STORY_HINTS.map((hint) => (
                      <Button
                        key={hint}
                        type="button"
                        variant={selectedHint === hint ? 'default' : 'outline'}
                        size="sm"
                        className={`text-xs text-left justify-start h-auto py-2 px-3 ${
                          selectedHint === hint 
                            ? 'bg-purple-600 hover:bg-purple-700' 
                            : 'border-purple-200 hover:bg-purple-50'
                        }`}
                        onClick={() => handleHintSelect(hint)}
                      >
                        {hint}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 직접 입력 */}
                <Input
                  {...register('storyHint', { 
                    required: '스토리 힌트를 선택하거나 입력해주세요',
                    minLength: {
                      value: 5,
                      message: '스토리 힌트는 최소 5글자 이상이어야 합니다'
                    }
                  })}
                  placeholder="또는 직접 입력하세요 (예: 운명적인 만남이 시작된 곳)"
                  value={selectedHint}
                  onChange={(e) => {
                    setSelectedHint(e.target.value)
                    setValue('storyHint', e.target.value)
                  }}
                  className={`${errors.storyHint ? 'border-red-500' : 'border-purple-200'} focus:border-purple-500`}
                />
                {errors.storyHint && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.storyHint.message}
                  </p>
                )}
              </div>

              {/* 액션 버튼 */}
              <div className="flex justify-between gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  이전
                </Button>
                
                <Button
                  type="submit"
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  {currentIndex === editedRoutes.length - 1 ? (
                    <>
                      <Check className="w-4 h-4" />
                      완료
                    </>
                  ) : (
                    <>
                      다음
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}