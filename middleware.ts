/**
 * Next.js Middleware for Authentication-based Routing
 * 
 * 인증 상태에 따라 라우팅을 제어합니다:
 * - 인증되지 않은 사용자: /login으로 리다이렉트
 * - 인증된 사용자: /dashboard로 리다이렉트
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// 보호된 경로들
const protectedRoutes = ['/dashboard', '/create-story', '/my-stories']

// 공개 경로들 (인증이 필요하지 않은 경로)
const publicRoutes = ['/login', '/auth/callback']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  try {
    // 현재 세션 확인
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const isAuthenticated = !!session
    const { pathname } = request.nextUrl

    console.log('🔍 Middleware check:', {
      pathname,
      isAuthenticated,
      session: session ? 'exists' : 'none'
    })

    // 루트 경로 처리
    if (pathname === '/') {
      if (isAuthenticated) {
        console.log('✅ Authenticated user accessing root, redirecting to /dashboard')
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } else {
        console.log('❌ Unauthenticated user accessing root, redirecting to /login')
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    // 보호된 경로에 대한 인증 체크
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
      if (!isAuthenticated) {
        console.log('❌ Unauthenticated user accessing protected route, redirecting to /login')
        return NextResponse.redirect(new URL('/login', request.url))
      }
      console.log('✅ Authenticated user accessing protected route')
    }

    // 공개 경로에서 이미 인증된 사용자 처리
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      if (isAuthenticated && pathname === '/login') {
        console.log('✅ Authenticated user accessing login page, redirecting to /dashboard')
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    return response
  } catch (error) {
    console.error('❌ Middleware error:', error)
    // 오류 발생 시 로그인 페이지로 리다이렉트
    if (request.nextUrl.pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }
}

export const config = {
  /*
   * matcher를 사용하여 middleware가 실행될 경로를 설정
   * - API 경로, _next/static, _next/image, favicon.ico는 제외
   */
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}