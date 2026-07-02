import 'server-only'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { db } from './index'
import { experiences, media, notes, profiles, projects } from './schema'

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


// ── 포트폴리오 ────────────────────────────────────────────────────────

// username으로 공개 프로필 조회 (발행 상태만).
export async function getProfileByUsername(username: string) {
  const rows = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.username, username), eq(profiles.status, 'published')))
    .limit(1)
  return rows[0] ?? null
}

// 공개 프로필 전부 (랜딩의 "이 서비스로 만든 포트폴리오" 쇼케이스/사이트맵용).
export async function getPublishedProfiles() {
  return db
    .select()
    .from(profiles)
    .where(eq(profiles.status, 'published'))
    .orderBy(desc(profiles.updatedAt))
}

// 프로필의 발행 프로젝트 (정렬: order asc).
export async function getProjectsByProfile(profileId: number) {
  return db
    .select()
    .from(projects)
    .where(and(eq(projects.profileId, profileId), eq(projects.status, 'published')))
    .orderBy(asc(projects.order))
}

// 홈에 노출할 프로젝트 (published & featured, order asc).
export async function getHomeProjects(profileId: number) {
  return db
    .select()
    .from(projects)
    .where(and(eq(projects.profileId, profileId), eq(projects.status, 'published'), eq(projects.featured, true)))
    .orderBy(asc(projects.order))
}

export async function getProjectBySlug(profileId: number, slug: string) {
  const rows = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.profileId, profileId),
        eq(projects.slug, slug),
        eq(projects.status, 'published'),
      ),
    )
    .limit(1)
  return rows[0] ?? null
}

// 프로필의 발행 글 (정렬: order asc → 최신 표시용).
export async function getNotesByProfile(profileId: number) {
  return db
    .select()
    .from(notes)
    .where(and(eq(notes.profileId, profileId), eq(notes.status, 'published')))
    .orderBy(asc(notes.order))
}

// 홈에 노출할 글 (published & featured, order asc).
export async function getHomeNotes(profileId: number) {
  return db
    .select()
    .from(notes)
    .where(and(eq(notes.profileId, profileId), eq(notes.status, 'published'), eq(notes.featured, true)))
    .orderBy(asc(notes.order))
}

// id 목록으로 발행 글 조회(관련 딥다이브). 입력 id 순서를 보존.
export async function getNotesByIds(profileId: number, ids: (number | null | undefined)[]) {
  const valid = [...new Set(ids.filter((x): x is number => !!x))]
  if (!valid.length) return []
  const rows = await db
    .select()
    .from(notes)
    .where(and(eq(notes.profileId, profileId), inArray(notes.id, valid), eq(notes.status, 'published')))
  return valid.map((id) => rows.find((r) => r.id === id)).filter((r): r is (typeof rows)[number] => !!r)
}

export async function getNoteBySlug(profileId: number, slug: string) {
  const rows = await db
    .select()
    .from(notes)
    .where(and(eq(notes.profileId, profileId), eq(notes.slug, slug), eq(notes.status, 'published')))
    .limit(1)
  return rows[0] ?? null
}

// 프로필의 경력 (정렬: order asc).
export async function getExperiencesByProfile(profileId: number) {
  return db
    .select()
    .from(experiences)
    .where(eq(experiences.profileId, profileId))
    .orderBy(asc(experiences.order))
}
