/**
 * 프롬프트 압축 구현
 * FSD: shared/lib/ai/optimization/compression
 */

import { CompressionStrategy, CompressedPrompt, QualityScore } from '../types'
import { TokenEstimator } from './tokenEstimator'
import { QualityValidator } from './qualityValidator'

interface CompressionConfig {
  targetReduction: number
  preserveQuality: boolean
  minQualityScore: number
}

export class PromptCompressor implements CompressionStrategy {
  constructor(
    private tokenEstimator: TokenEstimator,
    private qualityValidator: QualityValidator,
    private config: CompressionConfig
  ) {}

  async compress(prompt: string, targetReduction: number): Promise<CompressedPrompt> {
    const originalTokens = this.tokenEstimator.estimateTokens(prompt)
    const finalTargetReduction = targetReduction || this.config.targetReduction
    
    // 압축 전략들을 순차적으로 적용
    let compressed = prompt
    let currentReduction = 0
    
    // 1. 중복 제거 및 불필요한 공백 정리
    compressed = this.removeRedundancy(compressed)
    currentReduction = this.calculateReduction(prompt, compressed)
    
    // 2. 문장 구조 최적화
    if (currentReduction < finalTargetReduction) {
      compressed = this.optimizeStructure(compressed)
      currentReduction = this.calculateReduction(prompt, compressed)
    }
    
    // 3. 키워드 우선 압축
    if (currentReduction < finalTargetReduction) {
      compressed = this.keywordBasedCompression(compressed, finalTargetReduction - currentReduction)
      currentReduction = this.calculateReduction(prompt, compressed)
    }
    
    // 4. 품질 검증
    const quality = this.config.preserveQuality 
      ? await this.qualityValidator.validateQuality(prompt, compressed)
      : { score: 1.0, metrics: { semanticSimilarity: 1.0, keywordPreservation: 1.0, structureIntegrity: 1.0 } }
    
    // 품질이 기준에 미달하면 덜 압축된 버전 사용
    if (quality.score < this.config.minQualityScore) {
      compressed = this.fallbackCompression(prompt, finalTargetReduction * 0.7)
      currentReduction = this.calculateReduction(prompt, compressed)
    }
    
    const finalTokens = this.tokenEstimator.estimateTokens(compressed)
    const tokensSaved = originalTokens - finalTokens
    
    return {
      original: prompt,
      compressed,
      tokensSaved,
      compressionRatio: currentReduction,
      quality: quality.score
    }
  }

  estimateTokens(text: string): number {
    return this.tokenEstimator.estimateTokens(text)
  }

  async validateQuality(original: string, compressed: string): Promise<QualityScore> {
    return this.qualityValidator.validateQuality(original, compressed)
  }

  private removeRedundancy(text: string): string {
    return text
      // 중복 공백 제거
      .replace(/\s+/g, ' ')
      // 중복 문장 부호 제거
      .replace(/[,.!?]{2,}/g, (match) => match[0])
      // 불필요한 접속사 제거
      .replace(/\b(그리고|또한|더불어|아울러)\s+/g, '')
      // 중복 형용사 제거
      .replace(/\b(매우|정말|굉장히|너무)\s+(매우|정말|굉장히|너무)\s+/g, '$1 ')
      .trim()
  }

  private optimizeStructure(text: string): string {
    return text
      // 긴 문장을 짧게 분할
      .replace(/([^.!?]{100,}?)([,:])\s+/g, '$1. ')
      // 불필요한 수식어 제거
      .replace(/\b(아마도|혹시|만약에|아마)\s+/g, '')
      // 간접 표현을 직접 표현으로
      .replace(/\b(~할 수 있다|~하는 것이 가능하다)/g, '~한다')
      // 이중 부정 제거
      .replace(/\b(않지 않다|아니지 않다)/g, '맞다')
      .trim()
  }

  private keywordBasedCompression(text: string, targetReduction: number): string {
    const sentences = text.split(/[.!?]/).filter(s => s.trim())
    
    // 키워드 빈도 분석
    const keywords = this.extractKeywords(text)
    const keywordFreq = new Map<string, number>()
    
    keywords.forEach(keyword => {
      keywordFreq.set(keyword, (keywordFreq.get(keyword) || 0) + 1)
    })
    
    // 중요도 기반 문장 순위
    const sentenceScores = sentences.map(sentence => {
      let score = 0
      keywords.forEach(keyword => {
        if (sentence.includes(keyword)) {
          score += keywordFreq.get(keyword) || 0
        }
      })
      return { sentence, score }
    })
    
    // 상위 문장들만 유지
    const keepRatio = 1 - (targetReduction / 100)
    const keepCount = Math.max(1, Math.floor(sentences.length * keepRatio))
    
    const selected = sentenceScores
      .sort((a, b) => b.score - a.score)
      .slice(0, keepCount)
      .map(item => item.sentence)
    
    return selected.join('. ') + '.'
  }

  private fallbackCompression(text: string, targetReduction: number): string {
    // 안전한 압축: 공백과 불필요한 단어만 제거
    let result = text
      .replace(/\s+/g, ' ')
      .replace(/\b(그런데|그러나|하지만|또한|그리고)\s+/g, '')
      .replace(/\b(~입니다|~습니다)/g, '~다')
      .trim()

    // 목표 압축률에 따라 추가 압축
    if (targetReduction > 20) {
      result = result
        .replace(/\b(아마도|혹시|만약에|아마)\s+/g, '')
        .replace(/\b(매우|정말|굉장히|너무)\s+/g, '')
    }

    return result
  }

  private extractKeywords(text: string): string[] {
    // 간단한 키워드 추출 (실제로는 더 정교한 NLP 필요)
    const words = text.match(/[가-힣]{2,}/g) || []
    const stopWords = new Set(['것이', '있다', '없다', '한다', '된다', '이다', '아니다'])
    
    return words.filter(word => !stopWords.has(word))
  }

  private calculateReduction(original: string, compressed: string): number {
    const originalTokens = this.tokenEstimator.estimateTokens(original)
    const compressedTokens = this.tokenEstimator.estimateTokens(compressed)
    return ((originalTokens - compressedTokens) / originalTokens) * 100
  }
}