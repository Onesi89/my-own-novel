/**
 * Story Reader Client Component
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
import { useStoryStore } from '@/shared/lib/stores/storyStore'
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

export function StoryReader({ storyId }: StoryReaderProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [story, setStory] = useState<Story | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Zustand store
  const {
    originalContent,
    sections,
    currentChoices,
    isLoadingChoice,
    error: storyError,
    setStory: setStoryInStore,
    selectChoice,
    reset
  } = useStoryStore()
  
  useEffect(() => {
    fetchStory()
  }, [storyId])
  
  useEffect(() => {
    // Clean up store when component unmounts
    return () => reset()
  }, [])
  
  const fetchStory = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/stories/${storyId}`)
      if (!response.ok) {
        throw new Error('스토리를 불러올 수 없습니다.')
      }
      
      const data = await response.json()
      if (data.success && data.data) {
        setStory(data.data)
        // Store에 스토리 데이터 설정
        setStoryInStore(
          data.data.id, 
          data.data.content || '', 
          data.data.ai_choices || []
        )
      } else {
        throw new Error(data.error || '스토리 로드 실패')
      }
    } catch (err) {
      console.error('Story fetch error:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
      toast({
        title: '오류',
        description: '스토리를 불러오는데 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleShare = async () => {
    try {
      const shareData = {
        title: story?.title || '나만의 AI 소설',
        text: `${story?.genre} 장르의 특별한 이야기 "${story?.title}"을 읽어보세요! 🚗✨`,
        url: window.location.href
      }
      
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // 클립보드에 더 풍부한 텍스트 복사
        const shareText = `${shareData.text}\n\n${shareData.url}`
        await navigator.clipboard.writeText(shareText)
        toast({
          title: '링크 복사됨',
          description: '소설 링크가 클립보드에 복사되었습니다.'
        })
      }
    } catch (err) {
      // 공유 취소되거나 실패한 경우 처리
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Share failed:', err)
        try {
          await navigator.clipboard.writeText(window.location.href)
          toast({
            title: '링크 복사됨',
            description: '소설 링크가 클립보드에 복사되었습니다.'
          })
        } catch (clipboardErr) {
          toast({
            title: '공유 실패',
            description: '공유 기능을 사용할 수 없습니다.',
            variant: 'destructive'
          })
        }
      }
    }
  }
  
  const handleDownload = () => {
    if (!story?.content && !originalContent) return
    
    // 전체 스토리 내용 구성 (원본 + 이어진 섹션들)
    let fullContent = originalContent || story?.content || ''
    
    if (sections.length > 0) {
      fullContent += '\n\n---\n\n'
      sections.forEach((section, index) => {
        fullContent += `\n## 이어지는 이야기 #${index + 1}\n\n`
        fullContent += section.content
        fullContent += '\n\n---\n\n'
      })
    }
    
    // 메타데이터 추가
    const metadata = `---
title: ${story?.title || '제목 없음'}
genre: ${story?.genre || '미정'}
created: ${story?.created_at ? new Date(story.created_at).toLocaleDateString('ko-KR') : ''}
sections: ${sections.length + 1}
---

`
    
    const finalContent = metadata + fullContent
    
    const blob = new Blob([finalContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${story?.title || 'story'}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: '다운로드 완료',
      description: `전체 이야기 (${sections.length + 1}개 섹션)가 다운로드되었습니다.`
    })
  }
  
  const handleChoiceSelect = async (choiceId: string, optionId: string) => {
    try {
      await selectChoice(choiceId, optionId)
      toast({
        title: '선택 완료',
        description: '새로운 이야기가 이어집니다.'
      })
    } catch (error) {
      toast({
        title: '오류',
        description: '선택지 처리 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-gray-600">소설을 불러오는 중...</p>
        </div>
      </div>
    )
  }
  
  if (error || !story) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">소설을 찾을 수 없습니다</h2>
            <p className="text-gray-500 mb-4">{error || '요청한 소설이 존재하지 않습니다.'}</p>
            <Button onClick={() => router.push('/my-stories')}>
              내 소설 목록으로
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/my-stories')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">내 소설 목록</span>
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-sm p-8">
          {/* Title and metadata */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{story.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(story.created_at)}</span>
              </div>
              
              {story.metadata?.estimatedReadTime && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>약 {story.metadata.estimatedReadTime}분</span>
                </div>
              )}
              
              {story.metadata?.wordCount && (
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span>{story.metadata.wordCount.toLocaleString()}자</span>
                </div>
              )}
              
              {story.metadata?.locations && story.metadata.locations.length > 0 && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{story.metadata.locations.length}개 장소</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 mt-4">
              <Badge variant="outline">{story.genre}</Badge>
              {story.metadata?.aiModel && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {story.metadata.aiModel}
                </Badge>
              )}
            </div>
          </div>
          
          <Separator className="mb-8" />
          
          {/* Story content */}
          <div className="prose prose-lg max-w-none">
            {/* Original content */}
            {originalContent ? (
              <ReactMarkdown>{originalContent}</ReactMarkdown>
            ) : story?.content ? (
              <ReactMarkdown>{story.content}</ReactMarkdown>
            ) : (
              <p className="text-gray-500 italic">소설 내용을 불러올 수 없습니다.</p>
            )}
            
            {/* Additional sections from choices */}
            {sections.map((section, index) => (
              <div key={section.id} className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600">이어지는 이야기 #{index + 1}</span>
                </div>
                <ReactMarkdown>{section.content}</ReactMarkdown>
              </div>
            ))}
          </div>
          
          {/* Story choices */}
          {currentChoices.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                이야기를 선택해보세요
              </h3>
              
              <div className="space-y-6">
                {currentChoices.map((choice) => (
                  <Card key={choice.id} className="border-2 hover:border-blue-200 transition-colors">
                    <CardContent className="p-6">
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">
                          📍 {choice.location}
                        </h4>
                        <p className="text-gray-700">{choice.question}</p>
                      </div>
                      
                      <div className="space-y-3">
                        {choice.options?.map((option) => (
                          <Button
                            key={option.id}
                            variant={choice.selectedChoice === option.id ? "default" : "outline"}
                            className="w-full justify-start text-left h-auto p-4"
                            disabled={isLoadingChoice || !!choice.selectedChoice}
                            onClick={() => handleChoiceSelect(choice.id, option.id)}
                          >
                            <div className="flex items-start gap-3 w-full">
                              {choice.selectedChoice === option.id ? (
                                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300 mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <div className="font-medium">{option.text}</div>
                                <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                      
                      {choice.selectedChoice && choice.selectedAt && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-sm text-gray-500">
                            선택 완료: {new Date(choice.selectedAt).toLocaleString('ko-KR')}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {isLoadingChoice && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                  <span className="text-gray-600">새로운 이야기를 생성하는 중...</span>
                </div>
              )}
              
              {storyError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700">{storyError}</p>
                </div>
              )}
            </div>
          )}
        </article>
      </main>
    </div>
  )
}