import { randomBytes } from 'crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/db'
import { media } from '@/db/schema'
import { getCurrentUser, verifyApiKey } from '@/lib/auth'
import { uploadMedia } from '@/lib/s3'

export const runtime = 'nodejs'

// 이미지 업로드 → MinIO 저장 → media 레코드 생성. 세션(관리자) 또는 API Key(에이전트) 인증.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  const apiKey = user ? null : await verifyApiKey(req.headers.get('authorization'))
  if (!user && !apiKey) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'multipart/form-data 필요' }, { status: 400 })
  }
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file 필드가 필요합니다.' }, { status: 400 })
  }
  const alt = (String(form.get('alt') || '') || null) as string | null

  const buf = Buffer.from(await file.arrayBuffer())
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
  const key = `${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`

  let url: string
  try {
    url = await uploadMedia(key, buf, file.type)
  } catch (e) {
    return NextResponse.json(
      { error: 'MinIO 업로드 실패: ' + (e as Error).message },
      { status: 500 },
    )
  }

  const [row] = await db
    .insert(media)
    .values({ filename: key, url, alt, mime: file.type, size: file.size })
    .returning()

  return NextResponse.json({
    id: row.id,
    url,
    key,
    name: file.name,
    size: file.size,
    type: file.type,
  })
}
