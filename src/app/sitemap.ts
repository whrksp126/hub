import type { MetadataRoute } from 'next'
import { getNotesByProfile, getProjectsByProfile, getPublishedProfiles } from '@/db/queries'
import { SITE_URL, pfUrl } from '@/lib/seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const profiles = await getPublishedProfiles()

  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/docs`, changeFrequency: 'monthly', priority: 0.7 },
  ]

  for (const p of profiles) {
    const base = pfUrl(p.username)
    entries.push(
      { url: base, lastModified: p.updatedAt ?? undefined, changeFrequency: 'weekly', priority: 0.9 },
      { url: `${base}/projects`, changeFrequency: 'weekly', priority: 0.8 },
      { url: `${base}/experience`, changeFrequency: 'monthly', priority: 0.6 },
      { url: `${base}/deep-dives`, changeFrequency: 'weekly', priority: 0.6 },
      { url: `${base}/contact`, changeFrequency: 'monthly', priority: 0.5 },
    )
    const projects = await getProjectsByProfile(p.id)
    for (const pr of projects) {
      entries.push({
        url: `${base}/projects/${pr.slug}`,
        lastModified: pr.updatedAt ?? undefined,
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
    const notes = await getNotesByProfile(p.id)
    for (const nt of notes) {
      entries.push({
        url: `${base}/deep-dives/${encodeURIComponent(nt.slug)}`,
        lastModified: nt.updatedAt ?? undefined,
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
  }

  return entries
}
