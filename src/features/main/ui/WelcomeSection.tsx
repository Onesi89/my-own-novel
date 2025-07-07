/**
 * Welcome Section Component
 * FSD: features/main/ui
 * 
 * 환영 메시지 섹션
 */

'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

interface WelcomeSectionProps {
  user: User | null
}

export function WelcomeSection({ user }: WelcomeSectionProps) {
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '사용자'

  return (
    <div className="text-center space-y-4">
      <div className="flex justify-center">
        <div className="p-4 bg-blue-100 rounded-full">
          <Sparkles className="w-10 h-10 text-blue-600" />
        </div>
      </div>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
        안녕하세요, {userName}님!
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        구글 타임라인의 이동 경로를 바탕으로 나만의 특별한 소설을 만들어보세요.
      </p>
    </div>
  )
}