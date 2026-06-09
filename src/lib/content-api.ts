import 'server-only'
import { randomBytes } from 'crypto'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { posts } from '@/db/schema'
import { CONTENT_TYPE_META, type ContentType } from '@/lib/content-types'
import { markdownToPlate } from '@/lib/markdown-to-plate'
import { safeRevalidate } from '@/lib/revalidate'
import { slugify } from '@/lib/slug'

const TABLES = { posts } as const

// 에이전트/관리자가 설정 가능한 필드(화이트리스트). content/markdown은 별도 처리.
const FIELDS: Record<ContentType, string[]> = {
  posts: ['title', 'slug', 'excerpt', 'category', 'tags', 'theme', 'status', 'coverId'],
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function resolveContent(body: any): unknown | undefined {
  if (Array.isArray(body.content)) return body.content
  if (typeof body.markdown === 'string') return markdownToPlate(body.markdown)
  return undefined
}

function pick(type: ContentType, body: any) {
  const out: Record<string, unknown> = {}
  for (const f of FIELDS[type]) if (body[f] !== undefined) out[f] = body[f]
  return out
}

function revalidateFor(type: ContentType, slug?: string) {
  const base = CONTENT_TYPE_META[type].publicPath
  safeRevalidate('/', base, slug ? `${base}/${slug}` : undefined)
}

export async function listContent(type: ContentType, opts: { all?: boolean } = {}) {
  const t = TABLES[type]
  return opts.all
    ? db.select().from(t).orderBy(desc(t.updatedAt))
    : db.select().from(t).where(eq(t.status, 'published')).orderBy(desc(t.publishedAt))
}

export async function getContent(type: ContentType, id: number) {
  const t = TABLES[type]
  return (await db.select().from(t).where(eq(t.id, id)).limit(1))[0] ?? null
}

export async function createContent(type: ContentType, body: any) {
  const t = TABLES[type] as any
  const data = pick(type, body)
  const content = resolveContent(body)
  if (content !== undefined) data.content = content
  data.title = (data.title as string) || '제목 없음'
  const baseSlug = slugify((data.slug as string) || (data.title as string))
  // slug 미지정 시 충돌 방지용 suffix
  data.slug = body.slug ? baseSlug : `${baseSlug}-${randomBytes(3).toString('hex')}`
  if (data.status === 'published' && !data.publishedAt) data.publishedAt = new Date()
  const [row] = (await db.insert(t).values(data).returning()) as any[]
  revalidateFor(type, row.slug)
  return row
}

export async function updateContent(type: ContentType, id: number, body: any) {
  const t = TABLES[type] as any
  const existing = await getContent(type, id)
  if (!existing) return null
  const data = pick(type, body)
  const content = resolveContent(body)
  if (content !== undefined) data.content = content
  if (data.slug) data.slug = slugify(data.slug as string)
  if (data.status === 'published' && !(existing as any).publishedAt && !data.publishedAt) {
    data.publishedAt = new Date()
  }
  data.updatedAt = new Date()
  const [row] = (await db.update(t).set(data).where(eq(t.id, id)).returning()) as any[]
  revalidateFor(type, row.slug)
  return row
}

export async function deleteContent(type: ContentType, id: number) {
  const t = TABLES[type] as any
  const existing = await getContent(type, id)
  if (!existing) return false
  await db.delete(t).where(eq(t.id, id))
  revalidateFor(type, (existing as any).slug)
  return true
}
