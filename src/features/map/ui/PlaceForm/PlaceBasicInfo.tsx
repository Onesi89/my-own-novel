/**
 * Place Basic Info Component
 * FSD: features/map/ui/PlaceForm
 * 
 * 장소 기본 정보 입력 필드 (이름)
 */

'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Input, Label } from '@/shared/ui'
import { usePlaceForm } from './PlaceFormProvider'
import { INPUT_LIMITS } from '@/shared/lib/validation/inputValidation'

export function PlaceBasicInfo() {
  const { state, sanitizeAndUpdateField } = usePlaceForm()

  return (
    <div className="space-y-2">
      <Label htmlFor="placeName" className="text-sm font-medium">
        장소 이름 *
      </Label>
      <Input
        id="placeName"
        value={state.formData.customName || ''}
        onChange={(e) => 
          sanitizeAndUpdateField('customName', e.target.value, INPUT_LIMITS.LOCATION_NAME)
        }
        placeholder="예: 우리 집, 회사, 카페 등"
        className={state.errors.customName ? 'border-red-500' : ''}
        maxLength={INPUT_LIMITS.LOCATION_NAME}
      />
      
      {state.errors.customName && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {state.errors.customName}
        </p>
      )}
      
      <p className="text-xs text-gray-500 text-right">
        {state.formData.customName?.length || 0}/{INPUT_LIMITS.LOCATION_NAME}
      </p>
    </div>
  )
}