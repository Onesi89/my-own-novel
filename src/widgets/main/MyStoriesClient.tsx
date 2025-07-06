/**
 * My Stories Client Component
 * FSD: widgets/main
 * 
 * 내 소설 보기 - 클라이언트 컴포넌트
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  BookOpen,
  Calendar,
  MapPin,
  Clock,
  Star,
  Eye,
  Plus,
  Search,
  Filter,
  Loader2
} from 'lucide-react'
import { 
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Separator
} from '@/shared/ui'
import { useAuth } from '@/features/auth'
import { useToast } from '@/shared/lib'

// 실제 데이터 타입
interface Story {
  id: string
  title: string
  genre: string
  status: 'completed' | 'draft' | 'archived'
  file_path?: string
  file_type?: string
  created_at: string
  metadata?: {
    wordCount?: number
    estimatedReadTime?: number
    locations?: any[]
    aiModel?: string
  }
}

export function MyStoriesClient() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'draft' | 'archived'>('all')

  // 소설 목록 가져오기
  const fetchStories = async () => {
    if (!isAuthenticated || !user) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/stories/my-stories')
      
      if (!response.ok) {
        throw new Error('소설 목록을 가져오는데 실패했습니다.')
      }

      const data = await response.json()
      setStories(data.stories || [])
    } catch (error) {
      console.error('Stories fetch error:', error)
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '소설 목록을 가져오는데 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStories()
  }, [isAuthenticated, user])

  // 뒤로가기
  const handleBack = () => {
    router.push('/dashboard')
  }

  // 필터링된 스토리
  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         story.genre.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || story.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

  // 상태별 색상
  const getStatusColor = (status: Story['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
    }
  }

  // 상태별 한글명
  const getStatusLabel = (status: Story['status']) => {
    switch (status) {
      case 'completed': return '완성됨'
      case 'draft': return '임시저장'
      case 'archived': return '보관됨'
    }
  }

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">뒤로가기</span>
              </Button>
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">내 소설 모음</h1>
              </div>
            </div>

            <Button
              onClick={() => router.push('/create-story')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              새 소설 만들기
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="제목, 내용, 태그로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <div className="flex gap-1">
                {(['all', 'completed', 'draft', 'archived'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus(status)}
                  >
                    {status === 'all' ? '전체' : getStatusLabel(status)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">총 소설</p>
                    <p className="text-2xl font-bold">{stories.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">완성된 소설</p>
                    <p className="text-2xl font-bold">
                      {stories.filter(s => s.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">총 글자 수</p>
                    <p className="text-2xl font-bold">
                      {stories.reduce((sum, story) => sum + (story.metadata?.wordCount || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">총 장소</p>
                    <p className="text-2xl font-bold">
                      {stories.reduce((sum, story) => sum + (story.metadata?.locations?.length || 0), 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stories Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              <p className="ml-2 text-gray-600">소설 목록을 불러오는 중...</p>
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || filterStatus !== 'all' ? '검색 결과가 없습니다' : '아직 작성한 소설이 없습니다'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || filterStatus !== 'all' 
                  ? '다른 검색어나 필터를 시도해보세요'
                  : '첫 번째 소설을 만들어보세요'
                }
              </p>
              {(!searchQuery && filterStatus === 'all') && (
                <Button
                  onClick={() => router.push('/create-story')}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  새 소설 만들기
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStories.map((story) => (
                <Card key={story.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{story.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {story.file_path ? `${story.file_type || 'md'} 파일로 저장됨` : '파일 경로 없음'}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(story.status)}>
                        {getStatusLabel(story.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* 장르 */}
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        {story.genre}
                      </Badge>
                      {story.metadata?.aiModel && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          {story.metadata.aiModel}
                        </Badge>
                      )}
                    </div>

                    <Separator />

                    {/* 통계 */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-600">
                          {story.metadata?.locations?.length || 0}개 장소
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-600">
                          {story.metadata?.wordCount?.toLocaleString() || 0}자
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-600">{formatDate(story.created_at)}</span>
                      </div>
                      {story.metadata?.estimatedReadTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600">{story.metadata.estimatedReadTime}분</span>
                        </div>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => router.push(`/stories/${story.id}`)}
                        disabled={story.status !== 'completed'}
                      >
                        읽기
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        disabled={story.status !== 'completed'}
                      >
                        공유
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}