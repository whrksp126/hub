import { randomBytes } from 'crypto'
import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { experiences, media, notes, profiles, projects } from '@/db/schema'
import { verifyApiKey } from '@/lib/auth'
import { uploadMedia } from '@/lib/s3'
import { safeRevalidate } from '@/lib/revalidate'
import { pfPath, pfUrl, SITE_URL } from '@/lib/seo'

export const runtime = 'nodejs'
export const maxDuration = 60

// ────────────────────────────────────────────────────────────────────────────
// HubGmate MCP 서버 — 프로젝트 담당 에이전트가 자기 레포를 분석해 포트폴리오를
// 자율 발행한다. 인증=프로젝트별 API Key(Bearer). 안전장치: 생성물은 전부 draft
// 프로필 아래로 들어가 사용자가 /studio에서 검토·공개하기 전까진 비공개.
// ────────────────────────────────────────────────────────────────────────────

const HUB = SITE_URL

// ── helpers ──────────────────────────────────────────────────────────────────

function slugify(input: string): string {
  return (
    input
      .toString()
      .trim()
      .toLowerCase()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || `item-${randomBytes(3).toString('hex')}`
  )
}

// 인증 컨텍스트에서 userId 추출 (withMcpAuth가 authInfo.extra에 심어둠).
function userIdOf(extra: unknown): number | null {
  const info = (extra as { authInfo?: { extra?: { userId?: number | null } } })?.authInfo
  return info?.extra?.userId ?? null
}

function ok(payload: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }] }
}

// 프로필의 공개 경로 무효화(발행/갱신 즉시 반영). draft면 사실상 no-op.
function revalidateProfile(username: string) {
  safeRevalidate(
    pfPath(username),
    pfPath(username, '/projects'),
    pfPath(username, '/experience'),
    pfPath(username, '/deep-dives'),
  )
}
function fail(message: string) {
  return { content: [{ type: 'text' as const, text: `⚠️ ${message}` }], isError: true }
}

// username 프로필을 찾아 소유권 확인. 없으면 null.
async function findOwnedProfile(userId: number | null, username: string) {
  const rows = await db.select().from(profiles).where(eq(profiles.username, username)).limit(1)
  const p = rows[0]
  if (!p) return { profile: null, error: null as string | null }
  // 소유자 불일치(다른 사용자 프로필)면 거부. 시드(userId=null)는 이 키 소유자가 클레임 가능.
  if (p.userId != null && userId != null && p.userId !== userId) {
    return { profile: null, error: `프로필 '${username}'은 이 키의 소유가 아닙니다.` }
  }
  return { profile: p, error: null }
}

