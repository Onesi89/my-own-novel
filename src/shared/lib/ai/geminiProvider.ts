/**
 * Google Gemini 1.5 Pro AI Provider
 * FSD: shared/lib/ai
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { 
  AIProvider, 
  AIResponse, 
  StoryGenerationContext, 
  StoryChoice, 
  RouteContext,
  SectionGenerationContext,
  StorySectionGenerationContext
} from './types'

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI
  private model: string

// 'gemini-1.5-flash-latest'
// 'gemini-2.5-flash'

  constructor(apiKey?: string, model = 'gemini-1.5-flash-latest') {
    if (!apiKey) {
      throw new Error('Gemini API key is required')
    }
    
    this.client = new GoogleGenerativeAI(apiKey)
    this.model = model
  }

  async generateStory(context: StoryGenerationContext, previousChoices?: Array<{ question: string; choice: string }>): Promise<AIResponse> {
    try {
      const prompt = this.buildStoryPrompt(context, previousChoices)
      const model = this.client.getGenerativeModel({ model: this.model })
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      })

      const response = result.response
      const content = response.text()

      if (!content || content.length < 1000) {
        throw new Error(`Generated content too short: ${content?.length || 0} characters`)
      }

      // 응답 파싱 및 구조화
      const parsed = this.parseStoryResponse(content)
      
      console.log('Gemini generateStory - Raw content length:', content.length)
      console.log('Gemini generateStory - Parsed content length:', parsed.content.length)
      console.log('Gemini generateStory - Parsed content preview:', parsed.content.substring(0, 200))
      
      return {
        success: true,
        data: {
          content: parsed.content,
          choices: parsed.choices,
          metadata: {
            model: this.model,
            provider: 'gemini'
          }
        },
        tokenUsage: {
          prompt: result.response.usageMetadata?.promptTokenCount || 0,
          completion: result.response.usageMetadata?.candidatesTokenCount || 0,
          total: result.response.usageMetadata?.totalTokenCount || 0
        }
      }
    } catch (error) {
      console.error('Gemini story generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async generateChoices(location: RouteContext): Promise<StoryChoice> {
    try {
      const prompt = this.buildChoicesPrompt(location)
      const model = this.client.getGenerativeModel({ model: this.model })
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
        }
      })

      const response = result.response
      const content = response.text()

      return this.parseChoicesResponse(content, location)
    } catch (error) {
      console.error('Gemini choices generation error:', error)
      throw error
    }
  }

  async generateInteractiveQuestion(
    route: any, 
    settings: { genre: string; style: string }, 
    locationIndex: number,
    previousChoices?: Array<{ question: string; choice: string }>
  ): Promise<{ id: string; locationId: string; question: string; choices: Array<{ id: string; text: string; description: string }>; context?: string }> {
    try {
      console.log('GeminiProvider: 프롬프트 생성 중...')
      const prompt = this.buildInteractiveQuestionPrompt(route, settings, locationIndex, previousChoices)
      console.log('GeminiProvider: 생성된 프롬프트 길이:', prompt.length)
      console.log('GeminiProvider: 프롬프트 내용:', prompt)
      
      console.log('GeminiProvider: Gemini 모델 초기화...')
      const model = this.client.getGenerativeModel({ 
        model: this.model,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ]
      })
      
      console.log('GeminiProvider: Gemini API 호출 시작...')
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 800,
        }
      })

      console.log('GeminiProvider: API 응답 수신됨')
      const response = result.response
      const content = response.text()
      console.log('GeminiProvider: 응답 내용 길이:', content.length)
      
      if (!content || content.length === 0) {
        console.error('GeminiProvider: 빈 응답 수신됨')
        console.log('GeminiProvider: 후보 응답들:', result.response.candidates)
        console.log('GeminiProvider: 프롬프트 피드백:', result.response.promptFeedback)
        throw new Error('Gemini API returned empty response')
      }
      
      console.log('GeminiProvider: 응답 내용 일부:', content.substring(0, 200))

      const parsedResult = this.parseInteractiveQuestionResponse(content, route, locationIndex)
      console.log('GeminiProvider: 파싱 완료, 선택지 수:', parsedResult.choices.length)

      return parsedResult
    } catch (error) {
      console.error('Gemini interactive question generation error:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
      throw error
    }
  }

  async generateSection(context: SectionGenerationContext): Promise<AIResponse> {
    try {
      const prompt = this.buildSectionPrompt(context)
      const model = this.client.getGenerativeModel({ model: this.model })
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1500,
        }
      })

      const response = result.response
      const content = response.text()

      return {
        success: true,
        data: {
          content: content.trim(),
          metadata: {
            model: this.model,
            provider: 'gemini',
            location: context.route.address
          }
        },
        tokenUsage: {
          prompt: result.response.usageMetadata?.promptTokenCount || 0,
          completion: result.response.usageMetadata?.candidatesTokenCount || 0,
          total: result.response.usageMetadata?.totalTokenCount || 0
        }
      }
    } catch (error) {
      console.error('Gemini section generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async generateStorySection(context: StorySectionGenerationContext): Promise<AIResponse> {
    try {
      const prompt = this.buildStorySectionPrompt(context)
      const model = this.client.getGenerativeModel({ model: this.model })
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1500,
        }
      })

      const response = result.response
      const content = response.text()

      return {
        success: true,
        data: {
          content: content.trim(),
          metadata: {
            model: this.model,
            provider: 'gemini',
            storyId: context.storyId,
            choice: context.selectedChoice
          }
        },
        tokenUsage: {
          prompt: result.response.usageMetadata?.promptTokenCount || 0,
          completion: result.response.usageMetadata?.candidatesTokenCount || 0,
          total: result.response.usageMetadata?.totalTokenCount || 0
        }
      }
    } catch (error) {
      console.error('Gemini story section generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  private buildStoryPrompt(context: StoryGenerationContext, previousChoices?: Array<{ question: string; choice: string }>): string {
    const { routes, preferences } = context
    const genreEmoji = this.getGenreEmoji(preferences.genre)
    
    const routeInfo = routes.map((route, index) => {
      const time = new Date(route.timestamp).toLocaleString('ko-KR')
      const name = route.customInfo?.customName || route.address
      const description = route.customInfo?.description || ''
      const duration = route.duration ? `${route.duration}분 체류` : ''
      
      return `${index + 1}. **${name}**
   - 시간: ${time}
   - ${duration}
   - ${description || '특별한 설명 없음'}`
    }).join('\n')

    return `당신은 창의적인 소설 작가입니다. 
다음 마크다운 형식을 **정확히** 따라 ${preferences.genre} 장르의 인터랙티브 소설을 작성해주세요.

## 📝 필수 마크다운 규칙
1. 제목은 # (H1) 사용
2. 장소는 ## 📍 (H2) 사용  
3. 질문 섹션은 ### ${genreEmoji} (H3) 사용
4. 선택지 번호는 **굵은 글씨**로 강조
5. 구분선은 --- 사용

## 🎭 스토리 설정
- **장르**: ${preferences.genre}
- **시점**: ${preferences.style === 'first_person' ? '1인칭' : '3인칭'}
- **분위기**: ${preferences.tone}
- **목표 분량**: 각 장소당 200-300자

## 🗺️ 방문 장소
${routeInfo}

${previousChoices && previousChoices.length > 0 ? `
## 🎯 이전 선택지 히스토리
${previousChoices.map((choice, index) => {
  const routeInfo = routes[index]
  const location = routeInfo?.customInfo?.customName || routeInfo?.address || `장소 ${index + 1}`
  return `${index + 1}. **${location}**에서의 상황: ${choice.question}
   → 사용자의 선택: ${choice.choice}`
}).join('\n\n')}

**중요**: 위의 이전 선택들을 바탕으로 각 장소에서 연결성 있는 스토리를 만들어주세요.
` : ''}

## ⚠️ 반드시 아래 형식을 정확히 따라주세요:

# [창의적이고 흥미로운 제목]

> *[간단한 소개문구 또는 분위기 설정]*

## 📍 ${routes[0]?.customInfo?.customName || routes[0]?.address || '시작 지점'}

[이 장소에서 벌어지는 이야기를 200-300자로 생생하게 묘사]

### ${genreEmoji} 선택의 순간

> **질문**: [현재 상황에서 주인공이 직면한 딜레마나 선택의 기로]

**당신의 선택은?**

1. **[구체적인 행동 1]** - *[선택 시 예상되는 결과나 분위기]*
2. **[구체적인 행동 2]** - *[선택 시 예상되는 결과나 분위기]*  
3. **[구체적인 행동 3]** - *[선택 시 예상되는 결과나 분위기]*

---

${routes.length > 1 ? routes.slice(1).map((route) => `
## 📍 ${route.customInfo?.customName || route.address}

[이 장소에서의 이야기 200-300자]

### ${genreEmoji} 선택의 순간

> **질문**: [상황에 맞는 선택 질문]

**당신의 선택은?**

1. **[행동 1]** - *[결과 설명]*
2. **[행동 2]** - *[결과 설명]*
3. **[행동 3]** - *[결과 설명]*

---`).join('\n') : ''}

## 💡 추가 지시사항
- 각 선택지는 서로 다른 방향성을 가져야 함
- 질문은 독자의 몰입을 유도하는 형태로 작성
- 선택지 설명은 호기심을 자극하되 너무 많은 정보는 주지 않기
- 이탤릭체(*)는 분위기나 감정 표현에 활용
- 굵은 글씨(**)는 중요한 키워드나 선택지 강조에 사용`
  }

  private getGenreEmoji(genre: string): string {
    const emojis: { [key: string]: string } = {
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
      '공포': '👻'
    }
    return emojis[genre] || '📖'
  }

  private buildChoicesPrompt(location: RouteContext): string {
    const time = new Date(location.timestamp).toLocaleString('ko-KR')
    const name = location.customInfo?.customName || location.address
    
    return `다음 장소에서 벌어질 수 있는 흥미로운 상황과 선택지 3개를 만들어주세요:

**장소 정보:**
- 장소: ${name}
- 시간: ${time}
- 체류 시간: ${location.duration || '알 수 없음'}분

**요구사항:**
1. 해당 장소의 특성을 반영한 상황 설정
2. 각 선택지는 스토리 전개에 영향을 주어야 함
3. 현실적이면서도 흥미로운 선택지

**응답 형식:**
> ### 🎯 상황: [구체적인 상황 설명]
> 
> 1) [선택지 1 제목] - [간단한 설명]
> 2) [선택지 2 제목] - [간단한 설명]  
> 3) [선택지 3 제목] - [간단한 설명]`
  }

  private buildInteractiveQuestionPrompt(
    route: any, 
    settings: { genre: string; style: string }, 
    locationIndex: number,
    previousChoices?: Array<{ question: string; choice: string }>
  ): string {
    const time = new Date(route.timestamp).toLocaleString('ko-KR')
    const locationName = route.customInfo?.customName || route.address || `장소 ${locationIndex + 1}`
    const description = route.customInfo?.description || ''
    const storyHint = route.customInfo?.storyHint || ''
    const genreEmoji = this.getGenreEmoji(settings.genre)
    
    const previousContext = previousChoices && previousChoices.length > 0 
      ? `\n**이전 선택들:**\n${previousChoices.map((choice, i) => `${i + 1}. ${choice.question} → ${choice.choice}`).join('\n')}`
      : ''

    return `${settings.genre} 장르의 인터랙티브 소설을 위한 **하나의 질문과 정확히 3개의 선택지**를 마크다운 형식으로 생성해주세요.

**🚨 중요: 오직 하나의 질문과 정확히 3개의 선택지만 생성하세요!**

## 📍 현재 장소
**${locationName}**
- 시간: ${time}
- 설명: ${description || '특별한 설명 없음'}
- 힌트: ${storyHint || '자유롭게 상상하세요'}

## 📋 마크다운 형식 (필수)

\`\`\`markdown
### ${genreEmoji} [상황 제목]

> **질문**: [구체적인 선택 상황]

*[분위기나 추가 맥락 설명]*

**당신의 선택은?**

1. **[선택 1 제목]** - *[결과 힌트]*
2. **[선택 2 제목]** - *[결과 힌트]*
3. **[선택 3 제목]** - *[결과 힌트]*
\`\`\`

## ✅ 체크리스트
- [ ] 질문은 > 인용문으로 시작
- [ ] 선택지 제목은 **굵은 글씨**
- [ ] 결과 설명은 *이탤릭체*
- [ ] ${settings.genre} 장르 특성 반영
- [ ] 정확히 3개의 선택지
- [ ] 각 선택지는 구체적인 행동${previousContext}

## 🎯 작성 예시

### ${genreEmoji} 비밀의 문 앞에서

> **질문**: 오래된 ${locationName}에서 숨겨진 문을 발견했습니다. 어떻게 하시겠습니까?

*낡은 문에서 이상한 빛이 새어 나오고 있습니다.*

**당신의 선택은?**

1. **조심스럽게 문을 열어본다** - *미지의 세계로 첫발을 내딛는다*
2. **주변을 더 조사한다** - *단서를 찾아 신중하게 접근한다*
3. **다른 사람을 찾아간다** - *도움을 요청하거나 정보를 얻는다*

---

위 예시와 같은 형식으로 작성해주세요.`
  }

  private buildSectionPrompt(context: SectionGenerationContext): string {
    const { route, preferences, previousContext, selectedChoice } = context
    const name = route.customInfo?.customName || route.address
    
    return `이전 맥락을 이어받아 다음 장소에서의 이야기를 계속 작성해주세요:

**이전 맥락:**
${previousContext}

**현재 장소:**
- 장소: ${name}
- 선택된 상황: ${selectedChoice || '특별한 선택 없음'}

**요구사항:**
- 장르: ${preferences.genre}
- 톤: ${preferences.tone}
- 시점: ${preferences.style === 'first_person' ? '1인칭' : '3인칭'}
- 분량: 800-1200자
- 이전 맥락과 자연스럽게 연결
- 선택된 상황을 반영한 전개

이야기를 계속해서 작성해주세요:`
  }

  private buildStorySectionPrompt(context: StorySectionGenerationContext): string {
    const { currentContent, selectedChoice, preferences } = context
    
    return `기존 소설의 연장선에서 선택지에 따른 다음 섹션을 작성해주세요:

**기존 소설:**
${currentContent.length > 2000 ? currentContent.substring(currentContent.length - 2000) : currentContent}

**선택된 상황:**
- 장소: ${selectedChoice.location}
- 질문: ${selectedChoice.question}
- 선택: ${selectedChoice.selectedOption}
- 설명: ${selectedChoice.optionDescription}

**요구사항:**
- 장르: ${preferences.genre}
- 톤: ${preferences.tone}
- 시점: ${preferences.style === 'first_person' ? '1인칭' : '3인칭'}
- 분량: 500-800자
- 선택된 상황을 자연스럽게 이어가기
- 기존 스토리와 일관성 유지

**응답 형식:**
### 📍 사용자의 선택: **${selectedChoice.selectedOption}**

[이어지는 소설 내용]

**새로운 선택지 (선택사항):**
> ### 🎯 [장소명] - [상황 설명]
> 
> 1) [선택지 1]
> 2) [선택지 2]

새로운 섹션을 작성해주세요:`
  }

  private parseStoryResponse(response: string): { content: string; choices: StoryChoice[] } {
    const choices: StoryChoice[] = []
    
    // 개선된 정규식으로 마크다운 형식의 선택지 파싱
    const choiceBlocks = response.matchAll(
      /### [🚀💕😄🔍🎭⚔️👻🔮📖] (.+?)\n([\s\S]*?)(?=### [🚀💕😄🔍🎭⚔️👻🔮📖]|---|## 📍|$)/g
    )
    
    let blockIndex = 0
    for (const match of choiceBlocks) {
      const sectionContent = match[2]
      
      // 질문 파싱 - 인용문 형식
      const questionMatch = sectionContent.match(/>\s*\*\*질문\*\*:\s*(.+?)(?=\n|$)/)
      const question = questionMatch ? questionMatch[1].trim() : '무엇을 하시겠습니까?'
      
      // 현재 장소 찾기
      const beforeMatchIndex = match.index || 0
      const locationMatch = response.lastIndexOf('## 📍', beforeMatchIndex)
      let location = '알 수 없는 장소'
      if (locationMatch !== -1) {
        const locMatch = response.substring(locationMatch).match(/## 📍\s*(.+?)(?=\n|$)/)
        if (locMatch) location = locMatch[1].trim()
      }
      
      // 선택지 파싱 - 굵은 글씨와 이탤릭 형식
      const optionMatches = sectionContent.matchAll(
        /(\d+)\.\s*\*\*(.+?)\*\*\s*-\s*\*(.+?)\*(?=\n|$)/g
      )
      
      const options = []
      for (const opt of optionMatches) {
        options.push({
          id: `choice-${blockIndex}-opt-${opt[1]}`,
          text: opt[2].trim(),
          description: opt[3].trim()
        })
      }
      
      // 최소 2개 이상의 선택지가 있을 때만 추가
      if (options.length >= 2) {
        choices.push({
          id: `choice-${blockIndex}`,
          location: location,
          question: question,
          options: options
        })
        blockIndex++
      }
    }
    
    // 선택지가 하나도 파싱되지 않은 경우 대체 파싱 시도
    if (choices.length === 0) {
      console.warn('마크다운 형식 파싱 실패, 대체 파싱 시도')
      return this.parseStoryResponseFallback(response)
    }
    
    return { content: response, choices }
  }

  // 폴백 파싱 메서드
  private parseStoryResponseFallback(response: string): { content: string; choices: StoryChoice[] } {
    const choices: StoryChoice[] = []
    
    // 간단한 패턴으로 선택지 찾기
    const simpleChoicePattern = /(?:선택지|당신의 선택은?).*?:\s*\n([\s\S]*?)(?=\n\n|---|$)/g
    const matches = response.matchAll(simpleChoicePattern)
    
    for (const match of matches) {
      const choiceText = match[1]
      const options = []
      
      // 숫자로 시작하는 라인 찾기
      const lines = choiceText.split('\n')
      for (const line of lines) {
        const optMatch = line.match(/^\s*(\d+)[.)]\s*(.+)/)
        if (optMatch) {
          const parts = optMatch[2].split('-').map(s => s.trim())
          const text = parts[0] || optMatch[2]
          const description = parts[1] || text
          
          options.push({
            id: `fallback-opt-${optMatch[1]}`,
            text: text.replace(/\*\*/g, '').trim(),
            description: description.replace(/[\*_]/g, '').trim()
          })
        }
      }
      
      if (options.length > 0) {
        choices.push({
          id: `fallback-choice-${choices.length}`,
          location: '장소',
          question: '무엇을 하시겠습니까?',
          options
        })
      }
    }
    
    return { content: response, choices }
  }

  private parseChoicesResponse(response: string, location: RouteContext): StoryChoice {
    const lines = response.trim().split('\n').filter(line => line.trim())
    
    let situation = ''
    const options: any[] = []
    
    for (const line of lines) {
      if (line.startsWith('상황:')) {
        situation = line.replace('상황:', '').trim()
      } else if (/^\d+\)/.test(line.trim())) {
        const optMatch = line.match(/^\d+\)\s*(.+?)(?:\s*-\s*(.+))?$/)
        if (optMatch) {
          options.push({
            id: `opt-${options.length}`,
            text: optMatch[1].trim(),
            description: optMatch[2] ? optMatch[2].trim() : optMatch[1].trim()
          })
        }
      }
    }
    
    return {
      id: `choice-${Date.now()}`,
      location: location.customInfo?.customName || location.address,
      question: situation || '이곳에서 무엇을 할까요?',
      options
    }
  }

  private parseInteractiveQuestionResponse(
    response: string, 
    _route: any, 
    locationIndex: number
  ): { id: string; locationId: string; question: string; choices: Array<{ id: string; text: string; description: string }>; context?: string } {
    const lines = response.trim().split('\n').filter(line => line.trim())
    
    console.log('🔍 [Gemini] 파싱 시작:', {
      responseLength: response.length,
      linesCount: lines.length,
      firstFewLines: lines.slice(0, 5)
    })
    
    let question = ''
    let context = ''
    const choices: Array<{ id: string; text: string; description: string }> = []
    
    for (const line of lines) {
      // 질문 파싱 - 마크다운 인용 형식 지원
      if (line.includes('**질문**:')) {
        question = line.replace(/^.*?\*\*질문\*\*:\s*/, '').trim()
        console.log('✅ [Gemini] 질문 파싱 성공:', question)
      } else if (line.includes('질문:')) {
        question = line.replace(/^.*?질문:\s*/, '').trim()
        console.log('✅ [Gemini] 질문 파싱 성공:', question)
      } else if (line.startsWith('맥락:')) {
        context = line.replace('맥락:', '').trim()
        console.log('✅ [Gemini] 맥락 파싱 성공:', context)
      } else if (/^\d+\.\s*\*\*/.test(line.trim())) {
        // 마크다운 형식: "1. **텍스트** - *설명*" (완전한 형태)
        let optMatch = line.match(/^\d+\.\s*\*\*(.+?)\*\*\s*-\s*\*(.+?)\*/)
        if (optMatch) {
          const choice = {
            id: `choice_${locationIndex}_${choices.length}`,
            text: optMatch[1].trim(),
            description: optMatch[2].trim()
          }
          choices.push(choice)
          console.log('✅ [Gemini] 마크다운 선택지 파싱 성공:', choice)
        } else {
          // 불완전한 형태 처리: "1. **텍스트**" (설명 없음 또는 잘림)
          optMatch = line.match(/^\d+\.\s*\*\*(.+?)\*\*/)
          if (optMatch) {
            const choice = {
              id: `choice_${locationIndex}_${choices.length}`,
              text: optMatch[1].trim(),
              description: optMatch[1].trim() // 텍스트를 설명으로도 사용
            }
            choices.push(choice)
            console.log('✅ [Gemini] 불완전한 마크다운 선택지 파싱:', choice)
          }
        }
      } else if (/^\d+\)/.test(line.trim())) {
        // 기존 형식: "1) 텍스트 - 설명"
        const optMatch = line.match(/^\d+\)\s*(.+?)(?:\s*-\s*(.+))?$/)
        if (optMatch) {
          const choice = {
            id: `choice_${locationIndex}_${choices.length}`,
            text: optMatch[1].trim(),
            description: optMatch[2] ? optMatch[2].trim() : optMatch[1].trim()
          }
          choices.push(choice)
          console.log('✅ [Gemini] 기존 형식 선택지 파싱 성공:', choice)
        }
      }
    }
    
    // 기본값 설정
    if (!question) {
      question = '이곳에서 어떤 행동을 취하시겠습니까?'
    }
    
    // 선택지가 2개만 생성된 경우 3번째 선택지 추가
    if (choices.length === 2) {
      choices.push({
        id: `choice_${locationIndex}_2`,
        text: '신중하게 더 생각해보기',
        description: '상황을 좀 더 분석하고 판단하기'
      })
    }
    
    if (choices.length === 0) {
      // AI가 선택지를 제대로 생성하지 못한 경우 기본 선택지 제공
      choices.push(
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
      )
    }
    
    // 선택지 수를 최대 3개로 제한
    if (choices.length > 3) {
      console.warn(`⚠️ [Gemini] 선택지 ${choices.length}개 생성됨, 처음 3개만 사용`)
      choices.splice(3) // 처음 3개만 유지
    }
    
    console.log(`파싱된 선택지 수: ${choices.length}개`)
    choices.forEach((choice, index) => {
      console.log(`선택지 ${index + 1}: ${choice.text}`)
    })
    
    return {
      id: `question_${locationIndex}`,
      locationId: `location_${locationIndex}`,
      question,
      choices,
      context: context || undefined
    }
  }
}