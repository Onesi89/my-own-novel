/**
 * Place Story Hint Component
 * FSD: features/map/ui/PlaceForm
 * 
 * 스토리 힌트 입력 필드 (미리 정의된 힌트 포함)
 */

'use client'

import React from 'react'
import { AlertCircle, Lightbulb } from 'lucide-react'
import { Textarea, Label, Button } from '@/shared/ui'
import { usePlaceForm } from './PlaceFormProvider'
import { INPUT_LIMITS } from '@/shared/lib/validation/inputValidation'

const PREDEFINED_HINTS = [
  '첫 만남이 있었던 곳',
  '중요한 결정을 내린 곳',
  '추억이 깃든 장소',
  '갈등이 있었던 곳',
  '새로운 시작의 장소',
  '이별을 고한 곳',
  '깨달음을 얻은 장소',
  '도전했던 곳'
]

export function PlaceStoryHint() {
  const { state, sanitizeAndUpdateField } = usePlaceForm()

  const handleHintSelect = (hint: string) => {
    sanitizeAndUpdateField('storyHint', hint, INPUT_LIMITS.STORY_HINT)
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="storyHint" className="text-sm font-medium">
        스토리 힌트 *
      </Label>
      
      {/* 미리 정의된 힌트 버튼들 */}
      <div className="space-y-2">
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Lightbulb className="w-3 h-3" />
          <span>자주 사용되는 힌트</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {PREDEFINED_HINTS.map((hint) => (
            <Button
              key={hint}
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleHintSelect(hint)}
            >
              {hint}
            </Button>
          ))}
        </div>
      </div>
      
      {/* 사용자 입력 필드 */}
      <Textarea
        id="storyHint"
        value={state.formData.storyHint || ''}
        onChange={(e) => 
          sanitizeAndUpdateField('storyHint', e.target.value, INPUT_LIMITS.STORY_HINT)
        }
        placeholder="이 장소에서 일어났을 만한 이야기나 상황을 간단히 입력해주세요 (최소 5글자)"
        className={`min-h-[60px] ${state.errors.storyHint ? 'border-red-500' : ''}`}
        maxLength={INPUT_LIMITS.STORY_HINT}
      />
      
      {state.errors.storyHint && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {state.errors.storyHint}
        </p>
      )}
      
      <p className="text-xs text-gray-500 text-right">
        {state.formData.storyHint?.length || 0}/{INPUT_LIMITS.STORY_HINT}
      </p>
    </div>
  )
}