/**
 * File Upload Section Component
 * FSD: features/story/ui
 * 
 * 구글 테이크아웃 파일 업로드 섹션
 */

'use client'

import React from 'react'
import { Upload, Download, Info } from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Button,
  Input,
  Label,
  Badge
} from '@/shared/ui'
import { useStoryCreation } from '../context/StoryCreationContext'

interface FileUploadSectionProps {
  isUploadingFile: boolean
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>
}

export function FileUploadSection({ 
  isUploadingFile, 
  onFileUpload 
}: FileUploadSectionProps) {
  const { state, dispatch } = useStoryCreation()
  
  return (
    <div className="space-y-6">
      {/* Google Takeout 안내 */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Download className="w-5 h-5" />
            Google 타임라인 데이터로 실제 경로 사용하기
          </CardTitle>
          <CardDescription className="text-blue-700">
            본인의 실제 이동 경로로 소설을 만들고 싶다면 Google Takeout을 이용해보세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <div className="font-medium text-blue-900">1. Google Takeout 방문</div>
              <p className="text-blue-700">takeout.google.com에서 위치 기록을 선택하세요.</p>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-blue-900">2. JSON 형식 다운로드</div>
              <p className="text-blue-700">Records.json 파일이 포함된 ZIP을 다운로드하세요.</p>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-blue-900">3. 파일 업로드</div>
              <p className="text-blue-700">대용량 파일은 아래에서 날짜 범위를 선택 후 업로드하세요.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 날짜 필터링 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            날짜 범위 필터링 (선택사항)
          </CardTitle>
          <CardDescription>
            대용량 파일(50MB+) 업로드 시 특정 기간만 추출하여 처리 속도를 향상시킵니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">시작 날짜</Label>
              <Input
                id="startDate"
                type="date"
                value={state.filterDates.start}
                onChange={(e) => 
                  dispatch({ 
                    type: 'SET_FILTER_DATES', 
                    payload: { ...state.filterDates, start: e.target.value } 
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">종료 날짜</Label>
              <Input
                id="endDate"
                type="date"
                value={state.filterDates.end}
                onChange={(e) => 
                  dispatch({ 
                    type: 'SET_FILTER_DATES', 
                    payload: { ...state.filterDates, end: e.target.value } 
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 파일 업로드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Google Takeout 파일 업로드
          </CardTitle>
          <CardDescription>
            ZIP 파일 또는 Records.json 파일을 업로드하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label 
                htmlFor="file-upload" 
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isUploadingFile ? (
                    <>
                      <div className="w-8 h-8 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600 mb-2"></div>
                      <p className="text-sm text-gray-500">파일 업로드 중...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">클릭하여 업로드</span> 또는 드래그 앤 드롭
                      </p>
                      <p className="text-xs text-gray-500">ZIP, JSON 파일 지원</p>
                    </>
                  )}
                </div>
                <input 
                  id="file-upload" 
                  type="file" 
                  className="hidden" 
                  accept=".zip,.json"
                  onChange={onFileUpload}
                  disabled={isUploadingFile}
                />
              </label>
            </div>
            
            {(state.filterDates.start || state.filterDates.end) && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  필터링 활성화: {state.filterDates.start} ~ {state.filterDates.end}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}