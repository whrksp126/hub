import 'server-only'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { apiKeys, posts } from '@/db/schema'
import type { ContentType } from '@/lib/content-types'

export async function listApiKeys() {
  return db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt))
}

export type StudioItem = {
  id: number
  title: string
  slug: string
  status: string
  updatedAt: Date
  type: ContentType
}

export async function listStudioItems(): Promise<StudioItem[]> {
  const rows = await db
    .select({ id: posts.id, title: posts.title, slug: posts.slug, status: posts.status, updatedAt: posts.updatedAt })
    .from(posts)
    .orderBy(desc(posts.updatedAt))
  return rows.map((r) => ({ ...r, type: 'posts' as const }))
}

export async function getStudioDoc(_type: ContentType, id: number) {
  return (await db.select().from(posts).where(eq(posts.id, id)).limit(1))[0] ?? null
}
