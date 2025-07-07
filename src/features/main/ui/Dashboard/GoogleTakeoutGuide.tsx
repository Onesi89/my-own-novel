/**
 * Google Takeout Guide Component
 * FSD: features/main/ui/Dashboard
 * 
 * 구글 타임라인 내보내기 안내
 */

'use client'

import React from 'react'
import { Download, Calendar, Upload } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui'

export function GoogleTakeoutGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          구글 타임라인 내보내기 방법
        </CardTitle>
        <CardDescription>
          구글 타임라인 데이터를 내보내서 나만의 소설을 만들어보세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
              1
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Google Takeout 접속</h4>
              <p className="text-sm text-gray-600 mt-1">
                <a 
                  href="https://takeout.google.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  takeout.google.com
                </a>
                에 접속하여 로그인합니다.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
              2
            </div>
            <div>
              <h4 className="font-medium text-gray-900">지도 데이터 선택</h4>
              <p className="text-sm text-gray-600 mt-1">
                '선택 해제' 후 '지도(사용자 장소)' 항목만 선택합니다.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
              3
            </div>
            <div>
              <h4 className="font-medium text-gray-900">내보내기 및 업로드</h4>
              <p className="text-sm text-gray-600 mt-1">
                JSON 형식으로 내보낸 파일을 여기에 업로드합니다.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}