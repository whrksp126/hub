import 'server-only'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { apiKeys } from '@/db/schema'

// 내 에이전트 API 키 목록 (사용자별).
export async function listMyApiKeys(userId: number) {
  return db.select().from(apiKeys).where(eq(apiKeys.userId, userId)).orderBy(desc(apiKeys.createdAt))
}

// 내 소유 키인지 확인.
export async function ownsApiKey(userId: number, keyId: number) {
  const r = await db
    .select({ id: apiKeys.id })
    .from(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
    .limit(1)
  return !!r[0]
}
