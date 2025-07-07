/**
 * Dashboard Header Component
 * FSD: features/main/ui/Dashboard
 * 
 * 대시보드 헤더 - 로고와 사용자 메뉴
 */

'use client'

import React from 'react'
import { MapPin, Settings, LogOut } from 'lucide-react'
import { Button, Avatar, AvatarFallback, AvatarImage, Separator } from '@/shared/ui'
import { useDashboard } from '../../context/DashboardContext'

export function DashboardHeader() {
  const { user, logout } = useDashboard()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <MapPin className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">StoryPath</span>
          </div>

          {/* User Menu */}
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
        </div>
      </div>
    </header>
  )
}