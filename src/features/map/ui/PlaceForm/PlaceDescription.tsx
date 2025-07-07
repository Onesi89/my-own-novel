/**
 * Place Description Component
 * FSD: features/map/ui/PlaceForm
 * 
 * 장소 설명 입력 필드
 */

'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Textarea, Label } from '@/shared/ui'
import { usePlaceForm } from './PlaceFormProvider'
import { INPUT_LIMITS } from '@/shared/lib/validation/inputValidation'

export function PlaceDescription() {
  const { state, sanitizeAndUpdateField } = usePlaceForm()

  return (
    <div className="space-y-2">
      <Label htmlFor="description" className="text-sm font-medium">
        장소 설명 (사건, 상황) *
      </Label>
      
      <Textarea
        id="description"
        value={state.formData.description || ''}
        onChange={(e) => 
          sanitizeAndUpdateField('description', e.target.value, INPUT_LIMITS.LOCATION_DESCRIPTION)
        }
        placeholder="이 장소에서 일어난 일이나 특별한 상황을 자세히 설명해주세요 (최소 10글자)"
        className={`min-h-[80px] ${state.errors.description ? 'border-red-500' : ''}`}
        maxLength={INPUT_LIMITS.LOCATION_DESCRIPTION}
      />
      
      {state.errors.description && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {state.errors.description}
        </p>
      )}
      
      <p className="text-xs text-gray-500 text-right">
        {state.formData.description?.length || 0}/{INPUT_LIMITS.LOCATION_DESCRIPTION}
      </p>
    </div>
  )
}