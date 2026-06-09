import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { authorize, jsonError } from './api-auth'
import {
  createContent,
  deleteContent,
  getContent,
  listContent,
  updateContent,
} from './content-api'
import type { ContentType } from './content-types'

type Ctx = { params: Promise<{ id: string }> }

export function collectionHandlers(type: ContentType) {
  return {
    // 목록: 인증 시 초안 포함, 비인증 시 발행된 것만
    async GET(req: NextRequest) {
      const auth = await authorize(req)
      const rows = await listContent(type, { all: !!auth })
      return NextResponse.json({ data: rows })
    },
    // 생성 (에이전트/관리자)
    async POST(req: NextRequest) {
      const auth = await authorize(req)
      if (!auth) return jsonError('인증 필요 (Authorization: Bearer <API Key>)', 401)
      const body = await req.json().catch(() => null)
      if (!body) return jsonError('JSON 본문이 필요합니다.', 400)
      const row = await createContent(type, body)
      return NextResponse.json(row, { status: 201 })
    },
  }
}

export function itemHandlers(type: ContentType) {
  return {
    async GET(req: NextRequest, ctx: Ctx) {
      const { id } = await ctx.params
      const row = await getContent(type, Number(id))
      if (!row) return jsonError('찾을 수 없음', 404)
      if (row.status !== 'published' && !(await authorize(req))) {
        return jsonError('찾을 수 없음', 404)
      }
      return NextResponse.json(row)
    },
    async PATCH(req: NextRequest, ctx: Ctx) {
      if (!(await authorize(req))) return jsonError('인증 필요', 401)
      const { id } = await ctx.params
      const body = await req.json().catch(() => null)
      if (!body) return jsonError('JSON 본문이 필요합니다.', 400)
      const row = await updateContent(type, Number(id), body)
      if (!row) return jsonError('찾을 수 없음', 404)
      return NextResponse.json(row)
    },
    async DELETE(req: NextRequest, ctx: Ctx) {
      if (!(await authorize(req))) return jsonError('인증 필요', 401)
      const { id } = await ctx.params
      const ok = await deleteContent(type, Number(id))
      if (!ok) return jsonError('찾을 수 없음', 404)
      return NextResponse.json({ ok: true })
    },
  }
}
