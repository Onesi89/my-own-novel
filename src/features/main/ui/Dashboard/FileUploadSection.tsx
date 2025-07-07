/**
 * File Upload Section Component
 * FSD: features/main/ui/Dashboard
 * 
 * 파일 업로드 섹션 (필요시 표시)
 */

'use client'

import React, { useRef } from 'react'
import { Upload, FileJson } from 'lucide-react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui'
import { useDashboard } from '../../context/DashboardContext'

export function FileUploadSection() {
  const { uploadGoogleTakeout, isUploadingFile, selectedDateRange } = useDashboard()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      await uploadGoogleTakeout(file)
    } catch (error) {
      console.error('File upload error:', error)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          구글 타임라인 파일 업로드
        </CardTitle>
        <CardDescription>
          구글 타임라인 JSON 파일을 업로드하여 위치 데이터를 가져옵니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <FileJson className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              구글 타임라인 JSON 파일을 선택해주세요
            </p>
            <Button 
              onClick={handleFileUpload}
              disabled={isUploadingFile}
              className="min-w-32"
            >
              {isUploadingFile ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  파일 선택
                </>
              )}
            </Button>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>• JSON 형식의 구글 타임라인 파일만 지원됩니다</p>
            <p>• 파일 크기는 최대 50MB까지 업로드 가능합니다</p>
            <p>• 업로드된 데이터는 안전하게 처리됩니다</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  )
}