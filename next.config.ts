import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: '**',
      },
    ],
  },
  // Turbopack은 tsconfig.json의 paths를 자동으로 사용하므로 webpack 설정 불필요
}

export default nextConfig
