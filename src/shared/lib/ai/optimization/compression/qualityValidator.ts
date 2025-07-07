/**
 * 품질 검증 유틸리티
 * FSD: shared/lib/ai/optimization/compression
 */

import { QualityScore } from '../types'

export class QualityValidator {
  async validateQuality(original: string, compressed: string): Promise<QualityScore> {
    // 기본 품질 지표 계산
    const semanticSimilarity = this.calculateSemanticSimilarity(original, compressed)
    const keywordPreservation = this.calculateKeywordPreservation(original, compressed)
    const structureIntegrity = this.calculateStructureIntegrity(original, compressed)
    
    // 종합 점수 계산 (가중 평균)
    const score = (
      semanticSimilarity * 0.4 +
      keywordPreservation * 0.4 +
      structureIntegrity * 0.2
    )
    
    return {
      score,
      metrics: {
        semanticSimilarity,
        keywordPreservation,
        structureIntegrity
      }
    }
  }
  
  private calculateSemanticSimilarity(original: string, compressed: string): number {
    // 간단한 Jaccard 유사도 계산
    const originalWords = new Set(this.extractWords(original))
    const compressedWords = new Set(this.extractWords(compressed))
    
    const intersection = new Set([...originalWords].filter(word => compressedWords.has(word)))
    const union = new Set([...originalWords, ...compressedWords])
    
    return intersection.size / union.size
  }
  
  private calculateKeywordPreservation(original: string, compressed: string): number {
    const originalKeywords = this.extractKeywords(original)
    const compressedKeywords = this.extractKeywords(compressed)
    
    if (originalKeywords.length === 0) return 1.0
    
    let preserved = 0
    originalKeywords.forEach(keyword => {
      if (compressedKeywords.includes(keyword)) {
        preserved++
      }
    })
    
    return preserved / originalKeywords.length
  }
  
  private calculateStructureIntegrity(original: string, compressed: string): number {
    // 문장 구조 유지도 계산
    const originalSentences = original.split(/[.!?]/).filter(s => s.trim())
    const compressedSentences = compressed.split(/[.!?]/).filter(s => s.trim())
    
    // 문장 수 비율
    const sentenceRatio = Math.min(1, compressedSentences.length / originalSentences.length)
    
    // 문장 길이 분포 유사도
    const originalAvgLength = originalSentences.reduce((sum, s) => sum + s.length, 0) / originalSentences.length
    const compressedAvgLength = compressedSentences.reduce((sum, s) => sum + s.length, 0) / compressedSentences.length
    
    const lengthSimilarity = 1 - Math.abs(originalAvgLength - compressedAvgLength) / Math.max(originalAvgLength, compressedAvgLength)
    
    return (sentenceRatio + lengthSimilarity) / 2
  }
  
  private extractWords(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1)
  }
  
  private extractKeywords(text: string): string[] {
    const words = this.extractWords(text)
    
    // 불용어 제거
    const stopWords = new Set([
      '이', '가', '을', '를', '에', '의', '로', '와', '과', '도', '는', '은',
      '이다', '있다', '없다', '한다', '된다', '하다', '되다', '것', '수', '때',
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
    ])
    
    const keywords = words.filter(word => !stopWords.has(word))
    
    // 빈도 기반 키워드 추출
    const frequency = new Map<string, number>()
    keywords.forEach(word => {
      frequency.set(word, (frequency.get(word) || 0) + 1)
    })
    
    // 빈도 2 이상인 단어들을 키워드로 선택
    return Array.from(frequency.entries())
      .filter(([_, freq]) => freq >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([word, _]) => word)
      .slice(0, 10)  // 상위 10개만
  }
}