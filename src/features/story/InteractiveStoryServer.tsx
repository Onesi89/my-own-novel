/**
 * InteractiveStoryServer - 서버 컴포넌트로 질문지와 선택지를 생성
 * 최소한의 영역만 client component로 구현
 */

import { StoryQuestion } from '@/shared/lib/story/types'
import { Card, CardContent } from '@/shared/ui'
import { CheckCircle, Sparkles } from 'lucide-react'
import { getAIService } from '@/shared/lib/ai/aiService'
import { StoryChoiceClient } from './StoryChoiceClient'
import { BackButton } from './BackButton'
import { FinishRedirect } from './FinishRedirect'

interface InteractiveStoryServerProps {
  storyId: string
  step: number
  settings: any
  routes: any[]
  previousChoices: Array<{ question: string; choice: string }>
}

// 임시 목업 질문 생성 함수
const generateMockQuestion = (
  step: number,
  locationName: string,
  settings: any
): StoryQuestion => {
  const genreEmojis = {
    'SF': '🚀',
    'romance': '💕',
    'comedy': '😄',
    'mystery': '🔍',
    'drama': '🎭',
    'adventure': '⚔️',
    'horror': '👻',
    'fantasy': '🔮'
  }

  const emoji = genreEmojis[settings.genre] || '📖'

  return {
    id: `question_${step}`,
    locationId: `location_${step}`,
    question: `${locationName}에서 어떤 행동을 취하시겠습니까?`,
    choices: [
      {
        id: `choice_${step}_1`,
        text: '주변을 자세히 둘러보기',
        description: '이곳의 특별한 점을 찾아보기'
      },
      {
        id: `choice_${step}_2`,
        text: '다른 사람들과 대화하기',
        description: '새로운 정보나 이야기 듣기'
      },
      {
        id: `choice_${step}_3`,
        text: '조용히 혼자 시간 보내기',
        description: '이곳에서 개인적인 시간 갖기'
      }
    ],
    context: `${emoji} ${settings.genre} 장르의 이야기가 ${locationName}에서 펼쳐집니다.`
  }
}

async function generateQuestion(
  route: any,
  settings: any,
  step: number,
  previousChoices: Array<{ question: string; choice: string }>
): Promise<StoryQuestion> {
  const aiService = getAIService()
  
  try {
    const question = await aiService.generateInteractiveQuestion(
      route,
      settings,
      step - 1,
      previousChoices
    )
    
    console.log('✅ AI 질문 생성 성공:', {
      questionId: question.id,
      choicesCount: question.choices.length,
      question: question.question.substring(0, 100) + '...'
    })
    
    return question
  } catch (error) {
    console.error('❌ 질문 생성 실패:', error)
    
    // 실패 시 목업 데이터 사용
    const locationName = route?.customInfo?.customName || route?.address || `단계 ${step}`
    const question = generateMockQuestion(step, locationName, settings)
    
    console.log('🔄 목업 질문 사용:', {
      questionId: question.id,
      choicesCount: question.choices.length
    })
    
    return question
  }
}

export async function InteractiveStoryServer({
  storyId,
  step,
  settings,
  routes,
  previousChoices
}: InteractiveStoryServerProps) {
  // 완료된 경우 finish 페이지로 리다이렉트
  if (step > routes.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FinishRedirect />
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              인터랙티브 스토리 완료!
            </h2>
            
            <p className="text-gray-600 mb-6">
              모든 질문이 완료되었습니다. 완료 페이지로 이동합니다.
            </p>
            
            <div className="flex items-center justify-center text-blue-600 mb-6">
              <Sparkles className="w-5 h-5 mr-2" />
              <span className="text-sm">페이지 이동 중...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 현재 단계의 경로 가져오기
  const route = routes[step - 1]
  if (!route) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <p className="text-lg text-gray-600">경로를 찾을 수 없습니다.</p>
            <BackButton />
          </CardContent>
        </Card>
      </div>
    )
  }

  // 서버에서 질문 생성
  const question = await generateQuestion(route, settings, step, previousChoices)
  const locationName = route?.customInfo?.customName || route?.address || `단계 ${step}`

  return (
    <div className="min-h-screen p-4 relative">
      {/* 뒤로가기 버튼 */}
      <BackButton />

      {/* 진행 상황 표시 */}
      <div className="absolute top-8 right-8 text-sm text-gray-600 z-10">
        {step} / {routes.length}
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-4xl w-full">
          <StoryChoiceClient
            storyId={storyId}
            step={step}
            question={question}
            settings={settings}
            routes={routes}
            locationName={locationName}
          />
        </div>
      </div>
    </div>
  )
}