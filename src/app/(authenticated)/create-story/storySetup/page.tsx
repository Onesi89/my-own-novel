/**
 * Story Setup Page - 서버 컴포넌트 (최적화됨)
 * 소설 장르 및 스타일 선택 페이지
 */

import { StorySetupServer } from '@/features/story/StorySetupServer'

export default function StorySetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <StorySetupServer />
    </div>
  )
}