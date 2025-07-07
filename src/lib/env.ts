/**
 * Environment Configuration
 * 개발/프로덕션 환경별 설정 자동 전환
 */

export const ENV = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // 현재 환경에 맞는 사이트 URL
  siteUrl: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://your-app.vercel.app',
    
  // 환경별 리디렉션 URL
  authCallback: process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000/auth/callback'
    : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-app.vercel.app'}/auth/callback`
}

// 환경 정보 로깅 (개발 모드에서만)
if (ENV.isDevelopment) {
  console.log('🚀 Development Mode Detected')
  console.log('📍 Site URL:', ENV.siteUrl)
  console.log('🔄 Auth Callback:', ENV.authCallback)
}