// URL 또는 base64로 미디어 저장 → media 행 반환.
async function storeMedia(input: {
  url?: string
  dataBase64?: string
  filename?: string
  alt?: string | null
  mime?: string
}) {
  let buf: Buffer
  let mime = input.mime || 'application/octet-stream'
  if (input.url) {
    const res = await fetch(input.url)
    if (!res.ok) throw new Error(`이미지 URL 가져오기 실패(${res.status}): ${input.url}`)
    buf = Buffer.from(await res.arrayBuffer())
    mime = input.mime || res.headers.get('content-type') || mime
  } else if (input.dataBase64) {
    const b64 = input.dataBase64.replace(/^data:[^;]+;base64,/, '')
    buf = Buffer.from(b64, 'base64')
  } else {
    throw new Error('url 또는 dataBase64 중 하나가 필요합니다.')
  }
  const nameExt = (input.filename?.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const mimeExt = mime.split('/').pop()?.replace(/[^a-z0-9]/g, '') || 'bin'
  const ext = nameExt || mimeExt
  const key = `${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`
  const url = await uploadMedia(key, buf, mime)
  const [row] = await db
    .insert(media)
    .values({ filename: key, url, alt: input.alt ?? null, mime, size: buf.length })
    .returning()
  return row
}

// ── MCP 서버 정의 ─────────────────────────────────────────────────────────────

const handler = createMcpHandler(
  (server) => {
    // 1) 현재 인증/프로필 상태
    server.tool(
      'whoami',
      '현재 API 키로 접근 가능한 프로필 목록과 상태를 반환한다. 발행 전 상태 확인용.',
      {},
      async (_args, extra) => {
        const userId = userIdOf(extra)
        const rows = await db.select().from(profiles)
        const mine = rows.filter((p) => p.userId == null || p.userId === userId)
        return ok({
          hub: HUB,
          profiles: mine.map((p) => ({
            username: p.username,
            name: p.name,
            status: p.status,
            url: pfUrl(p.username),
          })),
          hint: '프로필이 없으면 ensure_profile로 생성하세요. 모든 발행물은 draft로 등록됩니다.',
        })
      },
    )

    // 2) 특정 프로필의 기존 콘텐츠(멱등 갱신용 id/slug)
    server.tool(
      'list_content',
      '한 프로필의 기존 프로젝트·경력·딥다이브를 나열한다(멱등 발행: 있으면 갱신, 없으면 생성 판단용).',
      { username: z.string().describe('대상 프로필 username') },
      async ({ username }, extra) => {
        const userId = userIdOf(extra)
        const { profile, error } = await findOwnedProfile(userId, username)
        if (error) return fail(error)
        if (!profile) return fail(`프로필 '${username}' 없음. 먼저 ensure_profile 호출.`)
        const [prjs, exps, nts] = await Promise.all([
          db.select().from(projects).where(eq(projects.profileId, profile.id)),
          db.select().from(experiences).where(eq(experiences.profileId, profile.id)),
          db.select().from(notes).where(eq(notes.profileId, profile.id)),
        ])
        return ok({
          profile: { username: profile.username, status: profile.status },
          projects: prjs.map((p) => ({ id: p.id, slug: p.slug, title: p.title, status: p.status })),
          experiences: exps.map((e) => ({ id: e.id, company: e.company, role: e.role })),
          deep_dives: nts.map((n) => ({ id: n.id, slug: n.slug, title: n.title, status: n.status })),
        })
      },
    )

    // 3) 프로필 생성/갱신 (프로젝트=별도 프로필). 신규는 draft.
    server.tool(
      'ensure_profile',
      '이 프로젝트의 포트폴리오 프로필을 생성하거나(없으면) 갱신한다. 신규는 draft 상태. username은 공개 URL(/p/<username>)이 된다.',
      {
        username: z.string().describe('공개 URL slug (예: orderandgo). 소문자/숫자/하이픈.'),
        name: z.string().describe('표시 이름 (프로젝트명 또는 소유자명)'),
        title: z.string().optional().describe('직함/한줄 분류'),
        headline: z.string().optional().describe('히어로 대문자 헤드라인'),
        tagline: z.string().optional().describe('한 줄 소개'),
        bio: z.string().optional(),
        intro: z.string().optional().describe('히어로 본문 단락'),
        email: z.string().optional(),
        github: z.string().optional(),
        location: z.string().optional(),
        accent: z.string().optional().describe('테마 강조색 hex (기본 #F1531B)'),
        skills: z
          .array(z.object({ area: z.string(), items: z.array(z.string()) }))
          .optional()
          .describe('스킬 그룹 [{area, items[]}]'),
      },
      async (args, extra) => {
        const userId = userIdOf(extra)
        const username = slugify(args.username)
        const { profile, error } = await findOwnedProfile(userId, username)
        if (error) return fail(error)
        const fields = {
          name: args.name,
          title: args.title,
          headline: args.headline,
          tagline: args.tagline,
          bio: args.bio,
          intro: args.intro,
          email: args.email,
          github: args.github,
          location: args.location,
          accent: args.accent || undefined,
          skills: args.skills,
        }
        // undefined 필드는 제외(부분 갱신).
        const set = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined))
        if (profile) {
          await db
            .update(profiles)
            .set({ ...set, userId: profile.userId ?? userId ?? undefined })
            .where(eq(profiles.id, profile.id))
          return ok({ username, url: pfUrl(username), status: profile.status, created: false })
        }
        const [row] = await db
          .insert(profiles)
          .values({ username, name: args.name, userId: userId ?? undefined, status: 'draft', ...set })
          .returning()
        return ok({
          username,
          url: pfUrl(username),
          status: row.status,
          created: true,
          note: 'draft로 생성됨. /studio에서 검토 후 공개하세요.',
        })
      },
    )

    // 4) 미디어 업로드 (URL 또는 base64) → id 반환. cover/섹션에 연결.
    server.tool(
      'upload_media',
      '이미지/미디어를 MinIO에 저장하고 media id를 반환한다. url(가져오기) 또는 dataBase64 중 하나. 반환 id를 cover/섹션 media에 연결한다.',
      {
        url: z.string().optional().describe('가져올 공개 이미지 URL'),
        dataBase64: z.string().optional().describe('base64 인코딩 이미지 데이터'),
        filename: z.string().optional().describe('확장자 추론용 파일명'),
        alt: z.string().optional().describe('대체 텍스트(SEO/접근성)'),
        mime: z.string().optional(),
      },
      async (args) => {
        try {
          const row = await storeMedia(args)
          return ok({ id: row.id, url: row.url })
        } catch (e) {
          return fail((e as Error).message)
        }
      },
    )

    // 5) 프로젝트(케이스 스터디) 생성/갱신. slug 기준 멱등. draft.
    server.tool(
      'upsert_project',
      '포트폴리오 프로젝트(케이스 스터디)를 생성/갱신한다. (profile, slug) 기준 멱등. 항상 draft. 구조는 hubgmate_content_guide 프롬프트 참고.',
      {
        username: z.string(),
        slug: z.string().describe('프로필 내 고유 slug'),
        title: z.string(),
        titleKr: z.string().optional(),
        tag: z.string().optional().describe('예: SaaS · 주문/결제'),
        year: z.string().optional().describe('예: 2023 — 운영 중'),
        role: z.string().optional().describe('실제 역할만. 추정 금지.'),
        url: z.string().optional().describe('라이브 URL'),
        summary: z.string().optional(),
        metrics: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
        sections: z
          .array(
            z.object({
              heading: z.string(),
              body: z.string().optional(),
              bullets: z.array(z.string()).optional(),
              kind: z
                .enum(['default', 'lead', 'features', 'challenge', 'timeline', 'steps', 'diagram', 'erd', 'gallery', 'specs'])
                .optional(),
              media: z.array(z.any()).optional(),
            }),
          )
          .optional(),
        stack: z.array(z.string()).optional(),
        coverId: z.number().optional().describe('upload_media가 반환한 커버 id'),
        featured: z.boolean().optional(),
      },
      async (args, extra) => {
        const userId = userIdOf(extra)
        const { profile, error } = await findOwnedProfile(userId, args.username)
        if (error) return fail(error)
        if (!profile) return fail(`프로필 '${args.username}' 없음. 먼저 ensure_profile.`)
        const slug = slugify(args.slug)
        const values = {
          profileId: profile.id,
          slug,
          title: args.title,
          titleKr: args.titleKr,
          tag: args.tag,
          year: args.year,
          role: args.role,
          url: args.url,
          summary: args.summary,
          metrics: args.metrics,
          sections: args.sections,
          stack: args.stack,
          coverId: args.coverId,
          featured: args.featured ?? false,
          status: 'draft' as const,
        }
        const existing = await db
          .select()
          .from(projects)
          .where(and(eq(projects.profileId, profile.id), eq(projects.slug, slug)))
          .limit(1)
        let id: number
        if (existing[0]) {
          await db.update(projects).set(values).where(eq(projects.id, existing[0].id))
          id = existing[0].id
        } else {
          const [row] = await db.insert(projects).values(values).returning()
          id = row.id
        }
        revalidateProfile(args.username)
        return ok({ id, slug, url: pfUrl(args.username, `/projects/${slug}`), status: 'draft', updated: !!existing[0] })
      },
    )

    // 6) 경력 항목 생성/갱신. id로 갱신, 없으면 생성.
    server.tool(
      'upsert_experience',
      '경력 항목을 생성/갱신한다. id를 주면 갱신, 없으면 생성. 프로필이 draft면 비공개.',
      {
        username: z.string(),
        id: z.number().optional().describe('갱신할 경력 id (list_content로 확인)'),
        company: z.string(),
        role: z.string().optional(),
        period: z.string().optional().describe('예: 2023.06 — 2026.02'),
        length: z.string().optional().describe('예: 2년 9개월'),
        context: z.string().optional(),
        current: z.boolean().optional(),
        points: z.array(z.string()).optional().describe('핵심 성과 불릿'),
        stack: z.array(z.string()).optional(),
      },
      async (args, extra) => {
        const userId = userIdOf(extra)
        const { profile, error } = await findOwnedProfile(userId, args.username)
        if (error) return fail(error)
        if (!profile) return fail(`프로필 '${args.username}' 없음. 먼저 ensure_profile.`)
        const values = {
          profileId: profile.id,
          company: args.company,
          role: args.role,
          period: args.period,
          length: args.length,
          context: args.context,
          current: args.current ?? false,
          points: args.points,
          stack: args.stack,
        }
        let id: number
        if (args.id) {
          const owned = await db
            .select()
            .from(experiences)
            .where(and(eq(experiences.id, args.id), eq(experiences.profileId, profile.id)))
            .limit(1)
          if (!owned[0]) return fail(`경력 id ${args.id}는 이 프로필 소유가 아닙니다.`)
          await db.update(experiences).set(values).where(eq(experiences.id, args.id))
          id = args.id
        } else {
          const [row] = await db.insert(experiences).values(values).returning()
          id = row.id
        }
        revalidateProfile(args.username)
        return ok({ id, company: args.company, updated: !!args.id })
      },
    )

    // 7) 딥다이브(기술 글) 생성/갱신. slug 기준 멱등. draft.
    server.tool(
      'upsert_deep_dive',
      '딥다이브(기술 글)를 생성/갱신한다. (profile, slug) 기준 멱등. content는 NoteBlock 배열. 항상 draft.',
      {
        username: z.string(),
        slug: z.string(),
        title: z.string(),
        category: z.string().optional().describe('예: 아키텍처 · 알고리즘'),
        date: z.string().optional().describe('표시용 예: 2026.04'),
        readTime: z.string().optional().describe('예: 8분'),
        excerpt: z.string().optional(),
        coverId: z.number().optional(),
        content: z
          .array(z.object({ type: z.string() }).passthrough())
          .describe('NoteBlock[] — {type:h2|h3|p|quote|callout|code|list|table|image|video|divider, ...}'),
        featured: z.boolean().optional(),
      },
      async (args, extra) => {
        const userId = userIdOf(extra)
        const { profile, error } = await findOwnedProfile(userId, args.username)
        if (error) return fail(error)
        if (!profile) return fail(`프로필 '${args.username}' 없음. 먼저 ensure_profile.`)
        const slug = slugify(args.slug)
        const values = {
          profileId: profile.id,
          slug,
          title: args.title,
          category: args.category,
          date: args.date,
          readTime: args.readTime,
          excerpt: args.excerpt,
          coverId: args.coverId,
          content: args.content as never,
          featured: args.featured ?? false,
          status: 'draft' as const,
        }
        const existing = await db
          .select()
          .from(notes)
          .where(and(eq(notes.profileId, profile.id), eq(notes.slug, slug)))
          .limit(1)
        let id: number
        if (existing[0]) {
          await db.update(notes).set(values).where(eq(notes.id, existing[0].id))
          id = existing[0].id
        } else {
          const [row] = await db.insert(notes).values(values).returning()
          id = row.id
        }
        revalidateProfile(args.username)
        return ok({ id, slug, url: pfUrl(args.username, `/deep-dives/${slug}`), status: 'draft', updated: !!existing[0] })
      },
    )

    // 콘텐츠 구성 가이드 (프롬프트) — 비-Claude 에이전트도 서버에서 규칙을 받는다.
    server.prompt(
      'hubgmate_content_guide',
      'HubGmate 포트폴리오 품질 규칙 — 레포 분석부터 케이스 스터디/딥다이브 구조까지. 발행 전에 이 프롬프트를 먼저 읽어라.',
      async () => ({
        messages: [
          {
            role: 'user' as const,
            content: { type: 'text' as const, text: CONTENT_GUIDE },
          },
        ],
      }),
    )
  },
  {
    serverInfo: { name: 'hubgmate', version: '1.0.0' },
  },
  { basePath: '/api', disableSse: true, maxDuration: 60 },
)

