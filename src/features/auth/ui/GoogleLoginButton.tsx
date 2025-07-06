/**
 * Google Login Button Component
 * FSD: features/auth/ui
 * 
 * 구글 OAuth 로그인 버튼 컴포넌트
 * cursor rules 준수: 접근성, 반응형 디자인, 상태 관리 통합
 */

'use client'

import React from 'react'
import { Button } from '@/shared/ui'
import { useAuth } from '../model'
import { Loader2 } from 'lucide-react'

interface GoogleLoginButtonProps {
  /**
   * 추가 CSS 클래스
   */
  className?: string
  
  /**
   * 버튼 크기
   */
  size?: 'default' | 'sm' | 'lg'
  
  /**
   * 커스텀 클릭 핸들러 (선택사항)
   * 제공되지 않으면 useAuth의 loginWithGoogle 사용
   */
  onClick?: () => void
  
  /**
   * 버튼 스타일 variant
   */
  variant?: 'default' | 'outline' | 'secondary'
}

export function GoogleLoginButton({ 
  className,
  size = 'lg',
  onClick,
  variant = 'outline'
}: GoogleLoginButtonProps) {
  const { loginWithGoogle, isLoading, error } = useAuth()
  
  const handleClick = onClick || loginWithGoogle
  
  // 로딩 상태나 에러 상태에 따른 버튼 텍스트
  const getButtonText = () => {
    if (isLoading) return '로그인 중...'
    if (error) return '다시 시도하기'
    return 'Google로 계속하기'
  }
  
  // 접근성을 위한 ARIA 레이블
  const getAriaLabel = () => {
    if (isLoading) return '구글 계정으로 로그인 진행 중'
    if (error) return '구글 로그인 다시 시도'
    return '구글 계정으로 로그인'
  }
  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      size={size}
      variant={variant}
      className={`w-full transition-all duration-200 ${
        error 
          ? 'border-red-300 hover:border-red-400 text-red-700' 
          : 'hover:shadow-md'
      } ${className}`}
      aria-label={getAriaLabel()}
      aria-busy={isLoading}
    >
      <div className="flex items-center justify-center">
        {isLoading ? (
          <Loader2 className="w-5 h-5 mr-3 animate-spin" />
        ) : (
          <GoogleIcon className="w-5 h-5 mr-3" />
        )}
        <span className="font-medium">
          {getButtonText()}
        </span>
      </div>
    </Button>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path 
        fill="#4285F4" 
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path 
        fill="#34A853" 
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path 
        fill="#FBBC05" 
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path 
        fill="#EA4335" 
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}