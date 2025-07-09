/**
 * StoryFinishServer - 서버 컴포넌트에서 소설 생성 API 호출
 */

import { Card, CardContent } from '@/shared/ui'
import { CheckCircle, Sparkles } from 'lucide-react'
import { StoryFinishDataProvider } from './StoryFinishDataProvider'
import { BackButton } from './BackButton'
import { StoryRedirectClient } from './StoryRedirectClient'
import { InteractiveStorySession } from '@/shared/lib/story/types'

interface StoryFinishServerProps {
  storyId: string
  settings: any
  routes: any[]
  previousChoices: Array<{ question: string; choice: string }>
}

// 서버에서 소설 생성 API 호출
async function generateStoryOnServer(storyId: string, sessionData: InteractiveStorySession) {
  try {
    // 서버 내부에서 API 호출
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/stories/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storyId: storyId,
        selectedRoutes: sessionData.routes,
        preferences: sessionData.settings,
        previousChoices: sessionData.responses,
        timelineId: sessionData.id
      })
    })

    if (response.ok) {
      const result = await response.json()
      return { success: true, storyId: result.storyId }
    } else {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || '소설 생성 실패')
    }
  } catch (error) {
    console.error('서버 소설 생성 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '소설 생성 중 오류가 발생했습니다.' 
    }
  }
}

export async function StoryFinishServer({
  storyId,
  settings,
  routes,
  previousChoices
}: StoryFinishServerProps) {
  // 세션 데이터 생성
  const sessionData: InteractiveStorySession = {
    id: storyId, // 실제 데이터베이스 스토리 ID 사용
    routes: routes,
    settings: settings,
    responses: previousChoices,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString()
  }

  // 서버에서 소설 생성 시도
  const result = await generateStoryOnServer(storyId, sessionData)

  if (result.success && result.storyId) {
    // 성공 시 소설 페이지로 리다이렉트
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <StoryRedirectClient storyId={result.storyId} />
        <Card className="max-w-2xl w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              소설이 성공적으로 생성되었습니다!
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              소설 페이지로 이동합니다...
            </p>
            
            <div className="flex items-center justify-center text-green-600 mb-6">
              <Sparkles className="w-5 h-5 mr-2" />
              <span className="text-sm">페이지 이동 중...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 실패 시 에러 표시 및 재시도 옵션
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <BackButton />
      
      <Card className="max-w-2xl w-full mx-4">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="mb-6">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              인터랙티브 스토리 완료!
            </h1>
            
            <p className="text-lg text-gray-600 mb-8">
              모든 질문에 답하셨습니다. 소설 생성에 문제가 발생했습니다.
            </p>

            {/* 스토리 요약 */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">스토리 요약</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">장르:</span>
                  <span className="font-medium ml-2">{settings.genre}</span>
                </div>
                <div>
                  <span className="text-gray-600">시점:</span>
                  <span className="font-medium ml-2">{settings.style}</span>
                </div>
                <div>
                  <span className="text-gray-600">경로 수:</span>
                  <span className="font-medium ml-2">{routes.length}개</span>
                </div>
                <div>
                  <span className="text-gray-600">선택 수:</span>
                  <span className="font-medium ml-2">{previousChoices.length}개</span>
                </div>
              </div>
            </div>

            {/* 에러 메시지 */}
            {result.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700 text-sm">{result.error}</p>
              </div>
            )}

            {/* 재시도 옵션 */}
            <div className="space-y-4">
              <form action="/create-story/finish" method="get">
                <input type="hidden" name="retry" value="true" />
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <div className="flex items-center justify-center">
                    <Sparkles className="w-5 h-5 mr-2" />
                    다시 시도하기
                  </div>
                </button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}