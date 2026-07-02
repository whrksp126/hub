'use server'

import { randomBytes } from 'crypto'
import { and, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { experiences, notes, profiles, projects } from '@/db/schema'
import type { ProjectMetric, ProjectSection, SectionMedia } from '@/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { safeRevalidate } from '@/lib/revalidate'
import { pfPath } from '@/lib/seo'

type ActionResult = { ok: boolean; error?: string }

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

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim()
const num = (f: FormData, k: string) => Number(f.get(k) ?? 0) || 0
const bool = (f: FormData, k: string) => f.get(k) === 'on' || f.get(k) === '1' || f.get(k) === 'true'

function parseJsonField<T>(f: FormData, k: string, fallback: T): T {
  const s = String(f.get(k) ?? '').trim()
  if (!s) return fallback
  try {
    return JSON.parse(s) as T
  } catch {
    throw new Error(`"${k}" 필드의 JSON 형식이 올바르지 않습니다.`)
  }
}

async function revalidateProfile(username: string) {
  safeRevalidate(
    '/',
    pfPath(username),
    pfPath(username, '/projects'),
    pfPath(username, '/experience'),
    pfPath(username, '/deep-dives'),
    pfPath(username, '/docs'),
    '/sitemap.xml',
  )
}

async function guard() {
  const user = await getCurrentUser()
  if (!user) redirect('/studio/login')
  return user
}

// 편집 권한(소유자 또는 운영자) 확인 → 프로필 username 반환(없으면 null).
async function editableUsername(user: { id: number; role: string }, profileId: number): Promise<string | null> {
  const r = await db.select({ username: profiles.username, userId: profiles.userId }).from(profiles).where(eq(profiles.id, profileId)).limit(1)
  const p = r[0]
  if (!p) return null
  if (p.userId === user.id || user.role === 'admin') return p.username
  return null
}

async function profileUsernameById(profileId: number): Promise<string | null> {
  const r = await db.select({ username: profiles.username }).from(profiles).where(eq(profiles.id, profileId)).limit(1)
  return r[0]?.username ?? null
}

async function uniqueProfileSlug(base: string): Promise<string> {
  let slug = base
  for (let i = 2; ; i++) {
    const hit = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.username, slug)).limit(1)
    if (!hit[0]) return slug
    slug = `${base}-${i}`
  }
}

// ── 프로필(포트폴리오) ───────────────────────────────────────────────
// 새 포트폴리오 생성(다중 허용). 생성 후 편집 화면으로.
export async function createProfileAction() {
  const user = await guard()
  const slug = await uniqueProfileSlug(slugify(user.username || 'portfolio'))
  const [row] = await db
    .insert(profiles)
    .values({ userId: user.id, username: slug, name: '새 포트폴리오', status: 'draft' })
    .returning({ id: profiles.id })
  redirect(`/studio/p/${row.id}`)
}

export async function saveProfileAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await guard()
  const id = num(formData, 'id')
  if (!id || !(await editableUsername(user, id))) return { ok: false, error: '편집 권한이 없습니다.' }

  const username = slugify(str(formData, 'username') || 'me')
  const dup = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.username, username))
  if (dup.some((d) => d.id !== id)) return { ok: false, error: `이미 쓰이는 주소(${username})입니다.` }

  try {
    await db
      .update(profiles)
      .set({
        username,
        name: str(formData, 'name') || '이름 없음',
        nameEn: str(formData, 'nameEn') || null,
        title: str(formData, 'title') || null,
        headline: str(formData, 'headline') || null,
        tagline: str(formData, 'tagline') || null,
        bio: str(formData, 'bio') || null,
        intro: str(formData, 'intro') || null,
        email: str(formData, 'email') || null,
        github: str(formData, 'github') || null,
        phone: str(formData, 'phone') || null,
        location: str(formData, 'location') || null,
        education: str(formData, 'education') || null,
        business: str(formData, 'business') || null,
        accent: str(formData, 'accent') || '#F1531B',
        avatarId: num(formData, 'avatarId') || null,
        status: bool(formData, 'published') ? 'published' : 'draft',
        stats: parseJsonField(formData, 'stats', []),
        skills: parseJsonField(formData, 'skills', []),
        awards: parseJsonField(formData, 'awards', []),
        notes: parseJsonField(formData, 'notes', []),
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, id))
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }

  await revalidateProfile(username)
  return { ok: true }
}

