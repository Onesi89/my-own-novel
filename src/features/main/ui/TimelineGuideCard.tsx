/**
 * Timeline Guide Card Component
 * FSD: features/main/ui
 * 
 * 구글 타임라인 사용 안내 카드
 */

'use client'

import React from 'react'
import { Download } from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
} from '@/shared/ui'

export function TimelineGuideCard() {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Download className="w-5 h-5" />
          Google 타임라인으로 실제 위치 데이터 사용하기
        </CardTitle>
        <CardDescription className="text-blue-700">
          본인의 실제 이동 경로로 소설을 만들고 싶다면 Google 타임라인을 이용해보세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <div className="font-medium text-blue-900">
              1. 모바일 안드로이드 설정 &gt; 위치 &gt; 위치 서비스 이동
            </div>
            <p className="text-blue-700">
              모바일에서 타임라인을 사용 중이시라면 타임라인 데이터를 요청하세요.
            </p>
          </div>
          <div className="space-y-2">
            <div className="font-medium text-blue-900">
              2. 타임라인 &gt; 타임라인 데이터 내보내기
            </div>
            <p className="text-blue-700">
              JSON 형식으로 다운로드하면 semanticSegments가 포함된 파일을 받게 됩니다
            </p>
          </div>
          <div className="space-y-2">
            <div className="font-medium text-blue-900">
              3. 날짜 필터링 업로드
            </div>
            <p className="text-blue-700">
              대용량 파일은 위에서 날짜 범위를 선택 후 업로드하세요
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}