// ── 콘텐츠 구성 가이드 본문 ─────────────────────────────────────────────────
const CONTENT_GUIDE = `당신은 이 저장소를 담당하는 에이전트다. HubGmate(hub.ghmate.com)에 이 프로젝트의 포트폴리오를 자율 발행한다. 아래 규칙을 지켜라.

## 발행 순서
1. whoami로 프로필 존재 확인.
2. ensure_profile로 프로필 생성/갱신 (username=프로젝트 slug, name, title, tagline, skills).
3. 이미지/스크린샷은 upload_media로 먼저 올려 id 확보 → cover/섹션 media에 연결.
4. upsert_project로 케이스 스터디, upsert_experience로 경력, upsert_deep_dive로 기술 글 발행.
5. 전부 draft로 등록된다. 사용자가 /studio에서 검토 후 공개한다.

## 정직성 (최우선)
- 실제 커밋/코드/README에서 확인되는 사실만 쓴다. 역할·성과·기술스택을 추정하거나 부풀리지 마라.
- 수치(metrics)는 근거가 있을 때만. 없으면 생략.
- 확인 불가한 내용은 넣지 않는다.

## 케이스 스터디(upsert_project) 구조 — "문제 → 해결 → 결과"
- title/titleKr, tag(분류), year(기간/상태), role(실제 역할), url(라이브), summary(2~3문장).
- metrics: 임팩트 지표 [{value:"40%", label:"응답시간 단축"}].
- sections: kind로 시각 유형 지정:
  - lead: 도입/개요 (큰 문단)
  - challenge: 문제/제약
  - features: 핵심 기능 (bullets)
  - steps / timeline: 진행 흐름
  - diagram: mermaid flowchart/sequence (body에 mermaid 코드) — 아키텍처/흐름
  - erd: 데이터 모델 (body에 erDiagram 텍스트) — MySQL Workbench 스타일로 렌더됨
  - gallery: 스크린샷/영상 (media 배열)
  - specs: 스펙 태그
- stack: 실제 사용 기술만.

## 딥다이브(upsert_deep_dive) — 기술 글
- content = NoteBlock[]. 블록 타입: h2, h3, p, quote, callout, code({text,lang}), list({items,ordered?}), table({header,rows}), image({mediaId,caption}), video, divider.
- 문제 정의 → 접근 → 트레이드오프 → 결과 흐름. 코드 블록·다이어그램 적극 활용.

## 미디어
- 스크린샷은 실제 화면을 담아라(가짜 목업 금지). upload_media(dataBase64=로컬파일 base64) 후 반환 id 사용.
- 모든 이미지에 alt(설명) 필수.

멱등: 같은 slug로 다시 upsert하면 갱신된다. list_content로 기존 항목을 먼저 확인하라.`

// ── 인증: 프로젝트별 API Key(Bearer) 검증 → userId를 authInfo.extra에 실음 ──────
const authed = withMcpAuth(
  handler,
  async (_req, bearer) => {
    const row = await verifyApiKey(bearer ? `Bearer ${bearer}` : null)
    if (!row) return undefined
    return {
      token: bearer ?? '',
      clientId: String(row.userId ?? 'hubgmate'),
      scopes: (row.scopes as string[]) ?? [],
      extra: { userId: row.userId ?? null, keyId: row.id },
    }
  },
  { required: true },
)

export { authed as GET, authed as POST, authed as DELETE }
