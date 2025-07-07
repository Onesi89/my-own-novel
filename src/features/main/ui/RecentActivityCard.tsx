/**
 * Recent Activity Card Component
 * FSD: features/main/ui
 * 
 * 최근 활동 표시 카드
 */

'use client'

import React from 'react'
import { Clock, User, Download, Sparkles } from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Badge
} from '@/shared/ui'

interface ActivityItem {
  id: string
  title: string
  description: string
  status: 'completed' | 'pending'
  icon: 'user' | 'download' | 'sparkles'
}

interface RecentActivityCardProps {
  hasTimelineData: boolean
  timelineDataLength: number
  hasGeneratedStory: boolean
}

export function RecentActivityCard({ 
  hasTimelineData, 
  timelineDataLength, 
  hasGeneratedStory 
}: RecentActivityCardProps) {
  const activities: ActivityItem[] = [
    {
      id: 'account',
      title: '계정 설정 완료',
      description: '구글 계정으로 로그인했습니다',
      status: 'completed',
      icon: 'user'
    },
    {
      id: 'timeline',
      title: '타임라인 동기화',
      description: hasTimelineData 
        ? `${timelineDataLength}개의 위치 데이터를 가져왔습니다`
        : '구글 타임라인 데이터를 가져옵니다',
      status: hasTimelineData ? 'completed' : 'pending',
      icon: 'download'
    },
    {
      id: 'story',
      title: '소설 생성',
      description: hasGeneratedStory
        ? '이동 경로 기반 소설이 생성되었습니다'
        : 'AI가 나만의 이야기를 만들어줍니다',
      status: hasGeneratedStory ? 'completed' : 'pending',
      icon: 'sparkles'
    }
  ]

  const getIcon = (iconType: ActivityItem['icon']) => {
    const iconProps = { className: "w-4 h-4" }
    switch (iconType) {
      case 'user': return <User {...iconProps} className="w-4 h-4 text-blue-600" />
      case 'download': return <Download {...iconProps} className="w-4 h-4 text-green-600" />
      case 'sparkles': return <Sparkles {...iconProps} className="w-4 h-4 text-purple-600" />
    }
  }

  const getBgColor = (iconType: ActivityItem['icon']) => {
    switch (iconType) {
      case 'user': return 'bg-blue-100'
      case 'download': return 'bg-green-100'  
      case 'sparkles': return 'bg-purple-100'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          최근 활동
        </CardTitle>
        <CardDescription>
          최근 생성한 소설과 동기화 기록을 확인하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div 
              key={activity.id}
              className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg ${
                activity.status === 'pending' ? 'opacity-60' : ''
              }`}
            >
              <div className={`p-2 ${getBgColor(activity.icon)} rounded-full`}>
                {getIcon(activity.icon)}
              </div>
              <div className="flex-1">
                <p className="font-medium">{activity.title}</p>
                <p className="text-sm text-gray-500">{activity.description}</p>
              </div>
              <Badge variant={activity.status === 'completed' ? "default" : "outline"}>
                {activity.status === 'completed' ? "완료" : "대기중"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}