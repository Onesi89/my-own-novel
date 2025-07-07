'use client'

import { useEffect } from 'react'
import { Button } from '@/shared/ui'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-md w-full mx-4">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-red-100 rounded-full">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              문제가 발생했습니다
            </h1>
            <p className="text-gray-600">
              예상치 못한 오류가 발생했습니다. 다시 시도해 주세요.
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              다시 시도
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard'}
              className="w-full"
            >
              대시보드로 이동
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="text-left bg-gray-100 p-4 rounded-lg text-sm">
              <summary className="cursor-pointer font-medium">
                개발자 정보
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-700">
                {error.message}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}