/**
 * Recent Activity Component
 * FSD: features/main/ui/Dashboard
 * 
 * 최근 활동 내역 표시
 */

'use client'

import React from 'react'
import { Activity, MapPin, FileText, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui'
import { useDashboard } from '../../context/DashboardContext'

interface RecentActivityProps {
  hasTimelineData: boolean
  timelineDataLength: number
  hasGeneratedStory: boolean
}

export function RecentActivity({ 
  hasTimelineData, 
  timelineDataLength, 
  hasGeneratedStory 
}: RecentActivityProps) {
  const { lastSyncTime } = useDashboard()

  // 활동 항목들
  const activities = [
    {
      icon: MapPin,
      title: '타임라인 데이터',
      description: hasTimelineData 
        ? `${timelineDataLength}개의 위치 데이터가 로드되었습니다`
        : '타임라인 데이터가 없습니다',
      time: lastSyncTime ? `마지막 동기화: ${lastSyncTime.toLocaleString()}` : '동기화 기록 없음',
      status: hasTimelineData ? 'success' : 'pending'
    },
    {
      icon: FileText,
      title: '소설 생성',
      description: hasGeneratedStory 
        ? '최근에 새로운 소설이 생성되었습니다'
        : '아직 생성된 소설이 없습니다',
      time: hasGeneratedStory ? '최근 생성됨' : '생성 기록 없음',
      status: hasGeneratedStory ? 'success' : 'pending'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100'
      case 'pending':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-blue-600 bg-blue-100'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          최근 활동
        </CardTitle>
        <CardDescription>
          계정의 최근 활동 내역을 확인하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const IconComponent = activity.icon
            return (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <div className={`p-2 rounded-full ${getStatusColor(activity.status)}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <p className="text-xs text-gray-400">
                      {activity.time}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}