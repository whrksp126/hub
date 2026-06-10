'use server'

import { randomBytes } from 'crypto'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { apiKeys, posts, users } from '@/db/schema'
import {
  createSession,
  destroySession,
  generateApiKey,
  getCurrentUser,
  hasAnyUser,
  hashPassword,
  verifyPassword,
} from '@/lib/auth'
import {
  CONTENT_TYPE_META,
  EMPTY_PLATE_VALUE,
  isContentType,
  type ContentType,
} from '@/lib/content-types'
import { safeRevalidate } from '@/lib/revalidate'
import { blogSample, blogSampleExcerpt } from '@/themes/samples'

const tableOf = (_type: ContentType) => posts

function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w가-힣-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return base || 'untitled'
}

// ── 인증 ─────────────────────────────────────────────────────────────
export async function loginAction(_prev: string | null, formData: FormData): Promise<string | null> {
  const username = String(formData.get('username') || '').trim()
  const password = String(formData.get('password') || '')
  if (!username || !password) return '아이디와 비밀번호를 입력하세요.'
  const rows = await db.select().from(users).where(eq(users.username, username)).limit(1)
  const user = rows[0]
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return '아이디 또는 비밀번호가 올바르지 않습니다.'
  }
  await createSession({ id: user.id, username: user.username, role: user.role })
  redirect('/studio')
}

export async function setupAction(_prev: string | null, formData: FormData): Promise<string | null> {
  if (await hasAnyUser()) redirect('/studio/login')
  const username = String(formData.get('username') || '').trim()
  const password = String(formData.get('password') || '')
  const name = String(formData.get('name') || '').trim() || null
  if (!username || password.length < 8) return '아이디와 8자 이상 비밀번호가 필요합니다.'
  const passwordHash = await hashPassword(password)
  const [user] = await db.insert(users).values({ username, passwordHash, name }).returning()
  await createSession({ id: user.id, username: user.username, role: user.role })
  redirect('/studio')
}

export async function logoutAction() {
  await destroySession()
  redirect('/studio/login')
}

// ── 콘텐츠 ───────────────────────────────────────────────────────────
export async function createDraftAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) redirect('/studio/login')
  const type = String(formData.get('type') || '')
  if (!isContentType(type)) redirect('/studio')
  const blank = formData.get('blank') === '1'
  const theme = blank
    ? CONTENT_TYPE_META[type].defaultTheme
    : String(formData.get('theme') || CONTENT_TYPE_META[type].defaultTheme)
  const title = String(formData.get('title') || '').trim() || '제목 없음'
  const slug = `${slugify(title)}-${randomBytes(3).toString('hex')}`
  const content = blank ? EMPTY_PLATE_VALUE : blogSample()
  const excerpt = blank ? null : blogSampleExcerpt

  const [row] = await db
    .insert(tableOf(type))
    .values({ title, slug, theme, status: 'draft', content, excerpt })
    .returning({ id: tableOf(type).id })
  redirect(`/studio/${type}/${row.id}`)
}

type SaveInput = {
  type: ContentType
  id: number
  title: string
  slug: string
  content: unknown
  status: 'draft' | 'published'
  publish?: boolean
}

export async function saveDocAction(input: SaveInput): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: '로그인이 필요합니다.' }
  if (!isContentType(input.type)) return { ok: false, error: '잘못된 타입' }

  const t = tableOf(input.type)
  const existing = (await db.select().from(t).where(eq(t.id, input.id)).limit(1))[0]
  if (!existing) return { ok: false, error: '문서를 찾을 수 없습니다.' }

  const status = input.publish ? 'published' : input.status
  const publishedAt =
    status === 'published' && !existing.publishedAt ? new Date() : existing.publishedAt

  await db
    .update(t)
    .set({
      title: input.title || '제목 없음',
      slug: slugify(input.slug || input.title),
      content: input.content,
      status,
      publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(t.id, input.id))

  // 즉시 반영: 공개 경로 무효화.
  const meta = CONTENT_TYPE_META[input.type]
  safeRevalidate('/', meta.publicPath, `${meta.publicPath}/${slugify(input.slug || input.title)}`)
  return { ok: true }
}

// ── API 키 (에이전트) ────────────────────────────────────────────────
export async function createApiKeyAction(
  _prev: { key?: string; error?: string } | null,
  formData: FormData,
): Promise<{ key?: string; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: '로그인이 필요합니다.' }
  const name = String(formData.get('name') || '').trim() || '에이전트 키'
  const { key, prefix, keyHash } = generateApiKey()
  await db.insert(apiKeys).values({ name, prefix, keyHash })
  return { key } // 평문은 이때 1회만 노출
}

export async function revokeApiKeyAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) redirect('/studio/login')
  const id = Number(formData.get('id') || 0)
  if (id) await db.update(apiKeys).set({ revokedAt: new Date() }).where(eq(apiKeys.id, id))
  redirect('/studio/keys')
}

export async function deleteDocAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) redirect('/studio/login')
  const type = String(formData.get('type') || '')
  const id = Number(formData.get('id') || 0)
  if (!isContentType(type) || !id) redirect('/studio')
  const t = tableOf(type)
  await db.delete(t).where(eq(t.id, id))
  safeRevalidate('/', CONTENT_TYPE_META[type].publicPath)
  redirect('/studio')
}
