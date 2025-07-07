/**
 * 선택지 검증 유틸리티
 * FSD: shared/lib/ai/optimization/choices
 */

export class ChoiceValidator {
  validateChoices(choices: any[]): boolean {
    if (!Array.isArray(choices) || choices.length === 0) {
      return false
    }

    // 각 선택지 검증
    return choices.every(choice => this.validateSingleChoice(choice))
  }

  validateSingleChoice(choice: any): boolean {
    // 기본 구조 검증
    if (!choice || typeof choice !== 'object') {
      return false
    }

    // 내용 검증
    const content = choice.content || choice.text || choice.description || ''
    if (typeof content !== 'string' || content.trim().length < 10) {
      return false
    }

    // 길이 검증
    if (content.length > 500) {
      return false
    }

    // 품질 검증
    return this.validateChoiceQuality(content)
  }

  private validateChoiceQuality(content: string): boolean {
    // 최소 품질 기준
    const qualityChecks = [
      this.hasMinimumWords(content),
      this.hasProperStructure(content),
      this.hasNoInappropriateContent(content),
      this.hasCoherentText(content)
    ]

    // 최소 3개 기준 통과
    return qualityChecks.filter(check => check).length >= 3
  }

  private hasMinimumWords(content: string): boolean {
    const words = content.split(/\s+/).filter(word => word.length > 0)
    return words.length >= 5
  }

  private hasProperStructure(content: string): boolean {
    // 기본적인 문장 구조 확인
    const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 0)
    return sentences.length >= 1 && sentences.every(s => s.trim().length > 3)
  }

  private hasNoInappropriateContent(content: string): boolean {
    // 부적절한 내용 필터링
    const inappropriateKeywords = [
      '폭력', '살인', '자살', '혐오', '차별', '음란', '도박', '마약'
    ]
    
    const lowerContent = content.toLowerCase()
    return !inappropriateKeywords.some(keyword => lowerContent.includes(keyword))
  }

  private hasCoherentText(content: string): boolean {
    // 문맥상 일관성 체크
    const inconsistentPatterns = [
      /(.{10,})\1/,  // 중복된 긴 문구
      /^.{0,5}$/,    // 너무 짧은 내용
      /[^\w\s가-힣.,!?'"()-]/,  // 이상한 특수문자
      /^\s*$|^\s*\n\s*$/  // 빈 내용
    ]
    
    return !inconsistentPatterns.some(pattern => pattern.test(content))
  }

  // 선택지 다양성 검증
  validateChoiceDiversity(choices: any[]): boolean {
    if (choices.length <= 1) return true

    const contents = choices.map(choice => 
      (choice.content || choice.text || choice.description || '').toLowerCase()
    )

    // 중복 검사
    const uniqueContents = new Set(contents)
    if (uniqueContents.size !== contents.length) {
      return false
    }

    // 유사도 검사 (간단한 버전)
    for (let i = 0; i < contents.length; i++) {
      for (let j = i + 1; j < contents.length; j++) {
        const similarity = this.calculateSimilarity(contents[i], contents[j])
        if (similarity > 0.8) {  // 80% 이상 유사하면 중복으로 간주
          return false
        }
      }
    }

    return true
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/))
    const words2 = new Set(text2.split(/\s+/))
    
    const intersection = new Set([...words1].filter(word => words2.has(word)))
    const union = new Set([...words1, ...words2])
    
    return intersection.size / union.size
  }
}