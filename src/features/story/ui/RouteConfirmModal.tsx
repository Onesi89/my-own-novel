/**
 * Route Confirm Modal Component
 * FSD: features/story/ui
 * 
 * 선택된 경로 확인 및 다음 단계 진행 모달
 */

'use client'

import React from 'react'
import { MapPin, CheckCircle, Edit, Sparkles } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Button,
  Card,
  CardContent,
  Badge,
  Separator
} from '@/shared/ui'
import { useStoryCreation } from '../context/StoryCreationContext'

interface RouteConfirmModalProps {
  onEdit: () => void
  onProceedToStorySetup: () => void
}

export function RouteConfirmModal({ 
  onEdit, 
  onProceedToStorySetup 
}: RouteConfirmModalProps) {
  const { state, closeModal } = useStoryCreation()
  
  const handleClose = () => {
    closeModal('isRouteConfirmOpen')
  }
  
  return (
    <Sheet 
      open={state.modals.isRouteConfirmOpen} 
      onOpenChange={handleClose}
    >
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            선택된 경로 확인
          </SheetTitle>
          <SheetDescription>
            {state.selectedRoutes.length}개의 장소가 선택되었습니다. 
            소설 생성을 진행하거나 경로를 수정할 수 있습니다.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* 선택된 경로 목록 */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">선택된 장소들</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {state.selectedRoutes.map((route, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-gray-900 truncate">
                        {route.customInfo?.customName || route.address || '장소'}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {route.customInfo?.description || '설명 없음'}
                      </p>
                      {route.timestamp && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(route.timestamp).toLocaleString('ko-KR')}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* 다음 단계 안내 */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">다음 단계</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>소설 장르와 스타일을 선택합니다</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span>각 장소에서 일어날 상황을 설정합니다</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>AI가 개인화된 소설을 생성합니다</span>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onEdit}
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-2" />
              경로 수정
            </Button>
            <Button
              onClick={onProceedToStorySetup}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              소설 생성 시작
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}