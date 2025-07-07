/**
 * Place Time Info Component
 * FSD: features/map/ui/PlaceForm
 * 
 * 방문 시간 및 머문 시간 입력 필드
 */

'use client'

import React from 'react'
import { Clock, Timer } from 'lucide-react'
import { Input, Label } from '@/shared/ui'
import { usePlaceForm } from './PlaceFormProvider'

const DURATION_OPTIONS = [
  { value: 15, label: '15분' },
  { value: 30, label: '30분' },
  { value: 60, label: '1시간' },
  { value: 120, label: '2시간' },
  { value: 180, label: '3시간' },
  { value: 300, label: '5시간' },
  { value: 480, label: '8시간' }
]

export function PlaceTimeInfo() {
  const { state, updateField } = usePlaceForm()

  const handleDurationSelect = (duration: number) => {
    updateField('duration', duration)
  }

  return (
    <div className="space-y-4">
      {/* 방문 시간 */}
      <div className="space-y-2">
        <Label htmlFor="visitTime" className="text-sm font-medium flex items-center gap-1">
          <Clock className="w-4 h-4" />
          방문 시간
        </Label>
        <Input
          id="visitTime"
          type="datetime-local"
          value={state.formData.visitTime || ''}
          onChange={(e) => updateField('visitTime', e.target.value)}
          className="text-sm"
        />
      </div>

      {/* 머문 시간 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-1">
          <Timer className="w-4 h-4" />
          머문 시간
        </Label>
        
        {/* 빠른 선택 버튼들 */}
        <div className="grid grid-cols-4 gap-1">
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`px-2 py-1 text-xs border rounded transition-colors ${
                state.formData.duration === option.value
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
              }`}
              onClick={() => handleDurationSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        {/* 직접 입력 */}
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={state.formData.duration || ''}
            onChange={(e) => updateField('duration', parseInt(e.target.value) || 0)}
            placeholder="0"
            min="1"
            max="1440"
            className="text-sm"
          />
          <span className="text-sm text-gray-500">분</span>
        </div>
      </div>
    </div>
  )
}