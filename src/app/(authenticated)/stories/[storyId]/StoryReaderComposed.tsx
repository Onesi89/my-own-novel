/**
 * Story Reader Composed Component
 * FSD: app/stories/[storyId]
 * 
 * Component Composition Pattern이 적용된 스토리 리더
 * 기존 429줄에서 약 80줄로 단순화
 */

'use client'

import React from 'react'
import { StoryReaderProvider, useStoryReader } from '@/features/story/context/StoryReaderContext'
import {
  StoryHeader,
  StoryMetadata,
  StoryContent,
  InteractiveChoices,
  LoadingState,
  ErrorState
} from '@/features/story/ui/StoryReader'

interface StoryReaderComposedProps {
  storyId: string
}

// 내부 컴포넌트 (Provider 내부에서 사용)
function StoryReaderContent({ storyId }: { storyId: string }) {
  const { state } = useStoryReader()

  // Loading state
  if (state.isLoading) {
    return <LoadingState />
  }

  // Error state
  if (state.error) {
    return <ErrorState storyId={storyId} />
  }

  // Main content
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <StoryHeader />
      
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-sm p-8">
          {/* Story Metadata */}
          <StoryMetadata />
          
          {/* Story Content */}
          <StoryContent />
          
          {/* Interactive Choices */}
          <InteractiveChoices />
        </article>
      </main>
    </div>
  )
}

// Main composed component
export function StoryReaderComposed({ storyId }: StoryReaderComposedProps) {
  return (
    <StoryReaderProvider storyId={storyId}>
      <StoryReaderContent storyId={storyId} />
    </StoryReaderProvider>
  )
}