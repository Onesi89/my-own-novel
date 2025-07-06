/**
 * Main Dashboard Client Component
 * FSD: widgets/main
 * 
 * 메인 대시보드의 클라이언트 측 상호작용 처리
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus,
  BookOpen,
  Clock,
  FileText,
  Calendar,
  Sparkles
} from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Button,
  Badge
} from '@/shared/ui'
import { useMainPage } from '@/features/main'

interface RecentStory {
  id: string
  title: string
  genre: string
  created_at: string
  status: 'draft' | 'completed' | 'archived'
}

export function MainDashboardClient() {
  const router = useRouter()
  const { isGeneratingStory } = useMainPage()
  const [recentStories, setRecentStories] = useState<RecentStory[]>([])
  const [isLoadingStories, setIsLoadingStories] = useState(false)

  // 최근 소설 데이터 가져오기
  useEffect(() => {
    const fetchRecentStories = async () => {
      setIsLoadingStories(true)
      try {
        const response = await fetch('/api/stories?limit=5', {
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setRecentStories(result.data.stories)
          }
        }
      } catch (error) {
        console.error('Failed to fetch recent stories:', error)
      } finally {
        setIsLoadingStories(false)
      }
    }

    fetchRecentStories()
  }, [])

  const getGenreBadgeColor = (genre: string) => {
    const colors: Record<string, string> = {
      'SF': 'bg-indigo-100 text-indigo-800',
      'romance': 'bg-purple-100 text-purple-800',
      'comedy': 'bg-violet-100 text-violet-800',
      'mystery': 'bg-purple-100 text-purple-800',
      'drama': 'bg-slate-100 text-slate-800',
      'adventure': 'bg-indigo-100 text-indigo-800'
    }
    return colors[genre] || 'bg-purple-100 text-purple-800'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}시간 전`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}일 전`
    }
  }

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50" onClick={() => router.push('/create-story')}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full">
                {isGeneratingStory ? (
                  <div className="w-8 h-8 animate-spin rounded-full border-3 border-purple-300 border-t-purple-600"></div>
                ) : (
                  <Plus className="w-8 h-8 text-purple-600" />
                )}
              </div>
            </div>
            <CardTitle className="text-xl mb-2 text-purple-900">
              {isGeneratingStory ? '소설 생성 중...' : '새 소설 만들기'}
            </CardTitle>
            <CardDescription className="text-base text-purple-700">
              {isGeneratingStory 
                ? 'AI가 이동 경로를 바탕으로 소설을 만들고 있습니다...'
                : '지도에서 이동 경로를 선택하거나 Google 타임라인 데이터를 업로드하여 AI가 새로운 소설을 생성합니다'
              }
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50" onClick={() => router.push('/my-stories')}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-r from-indigo-100 to-indigo-200 rounded-full">
                <BookOpen className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
            <CardTitle className="text-xl mb-2 text-indigo-900">내 소설 보기</CardTitle>
            <CardDescription className="text-base text-indigo-700">
              지금까지 생성한 소설들을 확인하고 관리합니다
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Activity - Generated Stories */}
      <Card className="max-w-4xl mx-auto border-purple-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            최근 생성한 소설
          </CardTitle>
          <CardDescription className="text-purple-700">
            최근에 AI가 생성한 소설들을 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingStories ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-purple-300 border-t-purple-600"></div>
              <span className="ml-2 text-purple-600">소설 목록을 불러오는 중...</span>
            </div>
          ) : recentStories.length > 0 ? (
            <div className="space-y-3">
              {recentStories.map((story) => (
                <div 
                  key={story.id} 
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100 hover:shadow-sm hover:border-purple-200 transition-all cursor-pointer"
                  onClick={() => router.push(`/stories/${story.id}`)}
                >
                  <div className="p-2 bg-purple-100 rounded-full flex-shrink-0">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {story.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getGenreBadgeColor(story.genre)}`}
                      >
                        {story.genre}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDate(story.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={story.status === 'completed' ? 'default' : 'outline'}
                      className={`text-xs ${story.status === 'completed' ? 'bg-purple-100 text-purple-800' : 'border-purple-200 text-purple-700'}`}
                    >
                      {story.status === 'completed' ? '완료' : story.status === 'draft' ? '초안' : '보관'}
                    </Badge>
                    <Sparkles className="w-4 h-4 text-purple-500" />
                  </div>
                </div>
              ))}
              
              {recentStories.length === 5 && (
                <div className="text-center pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/my-stories')}
                    className="text-sm border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    더 많은 소설 보기
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="p-4 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FileText className="w-8 h-8 text-purple-400" />
              </div>
              <h4 className="font-medium text-purple-800 mb-2">아직 생성한 소설이 없습니다</h4>
              <p className="text-sm text-purple-600 mb-4">
                첫 번째 소설을 만들어보세요!
              </p>
              <Button 
                onClick={() => router.push('/create-story')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                새 소설 만들기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Features Highlight */}
      <Card className="max-w-4xl mx-auto bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Sparkles className="w-5 h-5" />
            AI 소설 생성 기능
          </CardTitle>
          <CardDescription className="text-purple-700">
            Google Gemini 2.5 Flash를 사용하여 빠르고 창의적인 소설을 생성합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="p-3 bg-purple-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-purple-900 mb-2">실제 경로 기반</h4>
              <p className="text-sm text-purple-700">
                Google 타임라인 또는 지도 선택으로 실제 이동 경로를 소설로 변환
              </p>
            </div>
            <div className="text-center p-4">
              <div className="p-3 bg-indigo-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <h4 className="font-medium text-indigo-900 mb-2">AI 창작</h4>
              <p className="text-sm text-indigo-700">
                최신 AI 모델이 5천-7천자 분량의 창의적인 소설을 자동 생성
              </p>
            </div>
            <div className="text-center p-4">
              <div className="p-3 bg-purple-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-purple-900 mb-2">인터랙티브</h4>
              <p className="text-sm text-purple-700">
                장소별 선택지를 통해 스토리 전개를 직접 결정할 수 있음
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}