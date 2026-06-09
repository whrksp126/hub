import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from './seo'

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

type PostLd = {
  title: string
  slug: string
  excerpt?: string | null
  image?: string | null
  publishedAt?: string | null
  updatedAt?: string | null
  tags?: (string | null)[] | null
}

export function blogPostingJsonLd(p: PostLd) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    url: `${SITE_URL}/blog/${p.slug}`,
    author: { '@type': 'Person', name: SITE_NAME },
    ...(p.excerpt ? { description: p.excerpt } : {}),
    ...(p.image ? { image: p.image } : {}),
    ...(p.publishedAt ? { datePublished: p.publishedAt } : {}),
    ...(p.updatedAt ? { dateModified: p.updatedAt } : {}),
    ...(p.tags?.length ? { keywords: p.tags.filter(Boolean).join(', ') } : {}),
  }
}
