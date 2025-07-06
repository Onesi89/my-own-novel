/**
 * Main Dashboard Widget
 * FSD: widgets/main
 * 
 * 로그인 후 메인 대시보드 - 구글 타임라인 연동 및 소설 생성
 * cursor rules 준수: 위젯 구성, 사용자 경험, 접근성
 */

'use client'

import React, { useEffect, useState } from 'react'
import { 
  MapPin, 
  Sparkles, 
  Calendar, 
  Settings, 
  LogOut, 
  User, 
  Plus,
  BookOpen,
  Clock,
  Download,
  Upload
} from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Separator,
  Input,
  Label
} from '@/shared/ui'
import { useAuth } from '@/features/auth'
import { useMainPage } from '@/features/main'
import { MapRouteSelector } from './MapRouteSelector'

export function MainDashboard() {
  const { logout } = useAuth()
  const {
    user,
    selectedDateRange,
    timelineData,
    isLoadingTimeline,
    isGeneratingStory,
    isUploadingFile,
    hasTimelineData,
    canGenerateStory,
    lastSyncTime,
    setSelectedDateRange,
    syncTimelineData,
    uploadGoogleTakeout,
    generateStory,
    getDateRangeLabel,
  } = useMainPage()

  // UI 상태 관리
  const [currentView, setCurrentView] = useState<'dashboard' | 'map-selector'>('dashboard')

  console.log(">>>>>> currentView : " + currentView)

  // 파일 업로드용 날짜 필터링 상태
  const [filterDates, setFilterDates] = useState({
    start: '',
    end: ''
  })

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 대용량 파일인지 확인
      const fileSizeMB = file.size / (1024 * 1024)
      
      if (fileSizeMB > 50) {
        // 대용량 파일의 경우 클라이언트에서 필터링 필요
        if (!filterDates.start || !filterDates.end) {
          alert('파일이 큽니다 (50MB+). 날짜 범위를 선택해서 필터링 후 업로드하세요.')
          return
        }
        
        // 클라이언트 사이드 필터링 후 업로드
        await processAndUploadLargeFile(file)
      } else {
        // 작은 파일은 바로 업로드
        uploadGoogleTakeout(file)
      }
    }
    // Reset input
    event.target.value = ''
  }

  const processAndUploadLargeFile = async (file: File) => {
    try {
      const { processGoogleTakeoutFile } = await import('@/features/timeline/api/clientFileProcessor')
      
      const result = await processGoogleTakeoutFile(file, {
        startDate: filterDates.start,
        endDate: filterDates.end,
        maxLocations: 1000 // 최대 1000개 위치로 제한
      })

      if (result.success && result.data) {
        // 필터링된 데이터를 JSON Blob으로 변환 후 업로드
        const filteredData = {
          locations: result.data.locations,
          metadata: result.data.metadata
        }
        
        const blob = new Blob([JSON.stringify(filteredData)], { type: 'application/json' })
        const processedFile = new File([blob], `filtered_${file.name}`, { type: 'application/json' })
        
        uploadGoogleTakeout(processedFile)
      } else {
        alert(`파일 처리 실패: ${result.error}`)
      }
    } catch (error) {
      console.error('대용량 파일 처리 오류:', error)
      alert('파일 처리 중 오류가 발생했습니다.')
    }
  }

  // 새 소설 만들기 핸들러
  const handleCreateNewStory = () => {
    setCurrentView('map-selector')
  }

  // 경로 선택 완료 핸들러
  const handleRouteSelect = (selectedRoutes: any[]) => {
    console.log('Selected routes:', selectedRoutes)
    // TODO: 선택된 경로를 기반으로 소설 생성 API 호출
    generateStory(selectedRoutes)
    setCurrentView('dashboard')
  }
  
  // 맵 선택기 취소 핸들러  
  const handleMapCancel = () => {
    setCurrentView('dashboard')
  }

  // 현재 뷰에 따른 렌더링
  if (currentView === 'map-selector') {
    // timelineData에서 모든 locations를 플랫화
    const allLocations = timelineData.flatMap(data => data.locations || [])
    
    console.log('MainDashboard - Map Selector 데이터:', {
      timelineDataLength: timelineData.length,
      allLocationsLength: allLocations.length,
      sampleLocation: allLocations[0]
    })
    
    return (
      <MapRouteSelector
        timelineData={allLocations}
        onRouteSelect={handleRouteSelect}
        onCancel={handleMapCancel}
        maxRoutes={5}
      />
    )
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <MapPin className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">StoryPath</span>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage 
                    src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture} 
                    alt={user?.user_metadata?.full_name || user?.email} 
                  />
                  <AvatarFallback>
                    {(user?.user_metadata?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  <Settings className="w-4 h-4 mr-2" />
                  설정
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  로그아웃
                </Button>
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
              <div className="p-4 bg-blue-100 rounded-full">
                <Sparkles className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              안녕하세요, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}님!
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              구글 타임라인의 이동 경로를 바탕으로 나만의 특별한 소설을 만들어보세요.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleCreateNewStory}>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-purple-100 rounded-full">
                    {isGeneratingStory ? (
                      <div className="w-6 h-6 animate-spin rounded-full border-2 border-purple-300 border-t-purple-600"></div>
                    ) : (
                      <Plus className="w-6 h-6 text-purple-600" />
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg">
                  {isGeneratingStory ? '소설 생성 중...' : '새 소설 만들기'}
                </CardTitle>
                <CardDescription>
                  {isGeneratingStory 
                    ? 'AI가 이동 경로를 바탕으로 소설을 만들고 있습니다...'
                    : '지도에서 이동 경로를 선택하여 AI가 새로운 소설을 생성합니다'
                  }
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-orange-100 rounded-full">
                    <BookOpen className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <CardTitle className="text-lg">내 소설 보기</CardTitle>
                <CardDescription>
                  지금까지 생성한 소설들을 확인하고 관리합니다
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Google Takeout 안내 */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Download className="w-5 h-5" />
                Google 타임라인으로 실제 위치 데이터 사용하기
              </CardTitle>
              <CardDescription className="text-blue-700">
                본인의 실제 이동 경로로 소설을 만들고 싶다면 Google 타임라인을 이용해보세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="font-medium text-blue-900">1.모바일 안드로이드 설정 &gt; 위치 &gt; 위치 서비스 이동</div>
                  <p className="text-blue-700">모바일에서 타임라인을 사용 중이시라면 타임라인 데이터를 요청하세요.</p>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-blue-900">2. 타임라인 &gt; 타임라인 데이터 내보내기</div>
                  <p className="text-blue-700">JSON 형식으로 다운로드하면 semanticSegments가 포함된 파일을 받게 됩니다</p>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-blue-900">3. 날짜 필터링 업로드</div>
                  <p className="text-blue-700">대용량 파일은 위에서 날짜 범위를 선택 후 업로드하세요</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Range Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                소설 생성 기간 선택
              </CardTitle>
              <CardDescription>
                어떤 기간의 이동 경로로 소설을 만들까요?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(['today', 'yesterday', 'week', 'month', 'custom'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={selectedDateRange === range ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDateRange(range)}
                  >
                    {getDateRangeLabel(range)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                최근 활동
              </CardTitle>
              <CardDescription>
                최근 생성한 소설과 동기화 기록을 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">계정 설정 완료</p>
                    <p className="text-sm text-gray-500">구글 계정으로 로그인했습니다</p>
                  </div>
                  <Badge variant="secondary">완료</Badge>
                </div>
                
                <div className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg ${hasTimelineData ? '' : 'opacity-60'}`}>
                  <div className="p-2 bg-green-100 rounded-full">
                    <Download className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">타임라인 동기화</p>
                    <p className="text-sm text-gray-500">
                      {hasTimelineData 
                        ? `${timelineData.length}개의 위치 데이터를 가져왔습니다`
                        : '구글 타임라인 데이터를 가져옵니다'
                      }
                    </p>
                  </div>
                  <Badge variant={hasTimelineData ? "default" : "outline"}>
                    {hasTimelineData ? "완료" : "대기중"}
                  </Badge>
                </div>
                
                <div className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg ${timelineData.some(t => t.storyGenerated) ? '' : 'opacity-60'}`}>
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">소설 생성</p>
                    <p className="text-sm text-gray-500">
                      {timelineData.some(t => t.storyGenerated)
                        ? '이동 경로 기반 소설이 생성되었습니다'
                        : 'AI가 나만의 이야기를 만들어줍니다'
                      }
                    </p>
                  </div>
                  <Badge variant={timelineData.some(t => t.storyGenerated) ? "default" : "outline"}>
                    {timelineData.some(t => t.storyGenerated) ? "완료" : "대기중"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}