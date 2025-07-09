/**
 * Interactive Story Page - 동적 라우터 [storyid]/[step]
 * 인터랙티브 스토리 단계별 페이지 (서버 컴포넌트)
 */

import { Suspense } from 'react'
import { StoryDataProvider } from '@/features/story/StoryDataProvider'

interface InteractiveStoryPageProps {
  params: Promise<{
    storyid: string
    step: string
  }>
}

export default async function InteractiveStoryPage({ params }: InteractiveStoryPageProps) {
  const { storyid, step } = await params
  const stepNumber = parseInt(step, 10)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">인터랙티브 스토리 로딩 중...</p>
          </div>
        </div>
      }>
        <StoryDataProvider storyId={storyid} step={stepNumber} />
      </Suspense>
    </div>
  )
}

// 정적 파라미터 생성 (필요한 경우)
export function generateStaticParams() {
  // 예시: 최대 10개 스토리, 각각 10단계까지
  const params = []
  for (let storyId = 1; storyId <= 10; storyId++) {
    for (let step = 1; step <= 10; step++) {
      params.push({
        storyid: `story-${storyId}`,
        step: step.toString()
      })
    }
  }
  return params
}