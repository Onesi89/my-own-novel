/**
 * 선택지 제한 모듈
 * FSD: shared/lib/ai/optimization/choices
 */

export { ChoiceLimiter } from './choiceLimiter'
export { StructuredPromptGenerator } from './structuredPromptGenerator'
export { ChoiceValidator } from './choiceValidator'

import { ChoiceLimiter } from './choiceLimiter'
import { StructuredPromptGenerator } from './structuredPromptGenerator'
import { ChoiceValidator } from './choiceValidator'
import { ChoiceStrategy } from '../types'

export interface ChoiceConfig {
  maxChoices: 2 | 3
  enforceLimit: boolean
  qualityThreshold: number
}

export function createChoiceStrategy(config: ChoiceConfig): ChoiceStrategy {
  const validator = new ChoiceValidator()
  const promptGenerator = new StructuredPromptGenerator(config)
  
  return new ChoiceLimiter(validator, promptGenerator, config)
}