// 인라인(노션식) 자동저장: 전달된 필드만 부분 갱신한다.
// 캔버스와 세부 패널이 서로 다른 필드를 건드리므로 덮어쓰기 충돌이 없다.
const TEXT_FIELDS = [
  'name', 'nameEn', 'title', 'headline', 'tagline', 'bio', 'intro',
  'email', 'github', 'phone', 'location', 'education', 'business',
  'ctaTitle', 'ctaText',
] as const
const JSON_FIELDS = ['stats', 'skills', 'awards', 'social', 'cards', 'notes'] as const
type ProfilePatch = Partial<Record<(typeof TEXT_FIELDS)[number] | (typeof JSON_FIELDS)[number], string | unknown[]>> & {
  username?: string
  accent?: string
  avatarId?: number | null
  published?: boolean
}

export async function saveProfilePatchAction(profileId: number, patch: ProfilePatch): Promise<ActionResult> {
  const user = await guard()
  const current = await editableUsername(user, profileId)
  if (!current) return { ok: false, error: '편집 권한이 없습니다.' }

  const set: Record<string, unknown> = {}
  for (const k of TEXT_FIELDS) {
    if (k in patch) {
      const v = String(patch[k] ?? '').trim()
      set[k] = v || (k === 'name' ? '이름 없음' : null)
    }
  }
  for (const k of JSON_FIELDS) {
    if (k in patch && Array.isArray(patch[k])) set[k] = patch[k]
  }
  if ('accent' in patch) set.accent = String(patch.accent || '').trim() || '#F1531B'
  if ('avatarId' in patch) set.avatarId = patch.avatarId ?? null
  if ('published' in patch) set.status = patch.published ? 'published' : 'draft'

  let username = current
  if (typeof patch.username === 'string') {
    const slug = slugify(patch.username) || 'me'
    const dup = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.username, slug))
    if (dup.some((d) => d.id !== profileId)) return { ok: false, error: `이미 쓰이는 주소(${slug})입니다.` }
    set.username = slug
    username = slug
  }

  if (Object.keys(set).length === 0) return { ok: true }
  set.updatedAt = new Date()
  await db.update(profiles).set(set).where(eq(profiles.id, profileId))

  await revalidateProfile(username)
  if (username !== current) await revalidateProfile(current)
  return { ok: true }
}

// 포트폴리오 삭제(프로젝트·경력 cascade).
export async function deleteProfileAction(formData: FormData) {
  const user = await guard()
  const id = num(formData, 'id')
  if (id && (await editableUsername(user, id))) {
    await db.delete(profiles).where(eq(profiles.id, id))
    safeRevalidate('/', '/sitemap.xml')
  }
  redirect('/studio')
}

// ── 프로젝트 ─────────────────────────────────────────────────────────
export async function createProjectAction(formData: FormData) {
  const user = await guard()
  const profileId = num(formData, 'profileId')
  if (!profileId || !(await editableUsername(user, profileId))) redirect('/studio')
  const slug = `project-${randomBytes(3).toString('hex')}`
  const [row] = await db
    .insert(projects)
    .values({ profileId, slug, title: '새 프로젝트', status: 'draft', order: 99 })
    .returning({ id: projects.id })
  redirect(`/studio/p/${profileId}/projects/${row.id}`)
}

