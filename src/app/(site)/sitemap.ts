import type { MetadataRoute } from 'next'
import { getSitemapEntries } from '@/db/queries'
import { SITE_URL } from '@/lib/seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { posts } = await getSitemapEntries()

  const postUrls: MetadataRoute.Sitemap = posts.map((d) => ({
    url: `${SITE_URL}/blog/${d.slug}`,
    lastModified: d.updatedAt ?? undefined,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    ...postUrls,
  ]
}
