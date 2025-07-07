/**
 * Place Category Selector Component
 * FSD: features/map/ui/PlaceForm
 * 
 * 장소 카테고리 선택 컴포넌트
 */

'use client'

import React from 'react'
import { 
  Home, 
  Briefcase, 
  ShoppingCart,
  Coffee,
  Car,
  Gamepad2,
  MoreHorizontal,
  AlertCircle
} from 'lucide-react'
import { Button, Label } from '@/shared/ui'
import { usePlaceForm, PlaceInfo } from './PlaceFormProvider'

const PLACE_CATEGORIES = [
  { id: 'home', label: '집', icon: Home, color: 'bg-blue-100 text-blue-700' },
  { id: 'work', label: '직장', icon: Briefcase, color: 'bg-green-100 text-green-700' },
  { id: 'dining', label: '식당', icon: Coffee, color: 'bg-orange-100 text-orange-700' },
  { id: 'shopping', label: '쇼핑', icon: ShoppingCart, color: 'bg-purple-100 text-purple-700' },
  { id: 'leisure', label: '여가', icon: Gamepad2, color: 'bg-pink-100 text-pink-700' },
  { id: 'transport', label: '교통', icon: Car, color: 'bg-gray-100 text-gray-700' },
  { id: 'other', label: '기타', icon: MoreHorizontal, color: 'bg-slate-100 text-slate-700' }
] as const

export function PlaceCategorySelector() {
  const { state, updateField, clearError } = usePlaceForm()

  const handleCategorySelect = (categoryId: PlaceInfo['category']) => {
    updateField('category', categoryId)
    clearError('category')
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        장소 종류 *
      </Label>
      
      <div className="grid grid-cols-2 gap-2">
        {PLACE_CATEGORIES.map((category) => {
          const Icon = category.icon
          const isSelected = state.formData.category === category.id
          
          return (
            <Button
              key={category.id}
              variant={isSelected ? 'default' : 'outline'}
              className={`h-12 flex items-center gap-2 ${
                isSelected ? '' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleCategorySelect(category.id)}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{category.label}</span>
            </Button>
          )
        })}
      </div>
      
      {state.errors.category && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {state.errors.category}
        </p>
      )}
    </div>
  )
}