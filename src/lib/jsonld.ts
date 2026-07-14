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

// 기술 문서 페이지 = TechArticle.
export function techArticleJsonLd({
  headline,
  description,
  path,
}: {
  headline: string
  description?: string
  path: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline,
    url: `${SITE_URL}${path}`,
    ...(description ? { description } : {}),
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  }
}

// 서비스(SaaS) 엔티티 — 랜딩에서 WebSite와 함께 삽입해 엔티티 인식 강화.
export function softwareApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    description: SITE_DESCRIPTION,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
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

type NoteLd = {
  username: string
  slug: string
  title: string
  excerpt?: string | null
  image?: string | null
  authorName: string
  datePublished?: string | null
  dateModified?: string | null
  category?: string | null
}

// 딥다이브(블로그 글) 상세 = BlogPosting. AEO에서 가장 인용되기 쉬운 콘텐츠.
export function blogPostingJsonLd(n: NoteLd) {
  const url = pfUrl(n.username, `/deep-dives/${n.slug}`)
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: n.title,
    url,
    mainEntityOfPage: url,
    author: { '@type': 'Person', name: n.authorName },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    ...(n.excerpt ? { description: n.excerpt } : {}),
    ...(n.image ? { image: n.image } : {}),
    ...(n.datePublished ? { datePublished: n.datePublished } : {}),
    ...(n.dateModified ? { dateModified: n.dateModified } : {}),
    ...(n.category ? { articleSection: n.category } : {}),
  }
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
