/**
 * Anthropic Claude AI Provider
 * FSD: shared/lib/ai
 */

import Anthropic from '@anthropic-ai/sdk'
import { 
  AIProvider, 
  AIResponse, 
  StoryGenerationContext, 
  StoryChoice, 
  RouteContext,
  SectionGenerationContext,
  StorySectionGenerationContext
} from './types'

export class ClaudeProvider implements AIProvider {
  private client: Anthropic
  private model: string

  constructor(apiKey?: string, model = 'claude-3-5-sonnet-20241022') {
    if (!apiKey) {
      throw new Error('Claude API key is required')
    }
    
    this.client = new Anthropic({
      apiKey
    })
    this.model = model
  }

  async generateStory(context: StoryGenerationContext): Promise<AIResponse> {
    try {
      const prompt = this.buildStoryPrompt(context)
      
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4000,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      // 응답 파싱 및 구조화
      const parsedStory = this.parseStoryResponse(content.text)

      return {
        success: true,
        data: {
          content: parsedStory.content,
          choices: parsedStory.choices,
          metadata: {
            model: this.model,
            timestamp: new Date().toISOString()
          }
        },
        tokenUsage: {
          prompt: response.usage.input_tokens,
          completion: response.usage.output_tokens,
          total: response.usage.input_tokens + response.usage.output_tokens
        }
      }
    } catch (error) {
      console.error('Claude API error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async generateChoices(location: RouteContext): Promise<StoryChoice> {
    try {
      const prompt = this.buildChoicesPrompt(location)
      
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 800,
        temperature: 0.8,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      return this.parseChoicesResponse(content.text, location)
    } catch (error) {
      console.error('Claude choices generation error:', error)
      throw error
    }
  }

  async generateSection(context: SectionGenerationContext): Promise<AIResponse> {
    try {
      const prompt = this.buildSectionPrompt(context)
      
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1500,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      return {
        success: true,
        data: {
          content: content.text.trim(),
          metadata: {
            model: this.model,
            location: context.route.address
          }
        },
        tokenUsage: {
          prompt: response.usage.input_tokens,
          completion: response.usage.output_tokens,
          total: response.usage.input_tokens + response.usage.output_tokens
        }
      }
    } catch (error) {
      console.error('Claude section generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async generateStorySection(context: StorySectionGenerationContext): Promise<AIResponse> {
    try {
      const prompt = this.buildStorySectionPrompt(context)
      
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1500,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      return {
        success: true,
        data: {
          content: content.text.trim(),
          metadata: {
            model: this.model,
            storyId: context.storyId,
            choice: context.selectedChoice
          }
        },
        tokenUsage: {
          prompt: response.usage.input_tokens,
          completion: response.usage.output_tokens,
          total: response.usage.input_tokens + response.usage.output_tokens
        }
      }
    } catch (error) {
      console.error('Claude story section generation error:', error)
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

소설을 작성해주세요.`
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
    
    // 선택지 파싱
    const choiceRegex = /\*\*선택지:\*\*\s*([\s\S]*?)(?=\n\n|\*\*|$)/g
    const choices: StoryChoice[] = []
    let match
    
    while ((match = choiceRegex.exec(response)) !== null) {
      const choiceText = match[1]
      const locationMatch = choiceText.match(/([^-]+)\s*-\s*([^1-9]+)/i)
      
      if (locationMatch) {
        const location = locationMatch[1].trim()
        const question = locationMatch[2].trim()
        
        const optionRegex = /(\d+)\)\s*([^-\n]+)(?:\s*-\s*([^\n]+))?/g
        const options: { id: string; text: string; description: string }[] = []
        let optionMatch
        
        while ((optionMatch = optionRegex.exec(choiceText)) !== null) {
          options.push({
            id: `choice_${Date.now()}_${optionMatch[1]}`,
            text: optionMatch[2].trim(),
            description: optionMatch[3]?.trim() || ''
          })
        }
        
        if (options.length > 0) {
          choices.push({
            id: `location_${Date.now()}_${location}`,
            location,
            question,
            options
          })
        }
      }
    }
    
    // 본문에서 선택지 부분 제거
    const contentWithoutChoices = response
      .replace(/제목:\s*[^\n]+\n*/i, '')
      .replace(/\*\*선택지:\*\*[\s\S]*$/g, '')
      .trim()
    
    const content = title ? `# ${title}\n\n${contentWithoutChoices}` : contentWithoutChoices
    
    return { content, choices }
  }

  private parseChoicesResponse(response: string, location: RouteContext): StoryChoice {
    const situationMatch = response.match(/상황:\s*(.+)/i)
    const situation = situationMatch ? situationMatch[1].trim() : '흥미로운 상황이 벌어집니다.'
    
    const optionRegex = /(\d+)\)\s*([^-\n]+)(?:\s*-\s*([^\n]+))?/g
    const options: { id: string; text: string; description: string }[] = []
    let match
    
    while ((match = optionRegex.exec(response)) !== null) {
      options.push({
        id: `choice_${Date.now()}_${match[1]}`,
        text: match[2].trim(),
        description: match[3]?.trim() || ''
      })
    }
    
    return {
      id: `location_${Date.now()}_${location.id}`,
      location: location.customInfo?.customName || location.address,
      question: situation,
      options
    }
  }
}