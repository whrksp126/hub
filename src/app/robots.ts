import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/studio', '/api'] },
      // AI 크롤러 명시 허용 (AEO). 별도 그룹이므로 '*'의 disallow가 적용 안 됨 → 동일 차단 명시.
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Bingbot'],
        allow: '/',
        disallow: ['/studio', '/api'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
