/**
 * User Menu Component
 * FSD: widgets/main
 * 
 * 헤더의 사용자 메뉴 처리
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { 
  Settings, 
  LogOut 
} from 'lucide-react'
import { 
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Separator
} from '@/shared/ui'
import { useAuth } from '@/features/auth'

export function UserMenu() {
  const router = useRouter()
  const { logout, user } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      // 로그아웃 성공 시 로그인 페이지로 리다이렉트
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Avatar className="w-8 h-8">
          <AvatarImage 
            src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture} 
            alt={user?.user_metadata?.full_name || user?.email} 
          />
          <AvatarFallback>
            {(user?.user_metadata?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-gray-900">
            {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
          </p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
      </div>
      
      <Separator orientation="vertical" className="h-6" />
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="hidden sm:flex">
          <Settings className="w-4 h-4 mr-2" />
          설정
        </Button>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          로그아웃
        </Button>
      </div>
    </div>
  )
}