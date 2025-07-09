/**
 * StoryChoiceClient - 선택지 상호작용을 위한 클라이언트 컴포넌트
 * 최소한의 영역만 client component로 구현
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StoryQuestion } from '@/shared/lib/story/types'
import { StoryChoiceScreen } from './StoryChoiceScreen'
import { useStoryActions } from '@/shared/lib/store/storyProgressStore'

interface StoryChoiceClientProps {
  storyId: string
  step: number
  question: StoryQuestion
  settings: any
  routes: any[]
  locationName: string
}

export function StoryChoiceClient({
  storyId,
  step,
  question,
  settings,
  routes,
  locationName
}: StoryChoiceClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { addChoice } = useStoryActions()

  const handleChoiceSelect = async (choiceId: string) => {
    if (!question) return

    setIsLoading(true)

    // 선택된 선택지 찾기
    const selectedChoice = question.choices.find(choice => choice.id === choiceId)
    if (selectedChoice) {
      // 이전 선택들에 Zustand store에 추가
      addChoice({
        question: question.question,
        choice: selectedChoice.text
      })
    }

    // 다음 단계로 이동 또는 완료
    if (step < routes.length) {
      const nextStep = step + 1
      // 다음 단계로 라우팅 (뒤로가기 방지를 위해 replace 사용)
      router.replace(`/create-story/${storyId}/${nextStep}`)
    } else {
      // 모든 단계 완료 - 완료 페이지로 이동
      router.replace('/create-story/finish')
    }
  }

  return (
    <StoryChoiceScreen
      question={question}
      onChoiceSelect={handleChoiceSelect}
      isLoading={isLoading}
      settings={settings}
      currentLocationIndex={step - 1}
      totalLocations={routes.length}
      locationName={locationName}
    />
  )
}