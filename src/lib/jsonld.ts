import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, pfUrl } from './seo'

// JSON-LD 구조화 데이터 (AEO/SEO). 페이지에서 <JsonLd data={...} /> 로 삽입.

export function personJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
  }
}

// ── 포트폴리오 ────────────────────────────────────────────────────────

type ProfileLd = {
  username: string
  name: string
  title?: string | null
  tagline?: string | null
  email?: string | null
  github?: string | null
  image?: string | null
  skills?: string[]
}

// 포트폴리오 메인 = ProfilePage + Person.
export function profilePageJsonLd(p: ProfileLd) {
  const url = pfUrl(p.username)
  const sameAs = [p.github ? `https://github.com/${p.github.replace(/^.*github\.com\//, '')}` : null].filter(
    Boolean,
  ) as string[]
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url,
    mainEntity: {
      '@type': 'Person',
      name: p.name,
      url,
      ...(p.title ? { jobTitle: p.title } : {}),
      ...(p.tagline ? { description: p.tagline } : {}),
      ...(p.email ? { email: `mailto:${p.email}` } : {}),
      ...(p.image ? { image: p.image } : {}),
      ...(sameAs.length ? { sameAs } : {}),
      ...(p.skills?.length ? { knowsAbout: p.skills } : {}),
    },
  }
}

type ProjectLd = {
  username: string
  slug: string
  title: string
  summary?: string | null
  image?: string | null
  authorName: string
  stack?: string[] | null
  url?: string | null
}

// 프로젝트 상세 = CreativeWork.
export function creativeWorkJsonLd(p: ProjectLd) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: p.title,
    url: pfUrl(p.username, `/projects/${p.slug}`),
    author: { '@type': 'Person', name: p.authorName },
    ...(p.summary ? { description: p.summary } : {}),
    ...(p.image ? { image: p.image } : {}),
    ...(p.stack?.length ? { keywords: p.stack.join(', ') } : {}),
    ...(p.url ? { sameAs: p.url.startsWith('http') ? p.url : `https://${p.url}` } : {}),
  }
}
