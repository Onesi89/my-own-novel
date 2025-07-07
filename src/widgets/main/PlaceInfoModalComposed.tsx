/**
 * Place Info Modal Composed Component
 * FSD: widgets/main
 * 
 * Component Composition Pattern이 적용된 장소 정보 모달
 * 기존 496줄에서 약 120줄로 단순화
 */

'use client'

import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/shared/ui'
import {
  PlaceFormProvider,
  PlaceBasicInfo,
  PlaceCategorySelector,
  PlaceDescription,
  PlaceStoryHint,
  PlaceTimeInfo,
  PlacePrivacySettings,
  PlaceFormActions,
  usePlaceForm,
  type PlaceInfo,
  type TimelineLocation
} from '@/features/map/ui/PlaceForm'

interface PlaceInfoModalComposedProps {
  isOpen: boolean
  onClose: () => void
  onSave: (placeInfo: PlaceInfo) => void
  location?: TimelineLocation | null
  initialData?: PlaceInfo
  isLoading?: boolean
}

// 내부 모달 콘텐츠 컴포넌트 (PlaceFormProvider 내부에서 사용)
function PlaceInfoModalContent({ onClose, onSave, isLoading }: {
  onClose: () => void
  onSave: (placeInfo: PlaceInfo) => void
  isLoading?: boolean
}) {
  const { state } = usePlaceForm()

  const handleSave = () => {
    onSave(state.formData)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <h2 className="text-lg font-semibold">장소 정보 입력</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Form Content */}
      <div className="space-y-6">
        {/* 기본 정보 */}
        <PlaceBasicInfo />
        
        {/* 카테고리 선택 */}
        <PlaceCategorySelector />
        
        {/* 설명 */}
        <PlaceDescription />
        
        {/* 스토리 힌트 */}
        <PlaceStoryHint />
        
        {/* 시간 정보 */}
        <PlaceTimeInfo />
        
        {/* 개인정보 설정 */}
        <PlacePrivacySettings />
      </div>

      {/* Actions */}
      <PlaceFormActions
        onSave={handleSave}
        onCancel={onClose}
        isLoading={isLoading}
        saveButtonText="장소 저장"
        cancelButtonText="취소"
      />
    </div>
  )
}

export function PlaceInfoModalComposed({
  isOpen,
  onClose,
  onSave,
  location,
  initialData,
  isLoading = false
}: PlaceInfoModalComposedProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <PlaceFormProvider
            initialData={initialData}
            location={location}
          >
            <PlaceInfoModalContent
              onClose={onClose}
              onSave={onSave}
              isLoading={isLoading}
            />
          </PlaceFormProvider>
        </div>
      </div>
    </div>
  )
}