/**
 * Route Selection Sheet Component
 * FSD: features/story/ui/CreateStory
 * 
 * 경로 선택 Sheet 모달 - 원래 UI 정확히 복원
 * - 지도에서 선택 탭
 * - 파일 업로드 탭
 */

'use client'

import React, { useState } from 'react'
import { 
  MapPin,
  Route,
  Upload,
  FileText,
  Download,
  Info,
  Clock,
  Navigation
} from 'lucide-react'
import { 
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge
} from '@/shared/ui'
import { useStoryCreation } from '../../context/StoryCreationContext'
import { useMainPage } from '@/features/main'
import { MapRouteSelectorEmbedded } from '@/widgets/main/MapRouteSelectorEmbedded'

export function RouteSelectionSheet() {
  const { state, closeModal, openModal, setSelectedRoutes } = useStoryCreation()
  const { 
    timelineData, 
    uploadGoogleTakeout,
    isUploadingFile,
    isLoadingTimeline 
  } = useMainPage()

  // 로컬 상태
  const [routeSelectionMode, setRouteSelectionMode] = useState<'map' | 'upload'>('map')
  const [isMapMode, setIsMapMode] = useState(false)
  const [filterDates, setFilterDates] = useState({
    start: '',
    end: ''
  })

  // 평탄화된 위치 데이터
  const allLocations = timelineData.flatMap(data => data.locations || [])

  // 맵 선택 시작
  const handleStartMapSelection = () => {
    setIsMapMode(true)
  }

  // 경로 선택 완료
  const handleRouteSelectionComplete = (routes: any[]) => {
    setSelectedRoutes(routes)
    setIsMapMode(false)
    openModal('isRouteConfirmOpen')
  }

  // 파일 업로드
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const fileSizeMB = file.size / (1024 * 1024)
      
      if (fileSizeMB > 50) {
        if (!filterDates.start || !filterDates.end) {
          alert('파일이 큽니다 (50MB+). 날짜 범위를 선택해서 필터링 후 업로드하세요.')
          return
        }
      }
      
      try {
        await uploadGoogleTakeout(file)
        setRouteSelectionMode('map')
      } catch (error) {
        console.error('업로드 실패:', error)
        alert('파일 업로드에 실패했습니다.')
      }
    }
  }

  return (
    <Sheet open={state.modals.isRouteSelectionOpen} onOpenChange={(open) => {
      if (!open) closeModal('isRouteSelectionOpen')
    }}>
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
              className={`flex-1 flex items-center gap-2 ${
                routeSelectionMode === 'map' 
                  ? 'bg-purple-600 hover:bg-purple-700' 
                  : 'hover:bg-purple-50'
              }`}
            >
              <MapPin className="w-4 h-4" />
              지도에서 선택
            </Button>
            <Button
              variant={routeSelectionMode === 'upload' ? 'default' : 'ghost'}
              onClick={() => setRouteSelectionMode('upload')}
              className={`flex-1 flex items-center gap-2 ${
                routeSelectionMode === 'upload' 
                  ? 'bg-purple-600 hover:bg-purple-700' 
                  : 'hover:bg-purple-50'
              }`}
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
                  총 {allLocations.length}개의 이동 경로가 준비되어 있습니다.
                </p>
              </div>
              
              {!isMapMode ? (
                <div className="flex flex-col items-center space-y-4">
                  <Button
                    onClick={handleStartMapSelection}
                    disabled={isLoadingTimeline || allLocations.length === 0}
                    className="bg-purple-600 hover:bg-purple-700"
                    size="lg"
                  >
                    <MapPin className="w-5 h-5 mr-2" />
                    지도에서 경로 선택하기
                  </Button>
                  
                  <p className="text-sm text-purple-600 text-center">
                    {allLocations.length === 0 
                      ? '먼저 Google 타임라인을 업로드하거나 체험용 데이터를 사용하세요' 
                      : '지도에서 최대 5개의 경로를 선택할 수 있습니다'
                    }
                  </p>
                </div>
              ) : (
                <MapRouteSelectorEmbedded
                  timelineData={allLocations}
                  onRouteSelect={handleRouteSelectionComplete}
                  onCancel={() => setIsMapMode(false)}
                  maxRoutes={5}
                />
              )}
            </div>
          )}
          
          {/* 파일 업로드 모드 */}
          {routeSelectionMode === 'upload' && (
            <div className="space-y-6">
              {/* 업로드 안내 */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Google 타임라인 업로드
                </h4>
                <p className="text-purple-700 text-sm">
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
                            "위치 기록" 선택 후<br/>
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
                      max={new Date().toISOString().split('T')[0]}
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
                      min={filterDates.start}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>

              {/* 파일 업로드 */}
              <div className="flex flex-col items-center space-y-4 p-8 border-2 border-dashed border-purple-300 rounded-lg bg-purple-50">
                <Upload className="w-12 h-12 text-purple-500" />
                <div className="text-center">
                  <p className="text-sm font-medium text-purple-900">
                    Google 타임라인 JSON 파일을 업로드하세요
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    최대 100MB, 날짜 필터 사용 권장
                  </p>
                </div>
                
                <Label htmlFor="timeline-upload" className="cursor-pointer">
                  <Input
                    id="timeline-upload"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploadingFile}
                  />
                  <Button 
                    disabled={isUploadingFile}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isUploadingFile ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        업로드 중...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        파일 선택
                      </>
                    )}
                  </Button>
                </Label>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}