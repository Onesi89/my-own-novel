/**
 * StoryRedirectClient - 소설 생성 성공 시 리다이렉트 처리
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStoryActions } from '@/shared/lib/store/storyProgressStore'

interface StoryRedirectClientProps {
  storyId: string
}

export function StoryRedirectClient({ storyId }: StoryRedirectClientProps) {
  const router = useRouter()
  const { resetAll } = useStoryActions()

  useEffect(() => {
    // 상태 초기화
    resetAll()
    
    // 소설 페이지로 이동
    router.replace(`/stories/${storyId}`)
  }, [storyId, router, resetAll])

  return null
}