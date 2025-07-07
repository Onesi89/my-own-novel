/**
 * Place Privacy Settings Component
 * FSD: features/map/ui/PlaceForm
 * 
 * 개인정보 및 프라이버시 설정
 */

'use client'

import React from 'react'
import { Shield, Info } from 'lucide-react'
import { Checkbox, Label } from '@/shared/ui'
import { usePlaceForm } from './PlaceFormProvider'

export function PlacePrivacySettings() {
  const { state, updateField } = usePlaceForm()

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium flex items-center gap-1">
        <Shield className="w-4 h-4" />
        개인정보 설정
      </Label>
      
      <div className="space-y-3">
        {/* 비공개 설정 */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <Checkbox
            id="isPrivate"
            checked={state.formData.isPrivate || false}
            onCheckedChange={(checked) => updateField('isPrivate', checked)}
          />
          <div className="space-y-1">
            <Label 
              htmlFor="isPrivate" 
              className="text-sm font-medium cursor-pointer"
            >
              이 장소를 비공개로 설정
            </Label>
            <p className="text-xs text-gray-600">
              체크하면 이 장소의 정보가 소설 생성 시 상세히 표시되지 않습니다.
            </p>
          </div>
        </div>
        
        {/* 개인정보 안내 */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-1">개인정보 보호 안내</p>
            <ul className="space-y-0.5 text-blue-700">
              <li>• 입력된 정보는 소설 생성 목적으로만 사용됩니다</li>
              <li>• 정확한 주소나 개인정보는 저장되지 않습니다</li>
              <li>• 언제든지 데이터를 삭제할 수 있습니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}