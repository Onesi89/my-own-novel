/**
 * 구조화된 프롬프트 생성기
 * FSD: shared/lib/ai/optimization/choices
 */

import { RouteContext, StoryPreferences } from '../types'

interface ChoiceConfig {
  maxChoices: 2 | 3
  enforceLimit: boolean
  qualityThreshold: number
}

export class StructuredPromptGenerator {
  constructor(private config: ChoiceConfig) {}

  generateStructuredPrompt(
    routes: RouteContext[], 
    preferences: StoryPreferences,
    choiceLimit: number
  ): string {
    const maxChoices = choiceLimit || this.config.maxChoices
    
    const prompt = `
당신은 소설 작가입니다. 다음 조건에 맞는 이야기를 생성해주세요:

## 스토리 설정
- 장르: ${preferences.genre || '일반'}
- 스타일: ${preferences.style || '현실적'}
- 분위기: ${preferences.mood || '중립'}
- 테마: ${preferences.theme || '성장'}

## 현재 스토리 맥락
${this.buildContextFromRoutes(routes)}

## 생성 규칙
1. **선택지 개수**: 정확히 ${maxChoices}개의 선택지만 제공하세요
2. **선택지 형식**: 
   - 각 선택지는 50-200자 사이로 작성
   - 구체적인 행동이나 상황을 포함
   - 흥미로운 갈등이나 긴장감 포함
3. **품질 기준**:
   - 스토리 맥락과 일치
   - 각 선택지는 서로 다른 방향성
   - 독자의 호기심 유발

## 응답 형식
다음 형식으로 응답하세요:

**이야기 전개**
[현재 상황에서 다음으로 일어날 수 있는 흥미로운 전개를 150-300자로 작성]

**선택지**
1. [첫 번째 선택지 - 50-200자]
2. [두 번째 선택지 - 50-200자]
${maxChoices === 3 ? '3. [세 번째 선택지 - 50-200자]' : ''}

중요: 반드시 ${maxChoices}개의 선택지만 제공하고, 각 선택지는 명확하고 구체적이어야 합니다.
`.trim()

    return prompt
  }

  private buildContextFromRoutes(routes: RouteContext[]): string {
    if (!routes || routes.length === 0) {
      return '새로운 이야기를 시작합니다.'
    }

    const context = routes.map((route, index) => {
      const storyContent = route.story || '상황 설명 없음'
      const choice = route.choice || '선택 없음'
      
      return `${index + 1}. ${storyContent}\n   선택: ${choice}`
    }).join('\n\n')

    return `지금까지의 이야기:\n${context}`
  }

  // 프롬프트 압축을 위한 간소화된 버전
  generateCompactPrompt(
    routes: RouteContext[], 
    preferences: StoryPreferences,
    choiceLimit: number
  ): string {
    const maxChoices = choiceLimit || this.config.maxChoices
    
    const prompt = `
소설 작가로서 다음 조건에 맞는 이야기를 생성하세요:

설정: ${preferences.genre}/${preferences.style}/${preferences.mood}
맥락: ${this.buildCompactContext(routes)}

규칙:
- 정확히 ${maxChoices}개 선택지 제공
- 각 선택지 50-200자
- 구체적이고 흥미로운 내용

형식:
이야기: [150-300자]
선택지:
1. [첫 번째]
2. [두 번째]
${maxChoices === 3 ? '3. [세 번째]' : ''}
`.trim()

    return prompt
  }

  private buildCompactContext(routes: RouteContext[]): string {
    if (!routes || routes.length === 0) {
      return '새 이야기 시작'
    }

    // 최근 2-3개 라우트만 사용
    const recentRoutes = routes.slice(-3)
    
    return recentRoutes.map(route => {
      const story = (route.story || '').substring(0, 100)
      const choice = (route.choice || '').substring(0, 50)
      return `${story}→${choice}`
    }).join(' / ')
  }
}