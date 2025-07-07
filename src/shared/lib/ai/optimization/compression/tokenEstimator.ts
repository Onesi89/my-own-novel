/**
 * 토큰 추정 유틸리티
 * FSD: shared/lib/ai/optimization/compression
 */

export class TokenEstimator {
  // 한국어 토큰 추정 (GPT-4 기준 근사치)
  private readonly KOREAN_CHAR_TO_TOKEN_RATIO = 0.7
  private readonly ENGLISH_WORD_TO_TOKEN_RATIO = 0.75
  
  estimateTokens(text: string): number {
    if (!text) return 0
    
    // 한국어와 영어 분리
    const koreanChars = (text.match(/[가-힣]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    const numbers = (text.match(/\d+/g) || []).length
    const punctuation = (text.match(/[^\w\s가-힣]/g) || []).length
    
    // 토큰 계산
    const koreanTokens = koreanChars * this.KOREAN_CHAR_TO_TOKEN_RATIO
    const englishTokens = englishWords * this.ENGLISH_WORD_TO_TOKEN_RATIO
    const numberTokens = numbers * 0.5  // 숫자는 보통 작은 토큰
    const punctuationTokens = punctuation * 0.3
    
    return Math.ceil(koreanTokens + englishTokens + numberTokens + punctuationTokens)
  }
  
  // 더 정확한 토큰 추정 (실제 사용시 tiktoken 라이브러리 사용 권장)
  estimateTokensAccurate(text: string): number {
    // 간단한 토큰화 시뮬레이션
    const tokens = text
      .replace(/[^\w\s가-힣]/g, ' $& ')  // 문장부호 분리
      .split(/\s+/)
      .filter(token => token.length > 0)
    
    // 긴 한국어 단어는 여러 토큰으로 분할될 수 있음
    let totalTokens = 0
    tokens.forEach(token => {
      if (/[가-힣]/.test(token)) {
        // 한국어: 2-3글자당 1토큰
        totalTokens += Math.ceil(token.length / 2.5)
      } else if (/[a-zA-Z]/.test(token)) {
        // 영어: 단어당 약 0.75토큰
        totalTokens += Math.max(1, Math.ceil(token.length / 4))
      } else {
        // 숫자, 특수문자 등
        totalTokens += 1
      }
    })
    
    return totalTokens
  }
  
  // 토큰 비용 추정
  estimateCost(tokens: number, provider: 'gemini' | 'claude'): number {
    const prices = {
      gemini: {
        input: 0.00015,   // per 1k tokens
        output: 0.0006
      },
      claude: {
        input: 0.003,     // per 1k tokens  
        output: 0.015
      }
    }
    
    const price = prices[provider]
    // 입력:출력 비율을 3:1로 가정
    const inputTokens = tokens * 0.75
    const outputTokens = tokens * 0.25
    
    return (inputTokens / 1000) * price.input + (outputTokens / 1000) * price.output
  }
}