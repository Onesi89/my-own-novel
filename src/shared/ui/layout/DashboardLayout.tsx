/**
 * Dashboard Layout Component
 * FSD: shared/ui/layout
 * 
 * 대시보드 공통 레이아웃 (헤더 + 콘텐츠)
 */

'use client'

import React, { ReactNode } from 'react'

interface DashboardLayoutProps {
  children: ReactNode
  className?: string
}

export function DashboardLayout({ children, className = "" }: DashboardLayoutProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 ${className}`}>
      {children}
    </div>
  )
}

interface DashboardHeaderProps {
  children: ReactNode
  className?: string
}

export function DashboardHeader({ children, className = "" }: DashboardHeaderProps) {
  return (
    <header className={`bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {children}
        </div>
      </div>
    </header>
  )
}

interface DashboardContentProps {
  children: ReactNode
  className?: string
}

export function DashboardContent({ children, className = "" }: DashboardContentProps) {
  return (
    <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      <div className="space-y-8">
        {children}
      </div>
    </main>
  )
}