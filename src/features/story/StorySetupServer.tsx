/**
 * Story Setup Server Component
 * 서버 컴포넌트로 최적화된 소설 설정 페이지
 */

import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { StoryGenre, StoryStyle } from '@/shared/lib/story/types'
import { StorySetupClient } from './StorySetupClient'

const GENRES: Array<{ key: StoryGenre; label: string; description: string }> = [
  { key: 'SF', label: 'SF', description: '미래와 과학기술이 어우러진 이야기' },
  { key: 'romance', label: '로맨스', description: '설렘과 사랑이 가득한 이야기' },
  { key: 'comedy', label: '코미디', description: '유쾌하고 재미있는 이야기' },
  { key: 'mystery', label: '미스터리', description: '추리와 긴장감이 넘치는 이야기' },
  { key: 'drama', label: '드라마', description: '감동적이고 깊이 있는 이야기' },
  { key: 'adventure', label: '모험', description: '스릴 넘치는 모험과 여행 이야기' },
  { key: 'horror', label: '공포', description: '오싹하고 무서운 이야기' },
  { key: 'fantasy', label: '판타지', description: '마법과 환상의 세계 이야기' }
]

const STYLES: Array<{ key: StoryStyle; label: string; description: string }> = [
  { key: 'first_person', label: '1인칭', description: '주인공의 시점에서 들려주는 이야기' },
  { key: 'third_person', label: '3인칭', description: '관찰자의 시점에서 들려주는 이야기' }
]

export function StorySetupServer() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* 정적 배경 */}
      <div className="absolute inset-0 opacity-5 bg-gradient-to-r from-blue-100 to-purple-100" />

      {/* 뒤로가기 버튼 */}
      <div className="absolute top-8 left-8 flex items-center space-x-2 text-gray-600">
        <ArrowLeft size={20} />
        <span>뒤로가기</span>
      </div>

      {/* 메인 컨텐츠 - 클라이언트 컴포넌트로 위임 */}
      <div className="max-w-4xl w-full">
        <StorySetupClient genres={GENRES} styles={STYLES} />
      </div>
    </div>
  )
}