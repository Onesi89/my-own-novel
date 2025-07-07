/**
 * Date Range Selector Component
 * FSD: features/main/ui
 * 
 * 소설 생성 기간 선택 컴포넌트
 */

'use client'

import React from 'react'
import { Calendar } from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Button
} from '@/shared/ui'

type DateRangeType = 'today' | 'yesterday' | 'week' | 'month' | 'custom'

interface DateRangeSelectorProps {
  selectedRange: DateRangeType
  onRangeChange: (range: DateRangeType) => void
  getRangeLabel: (range: DateRangeType) => string
}

export function DateRangeSelector({ 
  selectedRange, 
  onRangeChange, 
  getRangeLabel 
}: DateRangeSelectorProps) {
  const ranges: DateRangeType[] = ['today', 'yesterday', 'week', 'month', 'custom']

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          소설 생성 기간 선택
        </CardTitle>
        <CardDescription>
          어떤 기간의 이동 경로로 소설을 만들까요?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {ranges.map((range) => (
            <Button
              key={range}
              variant={selectedRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => onRangeChange(range)}
            >
              {getRangeLabel(range)}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}