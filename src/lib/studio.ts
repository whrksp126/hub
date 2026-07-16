import 'server-only'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { apiKeys, notifications } from '@/db/schema'

// 내 알림(에이전트 자율 발행 등). 최신순.
export async function getMyNotifications(userId: number, limit = 15) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
}

// 안 읽은 알림 수.
export async function unreadNotificationCount(userId: number) {
  const rows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
  return rows.length
}

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
