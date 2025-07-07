/**
 * Place Form Actions Component
 * FSD: features/map/ui/PlaceForm
 * 
 * 폼 액션 버튼들 (저장, 취소)
 */

'use client'

import React from 'react'
import { Save, X, Loader2 } from 'lucide-react'
import { Button } from '@/shared/ui'
import { usePlaceForm } from './PlaceFormProvider'

interface PlaceFormActionsProps {
  onSave?: () => void
  onCancel?: () => void
  isLoading?: boolean
  saveButtonText?: string
  cancelButtonText?: string
}

export function PlaceFormActions({
  onSave,
  onCancel,
  isLoading = false,
  saveButtonText = '저장',
  cancelButtonText = '취소'
}: PlaceFormActionsProps) {
  const { validateForm } = usePlaceForm()

  const handleSave = () => {
    if (validateForm()) {
      onSave?.()
    }
  }

  return (
    <div className="flex gap-3 pt-4 border-t">
      {/* 취소 버튼 */}
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isLoading}
        className="flex-1 flex items-center gap-2"
      >
        <X className="w-4 h-4" />
        {cancelButtonText}
      </Button>

      {/* 저장 버튼 */}
      <Button
        type="button"
        onClick={handleSave}
        disabled={isLoading}
        className="flex-1 flex items-center gap-2"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {isLoading ? '저장 중...' : saveButtonText}
      </Button>
    </div>
  )
}