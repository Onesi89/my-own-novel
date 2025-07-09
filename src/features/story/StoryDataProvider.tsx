/**
 * StoryDataProvider - Zustand 스토어에서 데이터를 가져와 서버 컴포넌트에 전달
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  useStorySettings, 
  useSelectedRoutes, 
  usePreviousChoices 
} from '@/shared/lib/store/storyProgressStore'
import { InteractiveStoryServer } from './InteractiveStoryServer'

interface StoryDataProviderProps {
  storyId: string
  step: number
}

export function StoryDataProvider({ storyId, step }: StoryDataProviderProps) {
  const router = useRouter()
  const settings = useStorySettings()
  const routes = useSelectedRoutes()
  const previousChoices = usePreviousChoices()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!settings || !routes || routes.length === 0) {
      // 설정이나 경로가 없으면 다시 선택하러 가기
      router.replace('/create-story')
    } else {
      setIsReady(true)
    }
  }, [settings, routes, router])

  // 데이터가 준비되지 않은 경우 로딩 화면
  if (!isReady || !settings || !routes || routes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">스토리 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <InteractiveStoryServer
      storyId={storyId}
      step={step}
      settings={settings}
      routes={routes}
      previousChoices={previousChoices}
    />
  )
}