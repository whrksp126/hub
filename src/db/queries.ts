import 'server-only'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { db } from './index'
import { media, posts } from './schema'

// media id 여러 개 → { id: url } 매핑.
export async function getMediaUrls(ids: (number | null | undefined)[]) {
  const valid = [...new Set(ids.filter((x): x is number => !!x))]
  if (!valid.length) return {} as Record<number, string>
  const rows = await db.select({ id: media.id, url: media.url }).from(media).where(inArray(media.id, valid))
  return Object.fromEntries(rows.map((r) => [r.id, r.url])) as Record<number, string>
}

export async function getMediaUrl(id?: number | null) {
  if (!id) return null
  const rows = await db.select({ url: media.url }).from(media).where(eq(media.id, id)).limit(1)
  return rows[0]?.url ?? null
}

// 공개(published)만 노출 — 모든 공개 페이지/사이트맵 공용.
export async function getPublishedPosts() {
  return db
    .select()
    .from(posts)
    .where(eq(posts.status, 'published'))
    .orderBy(desc(posts.publishedAt))
}

export async function getPostBySlug(slug: string) {
  const rows = await db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.status, 'published')))
    .limit(1)
  return rows[0] ?? null
}

// 사이트맵용 — slug + 최종수정.
export async function getSitemapEntries() {
  const ps = await db
    .select({ slug: posts.slug, updatedAt: posts.updatedAt })
    .from(posts)
    .where(eq(posts.status, 'published'))
  return { posts: ps }
}
