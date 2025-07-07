/**
 * Story Reader Original Component
 * git hash 4dca1a13 버전과 정확히 동일한 UI
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  BookOpen, 
  Calendar,
  Clock,
  MapPin,
  Share2,
  Download,
  Loader2,
  MessageCircle,
  Check
} from 'lucide-react'
import { 
  Button, 
  Card, 
  CardContent,
  Badge,
  Separator
} from '@/shared/ui'
import { useToast } from '@/shared/lib'
import ReactMarkdown from 'react-markdown'

interface StoryReaderProps {
  storyId: string
}

interface Story {
  id: string
  title: string
  content?: string
  genre: string
  status: string
  created_at: string
  file_path?: string
  ai_choices?: any[]
  metadata?: {
    wordCount?: number
    estimatedReadTime?: number
    locations?: any[]
    aiModel?: string
  }
}

interface InteractiveChoice {
  id: string
  step: number
  question: string
  selectedOption: string
  otherOptions: string[]
  timestamp: string
}

export function StoryReaderOriginal({ storyId }: StoryReaderProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [story, setStory] = useState<Story | null>(null)
  const [storyContent, setStoryContent] = useState<string>('')
  const [interactiveChoices, setInteractiveChoices] = useState<InteractiveChoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingContent, setIsLoadingContent] = useState(false)

  useEffect(() => {
    const fetchStory = async () => {
      try {
        setIsLoading(true)
        // API를 통해 스토리 메타데이터 가져오기
        const response = await fetch(`/api/stories/${storyId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch story')
        }
        
        const { story: storyData, content, choices } = await response.json()
        setStory(storyData)
        setStoryContent(content || '')
        setInteractiveChoices(choices || [])
      } catch (error) {
        console.error('Error fetching story:', error)
        toast({
          title: '오류',
          description: '소설을 불러오는데 실패했습니다.',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStory()
  }, [storyId, toast])

  const handleBack = () => {
    router.push('/my-stories')
  }

  const handleDownload = () => {
    if (!storyContent || !story) return

    const element = document.createElement('a')
    const file = new Blob([storyContent], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `${story.title || 'story'}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleShare = async () => {
    if (navigator.share && story) {
      try {
        await navigator.share({
          title: story.title,
          text: '이 소설을 확인해보세요!',
          url: window.location.href
        })
      } catch (error) {
        console.log('공유 취소됨')
      }
    } else {
      // 복사 기능으로 대체
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: '성공',
        description: '링크가 클립보드에 복사되었습니다.',
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatReadTime = (wordCount?: number) => {
    if (!wordCount) return '예상 읽기 시간 미상'
    const minutes = Math.ceil(wordCount / 200) // 분당 200자 기준
    return `약 ${minutes}분`
  }

  if (isLoading || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">소설을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2 hover:bg-blue-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">내 소설 목록</span>
              </Button>
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900 truncate max-w-md">
                  {story.title}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!storyContent}
                className="hidden sm:flex"
              >
                <Download className="w-4 h-4 mr-2" />
                다운로드
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="hidden sm:flex"
              >
                <Share2 className="w-4 h-4 mr-2" />
                공유
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Story Info */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(story.created_at)}</span>
                  </div>
                  {story.metadata?.estimatedReadTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatReadTime(story.metadata.wordCount)}</span>
                    </div>
                  )}
                  {story.metadata?.locations && story.metadata.locations.length > 0 && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{story.metadata.locations.length}개 장소</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    {story.genre}
                  </Badge>
                  <Badge variant={story.status === 'completed' ? 'default' : 'outline'}>
                    {story.status === 'completed' ? '완성' : story.status === 'generating' ? '생성 중' : '대기 중'}
                  </Badge>
                  {story.metadata?.aiModel && (
                    <Badge variant="outline" className="text-gray-600">
                      {story.metadata.aiModel}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Choices Summary */}
          {interactiveChoices.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  인터랙티브 선택 기록
                </h3>
                <div className="space-y-3">
                  {interactiveChoices.map((choice) => (
                    <div key={choice.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">{choice.step}</span>
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="text-sm font-medium text-gray-900">{choice.question}</p>
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-700 font-medium">{choice.selectedOption}</span>
                          </div>
                          {choice.otherOptions.length > 0 && (
                            <div className="text-xs text-gray-500">
                              다른 선택지: {choice.otherOptions.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Story Content */}
          <Card>
            <CardContent className="p-6">
              {isLoadingContent ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">소설 내용을 불러오는 중...</p>
                </div>
              ) : storyContent ? (
                <div className="prose prose-lg max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">{children}</h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-blue-300 pl-4 py-2 my-4 bg-blue-50 rounded-r-lg">
                          <div className="text-blue-800">{children}</div>
                        </blockquote>
                      ),
                      hr: () => (
                        <Separator className="my-8" />
                      )
                    }}
                  >
                    {storyContent}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">소설 내용을 불러올 수 없습니다.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Mobile Action Buttons */}
      <div className="sm:hidden fixed bottom-4 left-4 right-4 flex gap-2">
        <Button
          variant="outline"
          onClick={handleDownload}
          disabled={!storyContent}
          className="flex-1"
        >
          <Download className="w-4 h-4 mr-2" />
          다운로드
        </Button>
        <Button variant="outline" onClick={handleShare} className="flex-1">
          <Share2 className="w-4 h-4 mr-2" />
          공유
        </Button>
      </div>
    </div>
  )
}