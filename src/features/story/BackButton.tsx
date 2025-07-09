/**
 * BackButton - 뒤로가기 버튼 클라이언트 컴포넌트
 */

'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/shared/ui'
import { ArrowLeft } from 'lucide-react'

export function BackButton() {
  const router = useRouter()

  const handleBack = () => {
    router.replace('/create-story')
  }

  return (
    <Button
      onClick={handleBack}
      className="absolute top-8 left-8 flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors z-10"
      variant="ghost"
    >
      <ArrowLeft size={20} />
      <span>처음으로</span>
    </Button>
  )
}