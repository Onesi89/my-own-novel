/**
 * Story Content Component
 * FSD: features/story/ui/StoryReader
 * 
 * 스토리의 메인 콘텐츠 및 추가 섹션들
 */

'use client'

import React from 'react'
import { MessageCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useStoryReader } from '../../context/StoryReaderContext'

export function StoryContent() {
  const { state } = useStoryReader()
  const { story, originalContent, sections } = state

  return (
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
            <span className="text-sm font-medium text-blue-600">
              이어지는 이야기 #{index + 1}
            </span>
          </div>
          <ReactMarkdown>{section.content}</ReactMarkdown>
        </div>
      ))}
    </div>
  )
}