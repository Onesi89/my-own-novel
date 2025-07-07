/**
 * Story Metadata Component
 * FSD: features/story/ui/StoryReader
 * 
 * 스토리의 메타데이터 (제목, 날짜, 장르, 통계 등)
 */

'use client'

import React from 'react'
import { Calendar, Clock, BookOpen, MapPin } from 'lucide-react'
import { Badge, Separator } from '@/shared/ui'
import { useStoryReader } from '../../context/StoryReaderContext'

// Date formatting helper
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return '날짜 정보 없음'
  }
}

export function StoryMetadata() {
  const { state } = useStoryReader()
  const { story } = state

  return (
    <div className="mb-8">
      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{story.title}</h1>
      
      {/* Metadata */}
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
      
      {/* Badges */}
      <div className="flex gap-2 mt-4">
        <Badge variant="outline">{story.genre}</Badge>
        {story.metadata?.aiModel && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {story.metadata.aiModel}
          </Badge>
        )}
        {state.sections.length > 0 && (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            {state.sections.length + 1}개 섹션
          </Badge>
        )}
      </div>
      
      <Separator className="mt-8" />
    </div>
  )
}