export async function saveProjectAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await guard()
  const id = num(formData, 'id')
  if (!id) return { ok: false, error: '프로젝트를 찾을 수 없습니다.' }
  const existing = (await db.select().from(projects).where(eq(projects.id, id)).limit(1))[0]
  if (!existing) return { ok: false, error: '프로젝트를 찾을 수 없습니다.' }
  const username = await editableUsername(user, existing.profileId)
  if (!username) return { ok: false, error: '편집 권한이 없습니다.' }

  const published = bool(formData, 'published')
  try {
    await db
      .update(projects)
      .set({
        title: str(formData, 'title') || '새 프로젝트',
        titleKr: str(formData, 'titleKr') || null,
        slug: slugify(str(formData, 'slug') || str(formData, 'title')),
        tag: str(formData, 'tag') || null,
        year: str(formData, 'year') || null,
        role: str(formData, 'role') || null,
        url: str(formData, 'url') || null,
        summary: str(formData, 'summary') || null,
        coverId: num(formData, 'coverId') || null,
        logoId: num(formData, 'logoId') || null,
        featured: bool(formData, 'featured'),
        order: num(formData, 'order'),
        status: published ? 'published' : 'draft',
        publishedAt: published && !existing.publishedAt ? new Date() : existing.publishedAt,
        metrics: parseJsonField(formData, 'metrics', []),
        sections: parseJsonField(formData, 'sections', []),
        stack: parseJsonField(formData, 'stack', []),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }

  await revalidateProfile(username)
  return { ok: true }
}

export async function deleteProjectAction(formData: FormData) {
  const user = await guard()
  const id = num(formData, 'id')
  const existing = id ? (await db.select().from(projects).where(eq(projects.id, id)).limit(1))[0] : null
  if (existing && (await editableUsername(user, existing.profileId))) {
    await db.delete(projects).where(eq(projects.id, id))
    redirect(`/studio/p/${existing.profileId}/projects`)
  }
  redirect('/studio')
}

type ProjectPatch = Partial<{
  title: string
  titleKr: string
  slug: string
  tag: string
  year: string
  role: string
  url: string
  summary: string
  metrics: ProjectMetric[]
  sections: ProjectSection[]
  stack: string[]
  relatedNoteIds: number[]
  coverId: number | null
  logoId: number | null
  featured: boolean
  published: boolean
  order: number
}>

// 인라인 자동저장(부분 patch) — 프로젝트 편집기. saveProfilePatchAction과 동일 패턴.
export async function saveProjectPatchAction(projectId: number, patch: ProjectPatch): Promise<ActionResult> {
  const user = await guard()
  const existing = (await db.select().from(projects).where(eq(projects.id, projectId)).limit(1))[0]
  if (!existing) return { ok: false, error: '프로젝트를 찾을 수 없습니다.' }
  const username = await editableUsername(user, existing.profileId)
  if (!username) return { ok: false, error: '편집 권한이 없습니다.' }

  const set: Record<string, unknown> = {}
  for (const k of ['title', 'titleKr', 'tag', 'year', 'role', 'url', 'summary'] as const) {
    if (k in patch) {
      const v = String(patch[k] ?? '').trim()
      set[k] = v || (k === 'title' ? '새 프로젝트' : null)
    }
  }
  if ('slug' in patch) set.slug = slugify(String(patch.slug ?? '') || existing.title)
  for (const k of ['metrics', 'sections', 'stack', 'relatedNoteIds'] as const) {
    if (k in patch && Array.isArray(patch[k])) set[k] = patch[k]
  }
  if ('coverId' in patch) set.coverId = patch.coverId ?? null
  if ('logoId' in patch) set.logoId = patch.logoId ?? null
  if ('featured' in patch) set.featured = !!patch.featured
  if ('order' in patch && typeof patch.order === 'number') set.order = patch.order
  if ('published' in patch) {
    set.status = patch.published ? 'published' : 'draft'
    if (patch.published && !existing.publishedAt) set.publishedAt = new Date()
  }
  if (Object.keys(set).length === 0) return { ok: true }
  set.updatedAt = new Date()
  try {
    await db.update(projects).set(set).where(eq(projects.id, projectId))
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  await revalidateProfile(username)
  return { ok: true }
}

// ── 경력 ─────────────────────────────────────────────────────────────
export async function createExperienceAction(formData: FormData) {
  const user = await guard()
  const profileId = num(formData, 'profileId')
  if (!profileId || !(await editableUsername(user, profileId))) redirect('/studio')
  const [row] = await db
    .insert(experiences)
    .values({ profileId, company: '새 경력', order: 99 })
    .returning({ id: experiences.id })
  redirect(`/studio/p/${profileId}/experience/${row.id}`)
}

export async function saveExperienceAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await guard()
  const id = num(formData, 'id')
  if (!id) return { ok: false, error: '경력을 찾을 수 없습니다.' }
  const existing = (await db.select().from(experiences).where(eq(experiences.id, id)).limit(1))[0]
  if (!existing) return { ok: false, error: '경력을 찾을 수 없습니다.' }
  const username = await editableUsername(user, existing.profileId)
  if (!username) return { ok: false, error: '편집 권한이 없습니다.' }

  try {
    await db
      .update(experiences)
      .set({
        company: str(formData, 'company') || '회사',
        role: str(formData, 'role') || null,
        period: str(formData, 'period') || null,
        length: str(formData, 'length') || null,
        context: str(formData, 'context') || null,
        current: bool(formData, 'current'),
        logoId: num(formData, 'logoId') || null,
        coverId: num(formData, 'coverId') || null,
        order: num(formData, 'order'),
        points: parseJsonField(formData, 'points', []),
        stack: parseJsonField(formData, 'stack', []),
        updatedAt: new Date(),
      })
      .where(eq(experiences.id, id))
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }

  await revalidateProfile(username)
  return { ok: true }
}

type ExperiencePatch = Partial<{
  company: string
  role: string
  period: string
  length: string
  context: string
  current: boolean
  points: string[]
  stack: string[]
  media: SectionMedia[]
  logoId: number | null
  coverId: number | null
  order: number
}>

// 인라인 자동저장(부분 patch) — 경력 편집기.
export async function saveExperiencePatchAction(experienceId: number, patch: ExperiencePatch): Promise<ActionResult> {
  const user = await guard()
  const existing = (await db.select().from(experiences).where(eq(experiences.id, experienceId)).limit(1))[0]
  if (!existing) return { ok: false, error: '경력을 찾을 수 없습니다.' }
  const username = await editableUsername(user, existing.profileId)
  if (!username) return { ok: false, error: '편집 권한이 없습니다.' }

  const set: Record<string, unknown> = {}
  for (const k of ['company', 'role', 'period', 'length', 'context'] as const) {
    if (k in patch) {
      const v = String(patch[k] ?? '').trim()
      set[k] = v || (k === 'company' ? '회사' : null)
    }
  }
  for (const k of ['points', 'stack', 'media'] as const) {
    if (k in patch && Array.isArray(patch[k])) set[k] = patch[k]
  }
  if ('current' in patch) set.current = !!patch.current
  if ('logoId' in patch) set.logoId = patch.logoId ?? null
  if ('coverId' in patch) set.coverId = patch.coverId ?? null
  if ('order' in patch && typeof patch.order === 'number') set.order = patch.order
  if (Object.keys(set).length === 0) return { ok: true }
  set.updatedAt = new Date()
  try {
    await db.update(experiences).set(set).where(eq(experiences.id, experienceId))
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
  await revalidateProfile(username)
  return { ok: true }
}

export async function deleteExperienceAction(formData: FormData) {
  const user = await guard()
  const id = num(formData, 'id')
  const existing = id ? (await db.select().from(experiences).where(eq(experiences.id, id)).limit(1))[0] : null
  if (existing && (await editableUsername(user, existing.profileId))) {
    await db.delete(experiences).where(eq(experiences.id, id))
    redirect(`/studio/p/${existing.profileId}/experience`)
  }
  redirect('/studio')
}

// ── 글(아티클) ───────────────────────────────────────────────────────
export async function createNoteAction(formData: FormData) {
  const user = await guard()
  const profileId = num(formData, 'profileId')
  if (!profileId || !(await editableUsername(user, profileId))) redirect('/studio')
  const slug = `note-${randomBytes(3).toString('hex')}`
  const [row] = await db
    .insert(notes)
    .values({ profileId, slug, title: '새 글', status: 'draft', order: 99, content: [] })
    .returning({ id: notes.id })
  redirect(`/studio/p/${profileId}/notes/${row.id}`)
}

const NOTE_TEXT = ['category', 'date', 'readTime', 'title', 'excerpt'] as const
type NotePatch = Partial<Record<(typeof NOTE_TEXT)[number] | 'slug', string>> & {
  coverId?: number | null
  content?: unknown[]
  order?: number
  published?: boolean
}

export async function saveNotePatchAction(noteId: number, patch: NotePatch): Promise<ActionResult> {
  const user = await guard()
  const existing = (await db.select().from(notes).where(eq(notes.id, noteId)).limit(1))[0]
  if (!existing) return { ok: false, error: '글을 찾을 수 없습니다.' }
  const username = await editableUsername(user, existing.profileId)
  if (!username) return { ok: false, error: '편집 권한이 없습니다.' }

  const set: Record<string, unknown> = {}
  for (const k of NOTE_TEXT) {
    if (k in patch) set[k] = String(patch[k] ?? '').trim() || (k === 'title' ? '제목 없음' : null)
  }
  if (typeof patch.slug === 'string') set.slug = slugify(patch.slug) || existing.slug
  if ('coverId' in patch) set.coverId = patch.coverId ?? null
  if ('content' in patch && Array.isArray(patch.content)) set.content = patch.content
  if (typeof patch.order === 'number') set.order = patch.order
  if ('published' in patch) {
    set.status = patch.published ? 'published' : 'draft'
    if (patch.published && !existing.publishedAt) set.publishedAt = new Date()
  }
  if (Object.keys(set).length === 0) return { ok: true }
  set.updatedAt = new Date()
  try {
    await db.update(notes).set(set).where(eq(notes.id, noteId))
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }

  const slug = (set.slug as string) ?? existing.slug
  safeRevalidate('/', pfPath(username), pfPath(username, '/deep-dives'), pfPath(username, `/deep-dives/${slug}`), '/sitemap.xml')
  return { ok: true }
}

export async function deleteNoteAction(formData: FormData) {
  const user = await guard()
  const id = num(formData, 'id')
  const existing = id ? (await db.select().from(notes).where(eq(notes.id, id)).limit(1))[0] : null
  if (existing) {
    const username = await editableUsername(user, existing.profileId)
    if (username) {
      await db.delete(notes).where(eq(notes.id, id))
      safeRevalidate('/', pfPath(username, '/deep-dives'), '/sitemap.xml')
      redirect(`/studio/p/${existing.profileId}/notes`)
    }
  }
  redirect('/studio')
}

// ── 홈 큐레이션 (노출 토글 · 순서 · 삭제) ────────────────────────────
export async function setProjectFeaturedAction(id: number, featured: boolean): Promise<ActionResult> {
  const user = await guard()
  const row = (await db.select().from(projects).where(eq(projects.id, id)).limit(1))[0]
  if (!row) return { ok: false, error: '프로젝트를 찾을 수 없습니다.' }
  const username = await editableUsername(user, row.profileId)
  if (!username) return { ok: false, error: '편집 권한이 없습니다.' }
  await db.update(projects).set({ featured, updatedAt: new Date() }).where(eq(projects.id, id))
  await revalidateProfile(username)
  return { ok: true }
}

export async function setNoteFeaturedAction(id: number, featured: boolean): Promise<ActionResult> {
  const user = await guard()
  const row = (await db.select().from(notes).where(eq(notes.id, id)).limit(1))[0]
  if (!row) return { ok: false, error: '글을 찾을 수 없습니다.' }
  const username = await editableUsername(user, row.profileId)
  if (!username) return { ok: false, error: '편집 권한이 없습니다.' }
  await db.update(notes).set({ featured, updatedAt: new Date() }).where(eq(notes.id, id))
  await revalidateProfile(username)
  return { ok: true }
}

export async function reorderProjectsAction(profileId: number, orderedIds: number[]): Promise<ActionResult> {
  const user = await guard()
  const username = await editableUsername(user, profileId)
  if (!username) return { ok: false, error: '편집 권한이 없습니다.' }
  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(projects).set({ order: i }).where(and(eq(projects.id, orderedIds[i]), eq(projects.profileId, profileId)))
  }
  await revalidateProfile(username)
  return { ok: true }
}

export async function reorderNotesAction(profileId: number, orderedIds: number[]): Promise<ActionResult> {
  const user = await guard()
  const username = await editableUsername(user, profileId)
  if (!username) return { ok: false, error: '편집 권한이 없습니다.' }
  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(notes).set({ order: i }).where(and(eq(notes.id, orderedIds[i]), eq(notes.profileId, profileId)))
  }
  await revalidateProfile(username)
  return { ok: true }
}

