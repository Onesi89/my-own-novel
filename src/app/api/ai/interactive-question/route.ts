/**
 * Interactive Question Generation API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { GeminiProvider } from '@/shared/lib/ai/geminiProvider'

export async function POST(request: NextRequest) {
  try {
    console.log('API 라우트 호출됨')
    
    const requestData = await request.json()
    console.log('요청 데이터:', {
      hasRoute: !!requestData.route,
      settings: requestData.settings,
      locationIndex: requestData.locationIndex,
      previousChoicesCount: requestData.previousChoices?.length || 0
    })

    const { route, settings, locationIndex, previousChoices } = requestData

    const geminiApiKey = process.env.GEMINI_API_KEY
    console.log('Gemini API 키 존재 여부:', !!geminiApiKey)
    
    if (!geminiApiKey) {
      console.error('Gemini API 키가 설정되지 않음')
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    console.log('GeminiProvider 생성 중...')
    const geminiProvider = new GeminiProvider(geminiApiKey)
    
    console.log('AI 질문 생성 시작...')
    console.log('장소 정보:', {
      customName: route.customInfo?.customName,
      address: route.address,
      description: route.customInfo?.description,
      storyHint: route.customInfo?.storyHint,
      genre: settings.genre
    })
    
    try {
      const question = await geminiProvider.generateInteractiveQuestion(
        route,
        settings,
        locationIndex,
        previousChoices
      )

      console.log('AI 질문 생성 완료:', {
        questionId: question.id,
        questionText: question.question,
        choicesCount: question.choices?.length,
        firstChoice: question.choices?.[0]?.text
      })

      return NextResponse.json(question)
    } catch (aiError) {
      console.error('AI 질문 생성 실패:', aiError)
      
      // AI 실패 시 폴백 질문 생성
      const fallbackQuestion = {
        id: `question_${locationIndex}`,
        locationId: `location_${locationIndex}`,
        question: `${route.customInfo?.customName || route.address || '이곳'}에서 어떤 행동을 취하시겠습니까?`,
        choices: [
          {
            id: `choice_${locationIndex}_0`,
            text: '주변을 자세히 둘러보기',
            description: '이곳의 특별한 점을 찾아보기'
          },
          {
            id: `choice_${locationIndex}_1`,
            text: '다른 사람들과 대화하기',
            description: '새로운 정보나 이야기 듣기'
          },
          {
            id: `choice_${locationIndex}_2`,
            text: '조용히 혼자 시간 보내기',
            description: '이곳에서 개인적인 시간 갖기'
          }
        ],
        context: `${route.customInfo?.customName || route.address}에서의 선택이 이야기의 흐름을 결정합니다.`
      }
      
      console.log('폴백 질문 반환:', fallbackQuestion.question)
      return NextResponse.json(fallbackQuestion)
    }
  } catch (error) {
    console.error('Interactive question generation error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'Unknown error')
    
    return NextResponse.json(
      { 
        error: 'Failed to generate question',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}