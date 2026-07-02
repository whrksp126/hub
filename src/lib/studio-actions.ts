'use server'

import { and, eq, isNull } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { apiKeys, profiles, users } from '@/db/schema'
import {
  createSession,
  destroySession,
  generateApiKey,
  getCurrentUser,
  hasAnyUser,
  hashPassword,
  verifyPassword,
} from '@/lib/auth'

function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w가-힣-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return base || 'me'
}

// profiles.username 유일성 보장(중복이면 -2, -3 … 붙임).
async function uniqueProfileSlug(base: string): Promise<string> {
  let slug = base
  for (let i = 2; ; i++) {
    const hit = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.username, slug)).limit(1)
    if (!hit[0]) return slug
    slug = `${base}-${i}`
  }
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

// 공개 회원가입(멀티유저).
// 맨 처음 가입자 = 운영자(admin): 소유자 없는 시드 프로필(geonho 등)을 인계받는다.
// 이후 가입자 = 일반 사용자(user): 본인 새 프로필을 만든다.
export async function signupAction(_prev: string | null, formData: FormData): Promise<string | null> {
  const username = String(formData.get('username') || '').trim()
  const password = String(formData.get('password') || '')
  const name = String(formData.get('name') || '').trim()
  if (!username || password.length < 8) return '아이디와 8자 이상 비밀번호가 필요합니다.'

  const taken = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1)
  if (taken[0]) return '이미 사용 중인 아이디입니다.'

  const isFirst = !(await hasAnyUser())
  const role = isFirst ? 'admin' : 'user'
  const passwordHash = await hashPassword(password)
  const [user] = await db.insert(users).values({ username, passwordHash, name: name || null, role }).returning()

  const orphans = isFirst
    ? await db.select({ id: profiles.id }).from(profiles).where(isNull(profiles.userId))
    : []
  if (orphans.length > 0) {
    // 운영자: 시드된 소유자 없는 프로필 전부 인계.
    for (const o of orphans) {
      await db.update(profiles).set({ userId: user.id }).where(eq(profiles.id, o.id))
    }
  } else {
    // 새 프로필 생성(아이디 기반 고유 주소).
    await db.insert(profiles).values({
      userId: user.id,
      username: await uniqueProfileSlug(slugify(username)),
      name: name || username,
      status: 'draft',
    })
  }

  await createSession({ id: user.id, username: user.username, role: user.role })
  redirect('/studio')
}

export async function logoutAction() {
  await destroySession()
  redirect('/studio/login')
}

// ── 운영자(admin) ────────────────────────────────────────────────────
// 사용자 삭제(프로필·프로젝트·경력 cascade). 본인은 삭제 불가.
export async function deleteUserAction(formData: FormData) {
  const me = await getCurrentUser()
  if (!me || me.role !== 'admin') redirect('/studio')
  const id = Number(formData.get('id') || 0)
  if (id && id !== me.id) {
    await db.delete(users).where(eq(users.id, id))
  }
  redirect('/studio')
}

// 권한 변경(admin ↔ user). 본인 권한은 못 내림(잠김 방지).
export async function setUserRoleAction(formData: FormData) {
  const me = await getCurrentUser()
  if (!me || me.role !== 'admin') redirect('/studio')
  const id = Number(formData.get('id') || 0)
  const role = String(formData.get('role') || '') === 'admin' ? 'admin' : 'user'
  if (id && id !== me.id) {
    await db.update(users).set({ role }).where(eq(users.id, id))
  }
  redirect('/studio')
}

// ── 에이전트 API 키 ──────────────────────────────────────────────────
export async function createApiKeyAction(
  _prev: { key?: string; error?: string } | null,
  formData: FormData,
): Promise<{ key?: string; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: '로그인이 필요합니다.' }
  const name = String(formData.get('name') || '').trim() || '에이전트 키'
  const { key, prefix, keyHash } = generateApiKey()
  await db.insert(apiKeys).values({ userId: user.id, name, prefix, keyHash })
  return { key } // 평문은 이때 1회만 노출
}

export async function revokeApiKeyAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) redirect('/studio/login')
  const id = Number(formData.get('id') || 0)
  // 본인 소유 키만 폐기.
  if (id) await db.update(apiKeys).set({ revokedAt: new Date() }).where(and(eq(apiKeys.id, id), eq(apiKeys.userId, user.id)))
  redirect('/studio/keys')
}
