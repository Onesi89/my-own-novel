/**
 * Date Range Selector Component
 * FSD: features/main/ui/Dashboard
 * 
 * 날짜 범위 선택 버튼들
 */

'use client'

import React from 'react'
import { Calendar } from 'lucide-react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui'
import { useDashboard } from '../../context/DashboardContext'

interface DateRangeSelectorProps {
  selectedDateRange: any
  onRangeChange: (range: any) => void
  getDateRangeLabel: (range: any) => string
}

export function DateRangeSelector({ 
  selectedDateRange, 
  onRangeChange, 
  getDateRangeLabel 
}: DateRangeSelectorProps) {
  const { syncTimelineData, isLoadingTimeline } = useDashboard()

  const dateRanges = [
    { label: '최근 1주일', value: 'week' },
    { label: '최근 1개월', value: 'month' },
    { label: '최근 3개월', value: 'quarter' },
    { label: '최근 6개월', value: 'half-year' },
    { label: '최근 1년', value: 'year' }
  ]

  const handleRangeChange = (range: any) => {
    onRangeChange(range)
  }

  const handleSyncData = async () => {
    try {
      await syncTimelineData()
    } catch (error) {
      console.error('Timeline sync error:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          타임라인 기간 설정
        </CardTitle>
        <CardDescription>
          현재 선택된 기간: {getDateRangeLabel(selectedDateRange)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {dateRanges.map((range) => (
              <Button
                key={range.value}
                variant={selectedDateRange?.value === range.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleRangeChange(range)}
                className="w-full"
              >
                {range.label}
              </Button>
            ))}
          </div>
          
          <div className="flex justify-center">
            <Button 
              onClick={handleSyncData}
              disabled={isLoadingTimeline}
              className="min-w-32"
            >
              {isLoadingTimeline ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                  동기화 중...
                </>
              ) : (
                '타임라인 데이터 동기화'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}