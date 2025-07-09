/**
 * FinishRedirect - 완료 페이지로 리다이렉트하는 클라이언트 컴포넌트
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function FinishRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/create-story/finish')
  }, [router])

  return null
}