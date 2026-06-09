import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser, verifyApiKey } from '@/lib/auth'

// 세션(관리자) 또는 API Key(에이전트) 인증. 둘 다 실패하면 null.
export async function authorize(req: NextRequest) {
  const user = await getCurrentUser()
  if (user) return { kind: 'session' as const, user }
  const key = await verifyApiKey(req.headers.get('authorization'))
  if (key) return { kind: 'apikey' as const, key }
  return null
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}
