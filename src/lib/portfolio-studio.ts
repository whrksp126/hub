import 'server-only'
import { asc, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { experiences, notes, profiles, projects, users } from '@/db/schema'

// 멀티유저: 로그인한 사용자가 소유한 프로필(첫 번째).
export async function getMyProfile(userId: number) {
  const rows = await db.select().from(profiles).where(eq(profiles.userId, userId)).orderBy(asc(profiles.id)).limit(1)
  return rows[0] ?? null
}

// 내가 소유한 포트폴리오 전부(다중 관리).
export async function getMyProfiles(userId: number) {
  return db.select().from(profiles).where(eq(profiles.userId, userId)).orderBy(asc(profiles.id))
}

// 편집 권한이 있는 프로필만 반환(소유자이거나 운영자). 없으면 null.
export async function getEditableProfile(userId: number, isAdmin: boolean, profileId: number) {
  const rows = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1)
  const p = rows[0]
  if (!p) return null
  if (p.userId === userId || isAdmin) return p
  return null
}

// 운영자(admin) 개요: 전체 사용자 + 각자의 프로필(주소·상태).
export async function getAdminOverview() {
  const userRows = await db.select().from(users).orderBy(asc(users.id))
  const profileRows = await db
    .select({
      id: profiles.id,
      userId: profiles.userId,
      username: profiles.username,
      name: profiles.name,
      status: profiles.status,
      updatedAt: profiles.updatedAt,
    })
    .from(profiles)
    .orderBy(desc(profiles.updatedAt))
  return { users: userRows, profiles: profileRows }
}

export async function countAll() {
  const c = async (t: typeof users | typeof profiles | typeof projects) =>
    (await db.select({ n: sql<number>`count(*)` }).from(t))[0]?.n ?? 0
  return { users: await c(users), profiles: await c(profiles), projects: await c(projects) }
}

export async function getStudioProjects(profileId: number) {
  return db.select().from(projects).where(eq(projects.profileId, profileId)).orderBy(asc(projects.order))
}

export async function getStudioProject(id: number) {
  return (await db.select().from(projects).where(eq(projects.id, id)).limit(1))[0] ?? null
}

export async function getStudioExperiences(profileId: number) {
  return db
    .select()
    .from(experiences)
    .where(eq(experiences.profileId, profileId))
    .orderBy(asc(experiences.order))
}

export async function getStudioExperience(id: number) {
  return (await db.select().from(experiences).where(eq(experiences.id, id)).limit(1))[0] ?? null
}

export async function getStudioNotes(profileId: number) {
  return db.select().from(notes).where(eq(notes.profileId, profileId)).orderBy(asc(notes.order))
}

export async function getStudioNote(id: number) {
  return (await db.select().from(notes).where(eq(notes.id, id)).limit(1))[0] ?? null
}
