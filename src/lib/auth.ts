import 'server-only'
import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHash } from 'crypto'
import { promisify } from 'util'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SignJWT, jwtVerify } from 'jose'
import { db } from '@/db'
import { apiKeys, users } from '@/db/schema'
import { and, eq, isNull, sql } from 'drizzle-orm'

const scrypt = promisify(scryptCb)
const SESSION_COOKIE = 'hub_session'
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-insecure-secret-change-me')

// ── 비밀번호 해시 (scrypt) ───────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const derived = (await scrypt(password, salt, 64)) as Buffer
  return `${salt.toString('hex')}:${derived.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':')
  if (!saltHex || !hashHex) return false
  const derived = (await scrypt(password, Buffer.from(saltHex, 'hex'), 64)) as Buffer
  const expected = Buffer.from(hashHex, 'hex')
  return derived.length === expected.length && timingSafeEqual(derived, expected)
}

// ── 세션 (jose JWT httpOnly 쿠키) ────────────────────────────────────
type SessionPayload = { uid: number; username: string; role: string }

export async function createSession(user: { id: number; username: string; role: string }) {
  const token = await new SignJWT({ uid: user.id, username: user.username, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret)
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function destroySession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null
  const rows = await db.select().from(users).where(eq(users.id, session.uid)).limit(1)
  return rows[0] ?? null
}

// 보호된 studio 페이지에서 호출 — 미로그인 시 로그인으로 리다이렉트.
export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/studio/login')
  return user
}

// 관리자가 한 명도 없으면 최초 설정(setup) 필요.
export async function hasAnyUser(): Promise<boolean> {
  const rows = await db.select({ n: sql<number>`count(*)` }).from(users)
  return (rows[0]?.n ?? 0) > 0
}

// ── 에이전트 API 키 ──────────────────────────────────────────────────
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

// 새 키 생성: 평문(1회 노출) + 저장용 prefix/hash 반환.
export function generateApiKey() {
  const raw = randomBytes(24).toString('hex')
  const key = `hub_${raw}`
  return { key, prefix: key.slice(0, 11), keyHash: hashApiKey(key) }
}

// 요청의 Bearer 키 검증 → 유효하면 ApiKey 행 반환.
export async function verifyApiKey(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) return null
  const key = authHeader.slice(7).trim()
  const keyHash = hashApiKey(key)
  const rows = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)))
    .limit(1)
  const row = rows[0]
  if (!row) return null
  // lastUsedAt 갱신(비차단)
  db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, row.id)).run()
  return row
}
