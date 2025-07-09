/**
 * StoryFinishDataProvider - Zustand 스토어에서 데이터를 가져와 서버 컴포넌트에 전달
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  useStorySettings, 
  useSelectedRoutes, 
  usePreviousChoices,
  useStoryActions,
  useStoryId
} from '@/shared/lib/store/storyProgressStore'
import { StoryFinishServer } from './StoryFinishServer'

export function StoryFinishDataProvider() {
  const router = useRouter()
  const settings = useStorySettings()
  const routes = useSelectedRoutes()
  const previousChoices = usePreviousChoices()
  const storyId = useStoryId()
  const { setCompleted, resetAll } = useStoryActions()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!settings || !routes || routes.length === 0 || !storyId) {
      // 필수 데이터가 없으면 처음으로 이동
      router.replace('/create-story')
    } else {
      // 완료 상태로 설정
      setCompleted(true)
      setIsReady(true)
    }
  }, [settings, routes, storyId, router, setCompleted])

  // 데이터가 준비되지 않은 경우 로딩 화면
  if (!isReady || !settings || !routes || routes.length === 0 || !storyId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">완료 페이지 준비 중...</p>
        </div>
      </div>
    )
  }

  return (
    <StoryFinishServer
      storyId={storyId}
      settings={settings}
      routes={routes}
      previousChoices={previousChoices}
    />
  )
}