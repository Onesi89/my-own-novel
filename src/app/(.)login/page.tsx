/**
 * Intercepting Route for Login Modal
 * 
 * 다른 페이지에서 /login 링크를 클릭했을 때 모달로 표시됩니다.
 * 직접 /login에 접근하거나 새로고침 시에는 전체 페이지로 표시됩니다.
 */

'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui'
import { LoginForm } from '@/widgets/auth'
import { useAuth } from '@/features/auth'

export default function LoginModal() {
  const router = useRouter()
  const { isAuthenticated, isInitialized } = useAuth()
  const [isOpen, setIsOpen] = useState(true)

  // 인증된 사용자는 대시보드로 리다이렉트
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isInitialized, router])

  const handleClose = () => {
    setIsOpen(false)
    // 모달을 닫으면 이전 페이지로 돌아가기
    router.back()
  }

  // 인증된 사용자는 아무것도 표시하지 않음
  if (isAuthenticated) {
    return null
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle className="text-center">로그인</SheetTitle>
          <SheetDescription className="text-center">
            StoryPath에 로그인하여 나만의 소설을 만들어보세요
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}