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
    choiceLimit: number,
    previousChoices?: Array<{ question: string; choice: string }>
  ): string {
    const maxChoices = choiceLimit || this.config.maxChoices
    const genreMarker = this.getGenreMarker(preferences.genre)
    
    const prompt = `
당신은 전문 소설 작가입니다. 마크다운 형식을 활용하여 몰입감 있는 인터랙티브 스토리를 작성하세요.

## 📋 마크다운 형식 규칙

### 필수 마크업 요소
\`\`\`markdown
### ${genreMarker} [질문 제목]
> **핵심 질문**: [구체적인 상황 질문]

**선택지:**
1. **[선택 제목]** - *[부가 설명]*
2. **[선택 제목]** - *[부가 설명]*
${maxChoices === 3 ? '3. **[선택 제목]** - *[부가 설명]*' : ''}
\`\`\`

### 마크업 사용 지침
- **굵은 글씨(\*\*)**: 중요 키워드, 선택지 제목, 핵심 질문
- *이탤릭체(\*)* : 감정, 분위기, 부가 설명
- > 인용문: 질문이나 중요한 대사
- ### H3: 질문 섹션 제목
- --- : 섹션 구분선

## 🎯 스토리 정보
- **장르**: ${preferences.genre || '일반'}
- **스타일**: ${preferences.style || '현실적'}
- **분위기**: ${preferences.mood || '중립'}

## 📖 현재까지의 이야기
${this.buildContextFromRoutes(routes, previousChoices)}

## ✍️ 작성 요구사항

### 스토리 전개 (150-300자)
[현재 상황을 몰입감 있게 서술하되, 다음을 포함하세요:]
- 주인공의 현재 심리 상태
- 주변 환경의 생생한 묘사  
- 긴장감 있는 상황 설정

### ${genreMarker} 질문 섹션

반드시 다음 형식을 따르세요:

> **핵심 질문**: [주인공이 직면한 구체적인 선택의 순간]

**무엇을 하시겠습니까?**

1. **[행동/선택 1]** - *[이 선택이 가져올 변화나 분위기]*
2. **[행동/선택 2]** - *[이 선택이 가져올 변화나 분위기]*
${maxChoices === 3 ? '3. **[행동/선택 3]** - *[이 선택이 가져올 변화나 분위기]*' : ''}

### 품질 체크리스트
✅ 각 선택지는 50-200자 사이
✅ 선택지별로 명확히 다른 방향성
✅ 구체적이고 행동 가능한 선택지
✅ ${preferences.genre} 장르의 특성 반영
✅ 정확히 ${maxChoices}개의 선택지만 제공

---

**중요**: 마크다운 형식을 정확히 지켜주세요. 특히 **굵은 글씨**와 *이탤릭체*를 적절히 활용하여 가독성을 높이세요.
`.trim()

    return prompt
  }

  private buildContextFromRoutes(
    routes: RouteContext[], 
    previousChoices?: Array<{ question: string; choice: string }>
  ): string {
    if (!routes || routes.length === 0) {
      return '새로운 이야기를 시작합니다.'
    }

    let context = ''
    
    // 이전 선택지 정보가 있으면 우선 사용
    if (previousChoices && previousChoices.length > 0) {
      context = previousChoices.map((choice, index) => {
        const routeInfo = routes[index] 
        const location = routeInfo?.customInfo?.customName || routeInfo?.address || `장소 ${index + 1}`
        
        return `${index + 1}. **${location}**에서의 상황: ${choice.question}
   → 선택한 행동: ${choice.choice}`
      }).join('\n\n')
    } else {
      // 폴백: 기본 루트 정보 사용
      context = routes.map((route, index) => {
        const storyContent = route.story || route.customInfo?.description || '상황 설명 없음'
        const choice = route.choice || '선택 없음'
        
        return `${index + 1}. ${storyContent}\n   선택: ${choice}`
      }).join('\n\n')
    }

    return `지금까지의 이야기:\n${context}\n\n**중요**: 위의 이전 선택들을 바탕으로 연결성 있는 스토리를 만들어주세요.`
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

  private getGenreMarker(genre?: string): string {
    const markers = {
      'SF': '🚀',
      'romance': '💕',
      'comedy': '😄', 
      'mystery': '🔍',
      'drama': '🎭',
      'adventure': '⚔️',
      'horror': '👻',
      'fantasy': '🔮',
      '판타지': '🔮',
      '로맨스': '💕',
      '코미디': '😄',
      '미스터리': '🔍',
      '드라마': '🎭',
      '모험': '⚔️',
      '공포': '👻',
      '일반': '📖'
    }
    
    return markers[genre || '일반'] || '📖'
  }

  private buildPreviousChoice(routes: RouteContext[], genreMarker: string): string {
    if (!routes || routes.length === 0) {
      return ''
    }

    const lastRoute = routes[routes.length - 1]
    if (!lastRoute.choice) {
      return ''
    }

    return `> ${genreMarker} **이전 선택: ${lastRoute.choice}**`
  }
}