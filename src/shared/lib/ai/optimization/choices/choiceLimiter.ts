/**
 * 선택지 제한 구현
 * FSD: shared/lib/ai/optimization/choices
 */

import { ChoiceStrategy, LimitedChoices, RouteContext, StoryPreferences } from '../types'
import { ChoiceValidator } from './choiceValidator'
import { StructuredPromptGenerator } from './structuredPromptGenerator'

interface ChoiceConfig {
  maxChoices: 2 | 3
  enforceLimit: boolean
  qualityThreshold: number
}

export class ChoiceLimiter implements ChoiceStrategy {
  constructor(
    private validator: ChoiceValidator,
    private promptGenerator: StructuredPromptGenerator,
    private config: ChoiceConfig
  ) {}

  async limitChoices(aiResponse: any, maxChoices: number): Promise<LimitedChoices> {
    const originalChoices = this.extractChoices(aiResponse)
    const originalCount = originalChoices.length
    
    if (originalCount <= maxChoices) {
      return {
        originalCount,
        limitedCount: originalCount,
        choices: originalChoices,
        removed: [],
        quality: 1.0
      }
    }
    
    // 선택지 품질 평가 및 순위 매기기
    const rankedChoices = await this.rankChoices(originalChoices)
    
    // 상위 선택지 선택
    const selectedChoices = rankedChoices.slice(0, maxChoices)
    const removedChoices = rankedChoices.slice(maxChoices)
    
    // 품질 점수 계산
    const quality = this.calculateQuality(selectedChoices, removedChoices)
    
    return {
      originalCount,
      limitedCount: maxChoices,
      choices: selectedChoices.map(item => item.choice),
      removed: removedChoices.map(item => item.choice),
      quality
    }
  }

  generateStructuredPrompt(
    routes: RouteContext[], 
    preferences: StoryPreferences,
    choiceLimit: number,
    previousChoices?: Array<{ question: string; choice: string }>
  ): string {
    return this.promptGenerator.generateStructuredPrompt(routes, preferences, choiceLimit, previousChoices)
  }

  validateChoices(choices: any[]): boolean {
    return this.validator.validateChoices(choices)
  }

  private extractChoices(aiResponse: any): any[] {
    // AI 응답에서 선택지 추출
    if (Array.isArray(aiResponse.choices)) {
      return aiResponse.choices
    }
    
    if (aiResponse.content && typeof aiResponse.content === 'string') {
      // 텍스트에서 선택지 파싱
      const choices = this.parseChoicesFromText(aiResponse.content)
      return choices
    }
    
    return []
  }

  private parseChoicesFromText(text: string): any[] {
    // 다양한 선택지 형식 파싱
    const patterns = [
      // 1. 선택지 1: 내용
      /(\d+)\.\s*선택지\s*\d*:\s*(.+?)(?=\n\d+\.\s*선택지|\n\n|$)/g,
      // 1) 내용
      /(\d+)\)\s*(.+?)(?=\n\d+\)|\n\n|$)/g,
      // - 내용
      /^-\s*(.+?)(?=\n-|\n\n|$)/gm,
      // • 내용
      /^•\s*(.+?)(?=\n•|\n\n|$)/gm
    ]
    
    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)]
      if (matches.length > 0) {
        return matches.map((match, index) => ({
          id: index + 1,
          content: match[2] || match[1],
          type: 'story_choice'
        }))
      }
    }
    
    // 문단별 분리 시도
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 10)
    if (paragraphs.length > 1) {
      return paragraphs.map((paragraph, index) => ({
        id: index + 1,
        content: paragraph.trim(),
        type: 'story_choice'
      }))
    }
    
    return []
  }

  private async rankChoices(choices: any[]): Promise<Array<{choice: any, score: number}>> {
    const scored = await Promise.all(choices.map(async (choice) => {
      const score = await this.calculateChoiceScore(choice)
      return { choice, score }
    }))
    
    return scored.sort((a, b) => b.score - a.score)
  }

  private async calculateChoiceScore(choice: any): Promise<number> {
    let score = 0
    
    // 텍스트 길이 (적절한 길이 선호)
    const content = choice.content || ''
    const length = content.length
    if (length >= 50 && length <= 200) {
      score += 0.3
    } else if (length < 50) {
      score += 0.1
    }
    
    // 구체성 (구체적 행동이나 상황 묘사)
    if (this.hasSpecificContent(content)) {
      score += 0.3
    }
    
    // 갈등/긴장감 (흥미로운 선택지)
    if (this.hasConflictOrTension(content)) {
      score += 0.2
    }
    
    // 일관성 (스토리 맥락과 일치)
    if (this.hasConsistency(content)) {
      score += 0.2
    }
    
    return score
  }

  private hasSpecificContent(content: string): boolean {
    // 구체적인 행동이나 묘사를 포함하는지 확인
    const specificPatterns = [
      /\d+/,  // 숫자
      /[가-힣]{2,}(으로|에게|에서|를|을)/,  // 구체적 대상
      /(말하다|가다|보다|찾다|만나다|싸우다|도망가다)/,  // 행동 동사
    ]
    
    return specificPatterns.some(pattern => pattern.test(content))
  }

  private hasConflictOrTension(content: string): boolean {
    // 갈등이나 긴장감을 나타내는 키워드
    const tensionKeywords = [
      '위험', '모험', '비밀', '숨기다', '배신', '선택', '딜레마',
      '갈등', '대립', '도전', '시험', '결정', '포기', '희생'
    ]
    
    return tensionKeywords.some(keyword => content.includes(keyword))
  }

  private hasConsistency(content: string): boolean {
    // 기본적인 일관성 체크 (더 정교한 로직 필요)
    const inconsistentPatterns = [
      /(.+)\1/,  // 중복된 내용
      /^.{0,10}$/,  // 너무 짧은 내용
      /[^\w\s가-힣.,!?]/  // 이상한 문자
    ]
    
    return !inconsistentPatterns.some(pattern => pattern.test(content))
  }

  private calculateQuality(selected: any[], removed: any[]): number {
    const selectedAvgScore = selected.reduce((sum, item) => sum + item.score, 0) / selected.length
    const totalAvgScore = [...selected, ...removed].reduce((sum, item) => sum + item.score, 0) / (selected.length + removed.length)
    
    return selectedAvgScore / totalAvgScore
  }
}