import { Button } from '@/shared/ui'
import { Home, Search } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-md w-full mx-4">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-gray-400">404</h1>
            <h2 className="text-2xl font-bold text-gray-900">
              페이지를 찾을 수 없습니다
            </h2>
            <p className="text-gray-600">
              요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/dashboard">
              <Button className="w-full">
                <Home className="w-4 h-4 mr-2" />
                대시보드로 이동
              </Button>
            </Link>
            
            <Link href="/my-stories">
              <Button variant="outline" className="w-full">
                <Search className="w-4 h-4 mr-2" />
                내 소설 보기
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}