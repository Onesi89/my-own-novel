/**
 * AI Service for Interactive Story Generation
 * FSD: shared/lib/ai
 */

export class AIService {
  async generateInteractiveQuestion(
    route: any,
    settings: { genre: string; style: string },
    locationIndex: number,
    previousChoices?: Array<{ question: string; choice: string }>
  ) {
    try {
      const response = await fetch('/api/ai/interactive-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route,
          settings,
          locationIndex,
          previousChoices
        })
      })

      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`)
      }

      const question = await response.json()
      return question
    } catch (error) {
      console.error('AI Service error:', error)
      // 에러 발생 시 기본 질문 반환
      return this.getFallbackQuestion(route, locationIndex)
    }
  }

  private getFallbackQuestion(route: any, locationIndex: number) {
    const locationName = route.customInfo?.customName || route.address || `장소 ${locationIndex + 1}`
    
    return {
      id: `question_${locationIndex}`,
      locationId: `location_${locationIndex}`,
      question: `${locationName}에서 어떤 행동을 취하시겠습니까?`,
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
      context: `${locationName}에서의 선택이 이야기의 흐름을 결정합니다.`
    }
  }
}

// 싱글톤 인스턴스
let aiServiceInstance: AIService | null = null

export const getAIService = () => {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService()
  }
  return aiServiceInstance
}