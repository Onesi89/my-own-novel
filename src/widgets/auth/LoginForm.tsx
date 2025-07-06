/**
 * Login Form Widget
 * FSD: widgets/auth
 * 
 * 로그인 폼 위젯 - 구글 OAuth 로그인 인터페이스
 * cursor rules 준수: 위젯 구성, 사용자 경험, 접근성
 */

'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui'
import { GoogleLoginButton } from '@/features/auth/ui/GoogleLoginButton'
import { useAuth } from '@/features/auth/model'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { AlertCircle } from 'lucide-react'

export function LoginForm() {
  const { isLoading, error, isInitialized } = useAuth()

  // 초기화되지 않은 상태에서는 로딩 표시
  if (!isInitialized) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2 text-gray-600">
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
            <span>로그인 시스템 초기화 중...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg max-w-md mx-auto">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          StoryPath에 오신 것을 환영합니다
        </CardTitle>
        <CardDescription className="text-base">
          구글 타임라인으로 나만의 소설을 만들어보세요
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 에러 메시지 표시 */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message?.includes('provider is not enabled') ? (
                <div className="space-y-2">
                  <p className="font-medium">구글 로그인 설정이 필요합니다</p>
                  <div className="text-sm space-y-1">
                    <p>1. Supabase 대시보드 → Authentication → Providers</p>
                    <p>2. Google 공급자 활성화</p>
                    <p>3. 클라이언트 ID/Secret 입력</p>
                  </div>
                </div>
              ) : (
                error.message || '로그인 중 오류가 발생했습니다. 다시 시도해 주세요.'
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {/* 구글 로그인 버튼 - onClick prop 제거 (내부에서 useAuth 사용) */}
        <GoogleLoginButton />
        
        {/* 기능 소개 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
          <h3 className="font-medium text-blue-900 dark:text-blue-100">🚀 로그인하면 이런 기능을 사용할 수 있어요:</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• 구글 타임라인 데이터로 자동 소설 생성</li>
            <li>• AI가 제시하는 선택지로 스토리 커스터마이징</li>
            <li>• 다양한 장르의 개인화된 소설 생성</li>
          </ul>
        </div>
        
        {/* 약관 동의 */}
        <div className="text-xs text-center text-gray-500 dark:text-gray-400 leading-relaxed">
          로그인하면{' '}
          <button 
            className="underline hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            onClick={() => {
              // TODO: 서비스 약관 모달 또는 페이지 열기
              console.log('서비스 약관 클릭')
            }}
          >
            서비스 약관
          </button>
          {' '}및{' '}
          <button 
            className="underline hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            onClick={() => {
              // TODO: 개인정보처리방침 모달 또는 페이지 열기
              console.log('개인정보처리방침 클릭')
            }}
          >
            개인정보처리방침
          </button>
          에 동의하는 것으로 간주됩니다.
        </div>
        
        {/* 보안 안내 */}
        <div className="text-xs text-center text-gray-400 dark:text-gray-500">
          🔒 구글 OAuth 2.0을 통한 안전한 로그인
        </div>
      </CardContent>
    </Card>
  )
}