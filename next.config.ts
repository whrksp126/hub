import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  // Docker standalone 산출물(약한 서버 경량 배포)
  output: 'standalone',
  // better-sqlite3는 네이티브 모듈 → 서버 번들에서 제외
  serverExternalPackages: ['better-sqlite3', 'playwright-core'],
  // standalone 산출물에 마이그레이션 폴더 포함(컨테이너 시작 시 migrate)
  outputFileTracingIncludes: {
    '/**': ['./drizzle/**'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'objectstore.ghmate.com',
      },
    ],
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default nextConfig