export async function removeProjectAction(id: number): Promise<ActionResult> {
  const user = await guard()
  const row = (await db.select().from(projects).where(eq(projects.id, id)).limit(1))[0]
  if (!row) return { ok: true }
  const username = await editableUsername(user, row.profileId)
  if (!username) return { ok: false, error: '편집 권한이 없습니다.' }
  await db.delete(projects).where(eq(projects.id, id))
  await revalidateProfile(username)
  return { ok: true }
}

export async function reorderExperiencesAction(profileId: number, orderedIds: number[]): Promise<ActionResult> {
  const user = await guard()
  const username = await editableUsername(user, profileId)
  if (!username) return { ok: false, error: '편집 권한이 없습니다.' }
  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(experiences).set({ order: i }).where(and(eq(experiences.id, orderedIds[i]), eq(experiences.profileId, profileId)))
  }
  await revalidateProfile(username)
  return { ok: true }
}

export async function removeExperienceAction(id: number): Promise<ActionResult> {
  const user = await guard()
  const row = (await db.select().from(experiences).where(eq(experiences.id, id)).limit(1))[0]
  if (!row) return { ok: true }
  const username = await editableUsername(user, row.profileId)
  if (!username) return { ok: false, error: '편집 권한이 없습니다.' }
  await db.delete(experiences).where(eq(experiences.id, id))
  await revalidateProfile(username)
  return { ok: true }
}

export async function removeNoteAction(id: number): Promise<ActionResult> {
  const user = await guard()
  const row = (await db.select().from(notes).where(eq(notes.id, id)).limit(1))[0]
  if (!row) return { ok: true }
  const username = await editableUsername(user, row.profileId)
  if (!username) return { ok: false, error: '편집 권한이 없습니다.' }
  await db.delete(notes).where(eq(notes.id, id))
  await revalidateProfile(username)
  return { ok: true }
}

export { profileUsernameById }
