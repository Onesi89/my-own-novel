/**
 * Create Story Client Original Component
 * FSD: widgets/main
 * 
 * git hash 4dca1a13 버전과 정확히 동일한 UI
 * Component Composition Pattern 적용하지 않고 원본 그대로 유지
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft,
  MapPin,
  Route,
  Upload,
  FileText,
  Sparkles,
  X,
  CheckCircle,
  Clock,
  Navigation,
  Download,
  Info
} from 'lucide-react'
import { 
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Input,
  Label,
  Badge,
  Separator
} from '@/shared/ui'
import { useMainPage } from '@/features/main'
import { MapRouteSelectorEmbedded } from './MapRouteSelectorEmbedded'
import { InlineStorySetup } from '@/features/story/InlineStorySetup'
import { InteractiveStoryFlow } from '@/features/story/InteractiveStoryFlow'
import { RouteEditingFlow } from '@/features/story/RouteEditingFlow'
import { StorySettings, InteractiveStorySession } from '@/shared/lib/story/types'

export function CreateStoryClientOriginal() {
  const router = useRouter()
  const {
    timelineData,
    isLoadingTimeline,
    isGeneratingStory,
    isUploadingFile,
    uploadGoogleTakeout,
    generateStory
  } = useMainPage()

  // 모달 상태
  const [isRouteSelectionOpen, setIsRouteSelectionOpen] = useState(false)
  const [isRouteEditingOpen, setIsRouteEditingOpen] = useState(false)
  const [isInlineStorySetupOpen, setIsInlineStorySetupOpen] = useState(false)
  const [isInteractiveStoryOpen, setIsInteractiveStoryOpen] = useState(false)
  const [isRouteConfirmOpen, setIsRouteConfirmOpen] = useState(false)
  const [storySettings, setStorySettings] = useState<StorySettings | null>(null)
  const [isContentFadingOut, setIsContentFadingOut] = useState(false)
  
  // 경로 선택 상태
  const [isMapMode, setIsMapMode] = useState(false)
  const [selectedRoutes, setSelectedRoutes] = useState<any[]>([])
  const [routeSelectionMode, setRouteSelectionMode] = useState<'map' | 'upload'>('map')
  
  // 파일 업로드 상태
  const [filterDates, setFilterDates] = useState({
    start: '',
    end: ''
  })
  
  // AI 제공자는 고정 (Gemini 2.5 Flash)
  const aiProvider = 'gemini' as const

  // 뒤로가기
  const handleBack = () => {
    router.push('/dashboard')
  }

  // 경로 선택 모달 열기
  const handleOpenRouteSelection = () => {
    setIsRouteSelectionOpen(true)
  }

  // 경로 선택 완료 (확인 모달 표시)
  const handleRouteSelectionComplete = (routes: any[]) => {
    setSelectedRoutes(routes)
    setIsMapMode(false)
    setIsRouteConfirmOpen(true)
  }

  // 경로 확정 확인 - 강제 편집 플로우로 이동
  const handleRouteConfirm = () => {
    setIsRouteConfirmOpen(false)
    setIsRouteSelectionOpen(false)
    setIsRouteEditingOpen(true)
  }

  // 소설 설정 완료
  const handleStorySettingsConfirm = (settings: StorySettings) => {
    setStorySettings(settings)
    setIsInlineStorySetupOpen(false)
    setIsInteractiveStoryOpen(true)
  }

  // 인터랙티브 소설 완료
  const handleInteractiveStoryComplete = async (session: InteractiveStorySession) => {
    try {
      // 실제 소설 생성 API 호출
      const result = await generateStory(
        session.routes,
        {
          genre: session.settings.genre,
          style: session.settings.style,
          tone: 'light',
          length: 6000
        },
        aiProvider
      )
      
      setIsInteractiveStoryOpen(false)
      // 생성된 소설 페이지로 이동
      if (result?.storyId) {
        router.push(`/stories/${result.storyId}`)
      } else {
        router.push('/my-stories')
      }
    } catch (error) {
      console.error('Story generation error:', error)
      setIsInteractiveStoryOpen(false)
      // 에러 처리 - 일단 대시보드로 이동
      router.push('/dashboard')
    }
  }

  // 인터랙티브 소설에서 뒤로가기
  const handleInteractiveStoryBack = () => {
    setIsInteractiveStoryOpen(false)
    setIsInlineStorySetupOpen(true)
  }

  // 인라인 소설 설정에서 뒤로가기 - 경로 확정 모달로 돌아가기
  const handleInlineStorySetupBack = () => {
    setIsInlineStorySetupOpen(false)
    setIsContentFadingOut(false)
    setIsRouteConfirmOpen(true)
  }

  // 경로 편집 완료
  const handleRouteEditingComplete = (editedRoutes: any[]) => {
    setSelectedRoutes(editedRoutes)
    setIsRouteEditingOpen(false)
    // 페이드 아웃 시작
    setIsContentFadingOut(true)
    setTimeout(() => {
      setIsInlineStorySetupOpen(true)
    }, 500)
  }

  // 경로 편집에서 뒤로가기
  const handleRouteEditingBack = () => {
    setIsRouteEditingOpen(false)
    setIsRouteConfirmOpen(true)
  }

  // 경로 확정 취소
  const handleRouteConfirmCancel = () => {
    setIsRouteConfirmOpen(false)
    // 경로 선택 상태는 유지하고 다시 지도 모드로
    setIsMapMode(true)
  }

  // 날짜 범위 유효성 검사 (3일 제한)
  const validateDateRange = (startDate: string, endDate: string): { isValid: boolean; message?: string } => {
    if (!startDate || !endDate) {
      return { isValid: false, message: '시작일과 종료일을 모두 선택해주세요.' }
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const today = new Date()
    
    // 미래 날짜 체크
    if (start > today || end > today) {
      return { isValid: false, message: '미래 날짜는 선택할 수 없습니다.' }
    }
    
    // 시작일이 종료일보다 늦은 경우
    if (start > end) {
      return { isValid: false, message: '시작일이 종료일보다 늦을 수 없습니다.' }
    }
    
    // 3일 제한 체크
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays > 3) {
      return { isValid: false, message: '날짜 범위는 최대 3일까지만 선택 가능합니다.' }
    }
    
    return { isValid: true }
  }

  // 파일 업로드 처리
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const fileSizeMB = file.size / (1024 * 1024)
      
      if (fileSizeMB > 50) {
        if (!filterDates.start || !filterDates.end) {
          alert('파일이 큽니다 (50MB+). 날짜 범위를 선택해서 필터링 후 업로드하세요.')
          return
        }
        
        // 날짜 범위 유효성 검사
        const validation = validateDateRange(filterDates.start, filterDates.end)
        if (!validation.isValid) {
          alert(validation.message)
          return
        }
        
        // 대용량 파일: 클라이언트에서 날짜 필터링 후 업로드
        try {
          await handleLargeFileUpload(file, filterDates.start, filterDates.end)
          event.target.value = ''
          
          // 파일 업로드 성공 후 지도 모드로 전환
          setRouteSelectionMode('map')
          setIsMapMode(true)
        } catch (error) {
          console.error('대용량 파일 업로드 실패:', error)
          alert('파일 업로드에 실패했습니다. 다시 시도해주세요.')
        }
      } else {
        // 소용량 파일: 직접 업로드
        try {
          await uploadGoogleTakeout(file)
          event.target.value = ''
          
          // 파일 업로드 성공 후 지도 모드로 전환
          setRouteSelectionMode('map')
          setIsMapMode(true)
        } catch (error) {
          console.error('파일 업로드 실패:', error)
          alert('파일 업로드에 실패했습니다. 다시 시도해주세요.')
        }
      }
    }
  }

  // 대용량 파일 클라이언트 처리
  const handleLargeFileUpload = async (file: File, startDate: string, endDate: string) => {
    // 동적 import로 클라이언트 프로세서 로드
    const { processGoogleTakeoutFile } = await import('@/features/timeline/api/clientFileProcessor')
    
    // 클라이언트에서 날짜 필터링
    const result = await processGoogleTakeoutFile(file, {
      startDate,
      endDate,
      maxLocations: 10000 // 최대 1만개로 제한
    })

    if (!result.success) {
      throw new Error(result.error)
    }

    // 필터링된 데이터를 서버로 전송 (작은 크기)
    const processedData = {
      locations: result.data!.locations,
      metadata: result.data!.metadata
    }

    // Blob으로 변환해서 업로드 (메모리 효율성)
    const processedBlob = new Blob([JSON.stringify(processedData)], { type: 'application/json' })
    const processedFile = new File([processedBlob], `filtered_${file.name}`, { type: 'application/json' })
    
    await uploadGoogleTakeout(processedFile)
  }

  // 지도에서 경로 선택 모드 시작
  const handleStartMapSelection = () => {
    setIsMapMode(true)
  }

  // 지도 경로 선택 완료
  const handleMapRouteSelect = (routes: any[]) => {
    handleRouteSelectionComplete(routes)
    setIsMapMode(false)
  }

  // 지도 경로 선택 취소
  const handleMapRouteCancel = () => {
    setIsMapMode(false)
  }

  return (
    <>
      {/* 경로 편집 플로우 */}
      {isRouteEditingOpen && (
        <RouteEditingFlow
          routes={selectedRoutes}
          onComplete={handleRouteEditingComplete}
          onBack={handleRouteEditingBack}
        />
      )}

      {/* 인라인 소설 설정 화면 */}
      {isInlineStorySetupOpen && (
        <InlineStorySetup
          routesCount={selectedRoutes.length}
          onComplete={handleStorySettingsConfirm}
          onBack={handleInlineStorySetupBack}
        />
      )}

      {/* 메인 컨텐츠 - 페이드 아웃 애니메이션 */}
      <AnimatePresence>
        {!isInlineStorySetupOpen && !isRouteEditingOpen && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: isContentFadingOut ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onAnimationComplete={() => {
              if (isContentFadingOut) {
                // 페이드 아웃 완료 후 상태 초기화는 부모에서 처리
              }
            }}
          >
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-sm border-b border-purple-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="flex items-center gap-2 hover:bg-purple-50"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">뒤로가기</span>
                  </Button>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-purple-600" />
                    <h1 className="text-xl font-bold text-purple-900">새 소설 만들기</h1>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-8">
              {/* Welcome Section */}
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-purple-100 rounded-full">
                    <Sparkles className="w-10 h-10 text-purple-600" />
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-purple-900">
                  나만의 특별한 소설을 만들어보세요
                </h2>
                <p className="text-lg text-purple-700 max-w-2xl mx-auto">
                  2단계 과정을 통해 이동 경로를 선택하고 AI가 맞춤형 소설을 생성합니다.
                </p>
              </div>

              {/* Progress Steps */}
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Step 1: 경로 선택 */}
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-4">
                        <div className="p-3 bg-purple-100 rounded-full">
                          <Route className="w-8 h-8 text-purple-600" />
                        </div>
                      </div>
                      <CardTitle className="text-xl text-purple-900">
                        1단계: 경로 선택
                      </CardTitle>
                      <CardDescription className="text-purple-700">
                        이동 경로를 직접 선택하거나<br/>Google 타임라인을 업로드하세요
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-purple-800">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          <span>지도에서 직접 경로 선택</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-purple-800">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          <span>Google 타임라인 파일 업로드</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-purple-800">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          <span>최대 5개 경로 선택 가능</span>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleOpenRouteSelection}
                        disabled={isLoadingTimeline}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        <Route className="w-4 h-4 mr-2" />
                        경로 선택하기
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Step 2: 소설 생성 */}
                  <Card className={`border-2 transition-all ${selectedRoutes.length > 0 ? 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 cursor-pointer hover:shadow-lg' : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'}`}>
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-4">
                        <div className={`p-3 rounded-full ${selectedRoutes.length > 0 ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                          <FileText className={`w-8 h-8 ${selectedRoutes.length > 0 ? 'text-indigo-600' : 'text-gray-400'}`} />
                        </div>
                      </div>
                      <CardTitle className={`text-xl ${selectedRoutes.length > 0 ? 'text-indigo-900' : 'text-gray-500'}`}>
                        2단계: 소설 생성
                      </CardTitle>
                      <CardDescription className={selectedRoutes.length > 0 ? 'text-indigo-700' : 'text-gray-500'}>
                        선택한 경로를 바탕으로<br/>AI가 소설을 생성합니다
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className={`flex items-center gap-2 text-sm ${selectedRoutes.length > 0 ? 'text-indigo-800' : 'text-gray-500'}`}>
                          <div className={`w-2 h-2 rounded-full ${selectedRoutes.length > 0 ? 'bg-indigo-400' : 'bg-gray-300'}`}></div>
                          <span>장르 및 스타일 선택</span>
                        </div>
                        <div className={`flex items-center gap-2 text-sm ${selectedRoutes.length > 0 ? 'text-indigo-800' : 'text-gray-500'}`}>
                          <div className={`w-2 h-2 rounded-full ${selectedRoutes.length > 0 ? 'bg-indigo-400' : 'bg-gray-300'}`}></div>
                          <span>캐릭터 설정</span>
                        </div>
                        <div className={`flex items-center gap-2 text-sm ${selectedRoutes.length > 0 ? 'text-indigo-800' : 'text-gray-500'}`}>
                          <div className={`w-2 h-2 rounded-full ${selectedRoutes.length > 0 ? 'bg-indigo-400' : 'bg-gray-300'}`}></div>
                          <span>AI 소설 생성</span>
                        </div>
                      </div>
                      
                      {selectedRoutes.length > 0 && (
                        <div className="bg-indigo-100 border border-indigo-200 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2 text-sm text-indigo-800">
                            <Badge variant="secondary" className="bg-indigo-200 text-indigo-800">
                              {selectedRoutes.length}개 경로 선택됨
                            </Badge>
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        onClick={() => {
                          setIsContentFadingOut(true)
                          setTimeout(() => {
                            setIsInlineStorySetupOpen(true)
                          }, 500)
                        }}
                        disabled={selectedRoutes.length === 0 || isGeneratingStory}
                        className={`w-full ${selectedRoutes.length > 0 ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {selectedRoutes.length > 0 ? '인터랙티브 소설 만들기' : '경로를 먼저 선택하세요'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 경로 선택 모달 */}
      <Sheet open={isRouteSelectionOpen} onOpenChange={setIsRouteSelectionOpen}>
        <SheetContent side="bottom" className={`overflow-y-auto ${isMapMode ? 'h-full' : 'h-[85vh]'}`}>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Route className="w-5 h-5 text-purple-600" />
              경로 선택
            </SheetTitle>
            <SheetDescription>
              소설의 배경이 될 이동 경로를 선택하거나 Google 타임라인을 업로드하세요.
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {/* 탭 선택 버튼 */}
            <div className="flex gap-2 bg-purple-100 p-1 rounded-lg">
              <Button
                variant={routeSelectionMode === 'map' ? 'default' : 'ghost'}
                onClick={() => setRouteSelectionMode('map')}
                className={`flex-1 flex items-center gap-2 ${routeSelectionMode === 'map' ? 'bg-purple-600 hover:bg-purple-700' : 'hover:bg-purple-50'}`}
              >
                <MapPin className="w-4 h-4" />
                지도에서 선택
              </Button>
              <Button
                variant={routeSelectionMode === 'upload' ? 'default' : 'ghost'}
                onClick={() => setRouteSelectionMode('upload')}
                className={`flex-1 flex items-center gap-2 ${routeSelectionMode === 'upload' ? 'bg-purple-600 hover:bg-purple-700' : 'hover:bg-purple-50'}`}
              >
                <Upload className="w-4 h-4" />
                파일 업로드
              </Button>
            </div>
            
            {/* 지도 선택 모드 */}
            {routeSelectionMode === 'map' && (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-900 mb-2">현재 사용 가능한 데이터</h4>
                  <p className="text-purple-700 text-sm">
                    총 {timelineData.flatMap(data => data.locations || []).length}개의 이동 경로가 준비되어 있습니다.
                  </p>
                </div>
                
                {!isMapMode ? (
                  <div className="flex flex-col items-center space-y-4">
                    <Button
                      onClick={handleStartMapSelection}
                      disabled={isLoadingTimeline}
                      className="bg-purple-600 hover:bg-purple-700"
                      size="lg"
                    >
                      <MapPin className="w-5 h-5 mr-2" />
                      지도에서 경로 선택하기
                    </Button>
                    
                    <p className="text-sm text-purple-600 text-center">
                      {timelineData.length > 0 
                        ? "지도에서 최대 5개의 이동 경로를 선택할 수 있습니다."
                        : "기본 지도에서 직접 경로를 그려서 선택할 수 있습니다."
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 지도 컨트롤 바 */}
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-purple-600" />
                        <h4 className="font-medium text-purple-900">경로 선택 지도</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleMapRouteCancel}
                          className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          뒤로가기
                        </Button>
                      </div>
                    </div>
                    
                    {/* 지도 영역 */}
                    <div className="h-[calc(100vh-200px)] border rounded-lg overflow-hidden bg-gray-100">
                      <MapRouteSelectorEmbedded
                        timelineData={timelineData.flatMap(data => data.locations || [])}
                        onRouteSelect={handleMapRouteSelect}
                        onCancel={handleMapRouteCancel}
                        maxRoutes={5}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* 파일 업로드 모드 */}
            {routeSelectionMode === 'upload' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Google 타임라인 업로드
                  </h4>
                  <p className="text-purple-700 text-sm mb-4">
                    본인의 실제 이동 경로로 소설을 만들고 싶다면 Google 타임라인을 업로드하세요.
                  </p>
                </div>

                {/* Google 타임라인 가이드 */}
                <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-900 text-base">
                      <Download className="w-4 h-4" />
                      Google 타임라인 데이터 가져오는 방법
                    </CardTitle>
                    <CardDescription className="text-purple-700 text-sm">
                      실제 이동 경로 데이터를 가져와 더욱 현실적인 소설을 만들어보세요
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="space-y-2 p-3 bg-white/60 rounded-lg">
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-green-600 font-bold text-xs">1</span>
                          </div>
                          <div>
                            <div className="font-medium text-green-900 mb-1">모바일 설정</div>
                            <p className="text-green-700 text-xs leading-relaxed">
                              Android: 설정 → 위치 → 위치 서비스<br/>
                              iPhone: 설정 → 개인정보 보호 → 위치 서비스
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 p-3 bg-white/60 rounded-lg">
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-blue-600 font-bold text-xs">2</span>
                          </div>
                          <div>
                            <div className="font-medium text-blue-900 mb-1">데이터 내보내기</div>
                            <p className="text-blue-700 text-xs leading-relaxed">
                              Google Takeout에서<br/>
                              &ldquo;위치 기록&rdquo; 선택 후<br/>
                              JSON 형식으로 다운로드
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 p-3 bg-white/60 rounded-lg">
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-purple-600 font-bold text-xs">3</span>
                          </div>
                          <div>
                            <div className="font-medium text-purple-900 mb-1">업로드 및 생성</div>
                            <p className="text-purple-700 text-xs leading-relaxed">
                              파일 크기가 클 경우<br/>
                              날짜 범위를 설정하여<br/>
                              필터링 후 업로드
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-blue-800">
                          <span className="font-medium">팁:</span> semanticSegments가 포함된 JSON 파일을 찾아 업로드하세요. 
                          대용량 파일의 경우 날짜 범위를 3일 이내로 설정하면 처리 속도가 빨라집니다.
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 날짜 필터링 */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    대용량 파일 필터링 (50MB+ 권장)
                  </Label>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                    <p className="text-xs text-yellow-800">
                      ⚠️ 날짜 범위는 최대 3일까지만 선택 가능합니다
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-date" className="text-xs text-gray-600">시작일</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={filterDates.start}
                        onChange={(e) => setFilterDates(prev => ({ ...prev, start: e.target.value }))}
                        className="text-sm"
                        max={new Date().toISOString().split('T')[0]} // 오늘 날짜까지만
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-date" className="text-xs text-gray-600">종료일</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={filterDates.end}
                        onChange={(e) => setFilterDates(prev => ({ ...prev, end: e.target.value }))}
                        className="text-sm"
                        max={new Date().toISOString().split('T')[0]} // 오늘 날짜까지만
                      />
                    </div>
                  </div>
                </div>

                {/* 파일 업로드 */}
                <div className="space-y-4">
                  <input
                    type="file"
                    id="location-history-upload-modal"
                    accept=".json"
                    onChange={handleFileUpload}
                    disabled={isUploadingFile}
                    className="hidden"
                  />
                  <Button
                    onClick={() => document.getElementById('location-history-upload-modal')?.click()}
                    disabled={isUploadingFile}
                    className="w-full"
                    variant="outline"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploadingFile ? '처리 중...' : '파일 선택'}
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    JSON 파일만 업로드 가능합니다.
                  </p>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* 경로 확정 확인 모달 */}
      <Sheet open={isRouteConfirmOpen} onOpenChange={setIsRouteConfirmOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-amber-600" />
              경로 정보 입력 필요
            </SheetTitle>
            <SheetDescription>
              선택한 경로들의 상세 정보를 입력해야 합니다. 각 장소마다 설명과 스토리 힌트를 필수로 입력하면 더 흥미진진한 소설이 만들어집니다.
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {selectedRoutes.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">선택된 경로 ({selectedRoutes.length}개)</h4>
                <div className="max-h-60 overflow-y-auto space-y-3">
                  {selectedRoutes.map((route, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="p-2 bg-amber-100 rounded-full">
                        <Navigation className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-amber-900 truncate">
                          {route.placeName || `경로 ${index + 1}`}
                        </p>
                        <p className="text-xs text-amber-700">
                          {route.address || '주소 정보 없음'}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-amber-700 border-amber-300">
                        선택됨
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleRouteConfirmCancel}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                경로 다시 선택
              </Button>
              <Button
                onClick={handleRouteConfirm}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                경로 정보 입력하기
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* 인터랙티브 소설 플로우 */}
      {isInteractiveStoryOpen && storySettings && (
        <InteractiveStoryFlow
          routes={selectedRoutes}
          settings={storySettings}
          onComplete={handleInteractiveStoryComplete}
          onBack={handleInteractiveStoryBack}
        />
      )}
    </>
  )
}