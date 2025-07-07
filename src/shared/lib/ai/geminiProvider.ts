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

  async generateStory(context: StoryGenerationContext): Promise<AIResponse> {
    try {
      const prompt = this.buildStoryPrompt(context)
      const model = this.client.getGenerativeModel({ model: this.model })
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4000,
        }
      })

      const response = result.response
      const content = response.text()

      if (!content) {
        throw new Error('Empty response from Gemini')
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

  private buildStoryPrompt(context: StoryGenerationContext): string {
    const { routes, preferences } = context
    
    const routeInfo = routes.map((route, index) => {
      const time = new Date(route.timestamp).toLocaleString('ko-KR')
      const name = route.customInfo?.customName || route.address
      const description = route.customInfo?.description || ''
      const duration = route.duration ? `${route.duration}분 체류` : ''
      
      return `${index + 1}. ${name}
   - 시간: ${time}
   - ${duration}
   - ${description}`
    }).join('\n\n')

    return `당신은 창의적인 작가입니다. 주어진 실제 이동 경로를 바탕으로 ${preferences.genre} 장르의 ${preferences.length}자 분량 소설을 작성해주세요.

**작성 조건:**
- 장르: ${preferences.genre}
- 분량: ${preferences.length}자 내외
- 시점: ${preferences.style === 'first_person' ? '1인칭' : '3인칭'}
- 톤: ${preferences.tone}
- 주인공: "나" (실제 경험한 사람 관점)

**이동 경로 정보:**
${routeInfo}

**요구사항:**
1. 각 장소에서 벌어질 수 있는 흥미로운 사건을 창조해주세요
2. 장소 간 이동을 자연스럽게 연결해주세요
3. 현실적이면서도 재미있는 스토리로 만들어주세요
4. 각 이동 경로에 대해 하나의 선택지만 제시해주세요 (총 ${routes.length}개의 선택지)

**응답 형식:**
제목: [창의적인 제목]

[소설 내용]

**선택지:**
> ### 🎯 [장소명] - [상황 설명]
> 
> 1) [선택지 1]
> 2) [선택지 2]  
> 3) [선택지 3]

소설을 작성해주세요:`
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
    
    const previousContext = previousChoices && previousChoices.length > 0 
      ? `\n**이전 선택들:**\n${previousChoices.map((choice, i) => `${i + 1}. ${choice.question} → ${choice.choice}`).join('\n')}`
      : ''

    return `${settings.genre} 장르의 인터랙티브 소설을 위한 질문과 선택지를 생성해주세요.

**현재 장소 정보:**
- 장소명: ${locationName}
- 방문 시간: ${time}
- 상황 설명: ${description}
- 스토리 힌트: ${storyHint}
- 장르: ${settings.genre}
- 서술 방식: ${settings.style === 'first_person' ? '1인칭' : '3인칭'}${previousContext}

**요구사항:**
1. ${settings.genre} 장르에 어울리는 상황과 질문 생성
2. 장소의 특성과 상황 설명을 반영
3. 스토리 힌트를 활용한 흥미로운 전개
4. 정확히 3개의 선택지 제공
5. 각 선택지는 서로 다른 방향으로 이야기가 전개되도록 구성

**응답 형식 (JSON 아님, 텍스트로):**
> ### 🎯 질문: [이 장소에서 일어날 상황에 대한 질문]
> 맥락: [선택에 도움이 되는 추가 정보나 분위기 설명]
> 
> 1) [선택지 1] - [결과 예상 설명]
> 2) [선택지 2] - [결과 예상 설명]
> 3) [선택지 3] - [결과 예상 설명]

질문과 선택지를 생성해주세요:`
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
    // 제목과 본문 분리
    const titleMatch = response.match(/제목:\s*(.+)/i)
    const title = titleMatch ? titleMatch[1].trim() : ''
    
    // 선택지 섹션 찾기
    const choicesMatch = response.match(/\*\*선택지:\*\*\s*([\s\S]+)$/)
    const choicesSection = choicesMatch ? choicesMatch[1] : ''
    
    // 본문 추출 (제목 이후부터 선택지 이전까지)
    let content = response
    if (titleMatch) {
      content = content.substring(titleMatch.index! + titleMatch[0].length)
    }
    if (choicesMatch) {
      content = content.substring(0, choicesMatch.index! - (titleMatch ? titleMatch[0].length : 0))
    }
    
    content = (title ? `# ${title}\n\n` : '') + content.trim()
    
    // 선택지 파싱
    const choices: StoryChoice[] = []
    if (choicesSection) {
      const choiceBlocks = choicesSection.split(/(?=\w+\s*-\s*)/g).filter(block => block.trim())
      
      choiceBlocks.forEach((block, index) => {
        const lines = block.trim().split('\n').filter(line => line.trim())
        if (lines.length === 0) return
        
        const locationMatch = lines[0].match(/^(.+?)\s*-\s*(.+)$/)
        if (!locationMatch) return
        
        const location = locationMatch[1].trim()
        const question = locationMatch[2].trim()
        
        const options = lines.slice(1)
          .filter(line => /^\d+\)/.test(line.trim()))
          .map((line, optIndex) => {
            const optMatch = line.match(/^\d+\)\s*(.+?)(?:\s*-\s*(.+))?$/)
            if (!optMatch) return null
            
            return {
              id: `choice-${index}-${optIndex}`,
              text: optMatch[1].trim(),
              description: optMatch[2] ? optMatch[2].trim() : optMatch[1].trim()
            }
          })
          .filter(opt => opt !== null)
        
        if (options.length > 0) {
          choices.push({
            id: `choice-${index}`,
            location,
            question,
            options: options as any[]
          })
        }
      })
    }
    
    return { content, choices }
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
    
    let question = ''
    let context = ''
    const choices: Array<{ id: string; text: string; description: string }> = []
    
    for (const line of lines) {
      if (line.startsWith('질문:')) {
        question = line.replace('질문:', '').trim()
      } else if (line.startsWith('맥락:')) {
        context = line.replace('맥락:', '').trim()
      } else if (/^\d+\)/.test(line.trim())) {
        const optMatch = line.match(/^\d+\)\s*(.+?)(?:\s*-\s*(.+))?$/)
        if (optMatch) {
          choices.push({
            id: `choice_${locationIndex}_${choices.length}`,
            text: optMatch[1].trim(),
            description: optMatch[2] ? optMatch[2].trim() : optMatch[1].trim()
          })
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