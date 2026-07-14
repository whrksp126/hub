import type { Metadata } from 'next'

// 사이트 전역 SEO 상수.
export const SITE_URL = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://hub.ghmate.com').replace(
  /\/$/,
  '',
)
// 공개 포트폴리오 URL prefix. 루트 네임스페이스와 충돌하지 않도록 한 단계 들여쓴다.
// 나중에 '/portfolio' 등으로 바꾸려면 이 한 줄만 고치면 전 구간에 반영된다.
export const PF_PREFIX = '/p'
// 포트폴리오 상대 경로 (예: pfPath('geonho', '/projects') → '/p/geonho/projects')
export function pfPath(username: string, sub = ''): string {
  return `${PF_PREFIX}/${username}${sub}`
}
// 포트폴리오 절대 URL (canonical/OG/JSON-LD/sitemap용)
export function pfUrl(username: string, sub = ''): string {
  return `${SITE_URL}${PF_PREFIX}/${username}${sub}`
}

export const SITE_NAME = 'HubGmate'
export const SITE_DESCRIPTION =
  'AI 에이전트가 저장소를 읽어 케이스 스터디를 쓰고 완성된 테마로 발행하는 개발자 포트폴리오 빌더 — REST·SDK·CLI·MCP 자동 발행.'
export const SITE_AUTHOR = '건호'
export const SITE_BUSINESS = '슬기로운 사업'
export const SITE_LOCALE = 'ko_KR'

type SeoInput = {
  title?: string
  description?: string
  path?: string
  image?: string
  type?: 'website' | 'article'
}

// 페이지별 메타/OG/Twitter 생성 공용 헬퍼.
export function buildMetadata({
  title,
  description,
  path = '/',
  image,
  type = 'website',
}: SeoInput): Metadata {
  const url = `${SITE_URL}${path}`
  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME
  const desc = description || SITE_DESCRIPTION

  // image를 명시하지 않으면 images 키 자체를 넣지 않는다 →
  // Next의 파일 규약(app/opengraph-image.tsx) 기본 카드가 자동 주입되도록.
  return {
    metadataBase: new URL(SITE_URL),
    title: fullTitle,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description: desc,
      url,
      siteName: SITE_NAME,
      type,
      locale: SITE_LOCALE,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: desc,
      ...(image ? { images: [image] } : {}),
    },
  }
}

// 포트폴리오 하위 페이지(목록/상세) 공용 메타 헬퍼.
// title은 루트 title.template로 ' — HubGmate'가 자동 접미된다.
// image 미지정 시 openGraph.images를 비워 기본 OG 카드가 주입되게 한다.
export function pfPageMetadata({
  username,
  sub = '',
  title,
  description,
  image,
  type = 'website',
}: {
  username: string
  sub?: string
  title: string
  description?: string
  image?: string
  type?: 'website' | 'article' | 'profile'
}): Metadata {
  const url = pfUrl(username, sub)
  const desc = description || SITE_DESCRIPTION
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: SITE_NAME,
      type,
      locale: SITE_LOCALE,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      ...(image ? { images: [image] } : {}),
    },
  }
}
