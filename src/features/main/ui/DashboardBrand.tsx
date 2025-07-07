/**
 * Dashboard Brand Component
 * FSD: features/main/ui
 * 
 * 대시보드 브랜드 로고 섹션
 */

'use client'

import React from 'react'
import { MapPin } from 'lucide-react'

export function DashboardBrand() {
  return (
    <div className="flex items-center gap-2">
      <MapPin className="w-8 h-8 text-blue-600" />
      <span className="text-2xl font-bold text-gray-900">StoryPath</span>
    </div>
  )
}