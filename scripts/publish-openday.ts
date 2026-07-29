/**
 * Openday 프로젝트 상세 + 딥다이브 3편을 비파괴적으로 발행한다.
 *
 * 재료: openday 담당 에이전트가 만든 portfolio_assets (문서/스크린샷/영상/딥다이브).
 * 1) 자산을 MinIO(hub/media)에 업로드하고 media 행을 upsert (파일명 기준 재실행 안전)
 * 2) projects.openday 행을 UPDATE (metrics/sections/stack/summary/url/cover)
 * 3) notes 3편을 마크다운에서 NoteBlock[]으로 변환해 upsert
 *
 * 실행: pnpm exec tsx scripts/publish-openday.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// ── env(.env.local) 로드 ──────────────────────────────────────────────
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const ASSETS = '/Users/whrksp126/other/project/openday/openday_service/portfolio_assets'
const CROPPED = '/private/tmp/claude-501/-Users-whrksp126-other-project-hub/49c8cf8b-a013-4e09-bfc6-5de586e2cf5a/scratchpad/openday'
const USERNAME = 'geonho'

const endpoint = (process.env.S3_ENDPOINT || 'https://objectstore.ghmate.com').replace(/\/$/, '')
const bucket = process.env.S3_BUCKET || 'hub'
const s3 = new S3Client({
  endpoint,
  region: process.env.S3_REGION || 'us-east-1',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
})
const publicUrl = (key: string) => `${endpoint}/${bucket}/${key}`

const sqlite = new Database(process.env.DATABASE_PATH || './data/hub.db')
sqlite.pragma('foreign_keys = ON')

const mime = (f: string) =>
  f.endsWith('.png') ? 'image/png' : f.endsWith('.jpg') ? 'image/jpeg' : f.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream'

/** 업로드 + media 행 upsert(파일명 기준). 반환 = media.id */
async function putMedia(key: string, file: string, alt: string, width: number, height: number): Promise<number> {
  const body = fs.readFileSync(file)
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: `media/${key}`, Body: body, ContentType: mime(key) }))
  const url = publicUrl(`media/${key}`)
  const now = Math.floor(Date.now() / 1000)
  const exist = sqlite.prepare('select id from media where filename=?').get(key) as { id: number } | undefined
  if (exist) {
    sqlite.prepare('update media set url=?, alt=?, width=?, height=?, mime=?, size=? where id=?')
      .run(url, alt, width, height, mime(key), body.length, exist.id)
    return exist.id
  }
  const r = sqlite
    .prepare('insert into media (filename,url,alt,width,height,mime,size,created_at) values (?,?,?,?,?,?,?,?)')
    .run(key, url, alt, width, height, mime(key), body.length, now)
  return Number(r.lastInsertRowid)
}

/** 포스터 등 media 행이 필요 없는 오브젝트는 URL만 반환 */
async function putObject(key: string, file: string): Promise<string> {
  await s3.send(
    new PutObjectCommand({ Bucket: bucket, Key: `media/${key}`, Body: fs.readFileSync(file), ContentType: mime(key) }),
  )
  return publicUrl(`media/${key}`)
}

// ── 1. 자산 업로드 ────────────────────────────────────────────────────
type Up = { name: string; key: string; file: string; alt: string; w: number; h: number }
const UPLOADS: Up[] = [
  // 영상
  { name: 'videoEditor', key: 'openday-editor-compose.mp4', file: `${ASSETS}/videos/editor-compose.mp4`, alt: '모듈형 에디터에서 초대장을 조합하는 시연', w: 1920, h: 1080 },
  { name: 'videoInvitation', key: 'openday-mobile-invitation.mp4', file: `${ASSETS}/videos/mobile-invitation.mp4`, alt: '발행된 모바일 초대장을 스크롤하는 시연', w: 1080, h: 2340 },
  // 스크린샷
  { name: 'shotDashboard', key: 'openday-dashboard.png', file: `${ASSETS}/screenshots/04-dashboard-desktop.png`, alt: '내 초대장 대시보드 — 행사별 초대장 카드', w: 2880, h: 3196 },
  { name: 'shotCatalog', key: 'openday-template-catalog.png', file: `${ASSETS}/screenshots/02-template-catalog-desktop.png`, alt: '카테고리별 템플릿 카탈로그', w: 2880, h: 3944 },
  { name: 'shotEditor', key: 'openday-editor.png', file: `${ASSETS}/screenshots/05-editor-desktop.png`, alt: '편집 패널과 모바일 실시간 프리뷰', w: 2880, h: 1800 },
  { name: 'shotStats', key: 'openday-stats.png', file: `${ASSETS}/screenshots/06-stats-desktop.png`, alt: '방문·참석·방명록 통계 화면', w: 2880, h: 2060 },
  { name: 'shotRsvp', key: 'openday-rsvp.png', file: `${ASSETS}/screenshots/07-rsvp-desktop.png`, alt: '참석 정보(RSVP) 관리 화면', w: 2880, h: 2268 },
  { name: 'shotGuestbook', key: 'openday-guestbook.png', file: `${ASSETS}/screenshots/09-guestbook-desktop.png`, alt: '방명록 관리 화면', w: 2880, h: 2864 },
  // 세로 긴 캡처 — 상단 크롭본
  { name: 'shotHome', key: 'openday-home-mobile.png', file: `${CROPPED}/home-mobile-top.png`, alt: '모바일 메인 랜딩', w: 804, h: 1700 },
  { name: 'shotPreview', key: 'openday-template-preview.png', file: `${CROPPED}/template-preview-top.png`, alt: '웨딩 템플릿 모바일 미리보기', w: 804, h: 1700 },
  { name: 'shotInvitation', key: 'openday-published-invitation.png', file: `${CROPPED}/published-invitation-top.png`, alt: '발행된 웨딩 초대장 공개 화면', w: 804, h: 1700 },
  // 딥다이브 다이어그램
  { name: 'dgModule', key: 'openday-dd-module-editor.png', file: `${ASSETS}/deepdives/01-json-module-editor/diagram/module-editor.png`, alt: '모듈 에디터 데이터 흐름', w: 1600, h: 900 },
  { name: 'dgCategory', key: 'openday-dd-category-rendering.png', file: `${ASSETS}/deepdives/02-category-aware-rendering/diagram/category-rendering.png`, alt: '카테고리 인지형 렌더링 구조', w: 1600, h: 900 },
  { name: 'dgPublish', key: 'openday-dd-publish-engagement.png', file: `${ASSETS}/deepdives/03-publish-share-engagement/diagram/publish-engagement.png`, alt: '발행과 참여의 순환', w: 1600, h: 900 },
]

const M: Record<string, number> = {}
for (const u of UPLOADS) {
  M[u.name] = await putMedia(u.key, u.file, u.alt, u.w, u.h)
  console.log(`[media] ${u.key} → #${M[u.name]}`)
}
const posterEditor = await putObject('openday-editor-compose-poster.jpg', `${ASSETS}/videos/editor-compose.poster.jpg`)
const posterInvitation = await putObject('openday-mobile-invitation-poster.jpg', `${ASSETS}/videos/mobile-invitation.poster.jpg`)
console.log('[media] 포스터 2개 업로드 완료')

// ── 2. 프로필/프로젝트 조회 ───────────────────────────────────────────
const profile = sqlite.prepare('select id from profiles where username=?').get(USERNAME) as { id: number }
if (!profile) throw new Error(`${USERNAME} 프로필 없음`)
const proj = sqlite.prepare('select id from projects where profile_id=? and slug=?').get(profile.id, 'openday') as { id: number }
if (!proj) throw new Error('openday 프로젝트 행 없음')

// ── 3. 딥다이브 마크다운 → NoteBlock[] ────────────────────────────────
type NoteBlock =
  | { type: 'h2' | 'h3' | 'p' | 'quote' | 'callout'; text: string }
  | { type: 'code'; text: string; lang?: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'table'; header?: string[]; rows: string[][] }
  | { type: 'image'; mediaId: number | null; caption?: string }
  | { type: 'video'; mediaId?: number | null; url?: string; caption?: string; poster?: string }
  | { type: 'divider' }

const stripCaption = (s: string) => s.replace(/^\*|\*$/g, '').replace(/^🎬\s*/, '').trim()

function parseDeepdive(md: string, assetMap: Record<string, { mediaId: number; poster?: string }>) {
  const fmEnd = md.indexOf('\n---', 4)
  const fm = md.slice(4, fmEnd)
  const meta: Record<string, string> = {}
  for (const line of fm.split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/)
    if (m) meta[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
  const lines = md.slice(fmEnd + 4).split('\n')
  const blocks: NoteBlock[] = []
  let i = 0
  const pushCaptionTo = (b: NoteBlock) => {
    let j = i
    while (j < lines.length && lines[j].trim() === '') j++
    if (j < lines.length && /^\*[^*].*\*$/.test(lines[j].trim())) {
      ;(b as { caption?: string }).caption = stripCaption(lines[j].trim())
      i = j + 1
    }
  }
  while (i < lines.length) {
    const raw = lines[i]
    const line = raw.trim()
    if (line === '') { i++; continue }
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim() || undefined
      const buf: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) buf.push(lines[i]), i++
      i++
      blocks.push({ type: 'code', text: buf.join('\n'), lang })
      continue
    }
    if (line.startsWith('### ')) { blocks.push({ type: 'h3', text: line.slice(4) }); i++; continue }
    if (line.startsWith('## ')) { blocks.push({ type: 'h2', text: line.slice(3) }); i++; continue }
    if (line.startsWith('> ')) { blocks.push({ type: 'callout', text: line.slice(2) }); i++; continue }
    if (line.startsWith('|')) {
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = lines[i].trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
        if (!cells.every((c) => /^-{2,}$/.test(c.replace(/:/g, '')))) rows.push(cells)
        i++
      }
      blocks.push({ type: 'table', header: rows[0], rows: rows.slice(1) })
      continue
    }
    if (/^[-*] /.test(line) || /^\d+\. /.test(line)) {
      const ordered = /^\d+\. /.test(line)
      const items: string[] = []
      while (i < lines.length && (/^[-*] /.test(lines[i].trim()) || /^\d+\. /.test(lines[i].trim()))) {
        items.push(lines[i].trim().replace(/^([-*]|\d+\.)\s+/, ''))
        i++
      }
      blocks.push({ type: 'list', items, ordered })
      continue
    }
    const img = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (img) {
      const a = assetMap[img[2]]
      const b: NoteBlock = { type: 'image', mediaId: a ? a.mediaId : null }
      blocks.push(b)
      i++
      pushCaptionTo(b)
      continue
    }
    const vid = line.match(/^<video\s+src="([^"]+)"/)
    if (vid) {
      const a = assetMap[vid[1]]
      const b: NoteBlock = { type: 'video', mediaId: a ? a.mediaId : null, poster: a?.poster }
      blocks.push(b)
      i++
      pushCaptionTo(b)
      continue
    }
    // 일반 문단(연속 줄 병합)
    const buf = [line]
    i++
    while (i < lines.length && lines[i].trim() !== '' && !/^(#{2,3} |[-*] |\d+\. |\||>|```|!\[|<video)/.test(lines[i].trim())) {
      buf.push(lines[i].trim())
      i++
    }
    blocks.push({ type: 'p', text: buf.join(' ') })
  }
  return { meta, blocks }
}

const DEEPDIVES = [
  {
    dir: '01-json-module-editor',
    slug: 'openday-json-module-editor',
    assets: {
      'diagram/module-editor.png': { mediaId: M.dgModule },
      'img/editor.png': { mediaId: M.shotEditor },
      'video/editor-compose.mp4': { mediaId: M.videoEditor, poster: posterEditor },
    },
  },
  {
    dir: '02-category-aware-rendering',
    slug: 'openday-category-aware-rendering',
    assets: {
      'diagram/category-rendering.png': { mediaId: M.dgCategory },
      'img/templates.png': { mediaId: M.shotCatalog },
      'video/mobile-invitation.mp4': { mediaId: M.videoInvitation, poster: posterInvitation },
    },
  },
  {
    dir: '03-publish-share-engagement',
    slug: 'openday-publish-share-engagement',
    assets: {
      'diagram/publish-engagement.png': { mediaId: M.dgPublish },
      'img/stats.png': { mediaId: M.shotStats },
      'video/mobile-invitation.mp4': { mediaId: M.videoInvitation, poster: posterInvitation },
    },
  },
]

const noteIds: number[] = []
let order = 14
for (const dd of DEEPDIVES) {
  const file = path.join(ASSETS, 'deepdives', dd.dir, `${dd.dir}.md`)
  const { meta, blocks } = parseDeepdive(fs.readFileSync(file, 'utf8'), dd.assets)
  const now = Math.floor(Date.now() / 1000)
  const exist = sqlite.prepare('select id from notes where profile_id=? and slug=?').get(profile.id, dd.slug) as
    | { id: number }
    | undefined
  const args = [
    meta.category ?? null,
    '2026.07',
    meta.reading_time ?? null,
    meta.title,
    meta.excerpt ?? null,
    JSON.stringify(blocks),
    order,
    'published',
    now,
    now,
  ]
  if (exist) {
    sqlite
      .prepare(
        'update notes set category=?, date=?, read_time=?, title=?, excerpt=?, content=?, "order"=?, status=?, published_at=?, updated_at=? where id=?',
      )
      .run(...args, exist.id)
    noteIds.push(exist.id)
    console.log(`[note] update #${exist.id} ${dd.slug} — ${blocks.length}블록`)
  } else {
    const r = sqlite
      .prepare(
        'insert into notes (profile_id,slug,category,date,read_time,title,excerpt,content,"order",status,published_at,updated_at,created_at) values (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      )
      .run(profile.id, dd.slug, ...args, now)
    noteIds.push(Number(r.lastInsertRowid))
    console.log(`[note] insert #${r.lastInsertRowid} ${dd.slug} — ${blocks.length}블록`)
  }
  order++
}

// ── 4. 프로젝트 상세 ──────────────────────────────────────────────────
const metrics = [
  { value: '10개', label: '웨딩·돌잔치·비즈니스·문화까지 행사 카테고리' },
  { value: '12종', label: '행사별 문구·모듈이 짜인 완성 템플릿' },
  { value: '20+', label: 'RSVP·방명록·지도·BGM 등 조합 가능한 모듈' },
]

const stack = [
  'Next.js 15 (App Router)',
  'React 19 · TypeScript',
  'Zustand 5',
  'Tailwind CSS · Radix UI',
  'Framer Motion',
  'TipTap 3 · WaveSurfer 7',
  'Prisma 6 · MySQL 8',
  'NextAuth v5 · Zod',
  'Docker',
]

const sections = [
  {
    kind: 'lead',
    heading: '개요 · OVERVIEW',
    body: '종이 청첩장은 인쇄비와 수정 비용이 크고, 범용 디자인 도구로 만들면 행사 정보·참석 응답·공유를 각각 다른 곳에서 관리해야 합니다. 오픈데이는 완성된 템플릿에 정보를 채우고 필요한 기능만 모듈로 켜는 방식으로 제작을 줄이고, 발행 이후의 공유·참석·방명록·방문 통계까지 한 화면에서 관리하게 했습니다.',
    bullets: [
      '몇 분이면 완성 — 템플릿 선택 → 정보 입력 → 발행까지 한 흐름, 디자인 경험 불필요',
      '웨딩만이 아님 — 돌잔치·생일·교육·비즈니스·모임·스포츠·문화·기념까지 10개 행사 카테고리',
      '필요한 기능만 조합 — RSVP·방명록·갤러리·지도·BGM·일정표 등 20종 이상을 모듈로 켜고 끄기',
      '발행 이후가 제품 — 링크·QR·카카오 공유, 참석 응답·방명록·방문 통계를 주최자 화면에서 확인',
    ],
  },
  {
    kind: 'gallery',
    heading: '만들기 · 모듈형 에디터',
    media: [
      {
        kind: 'video',
        mediaId: M.videoEditor,
        caption: '정보·디자인·모듈 패널을 오가면 모바일 프리뷰가 즉시 따라옵니다',
        poster: posterEditor,
      },
    ],
  },
  {
    kind: 'gallery',
    heading: '완성 · 발행된 초대장',
    media: [
      {
        kind: 'video',
        mediaId: M.videoInvitation,
        caption: '하객이 받는 실제 초대장 — 인사말·일정·장소·갤러리·참여 모듈',
        poster: posterInvitation,
      },
    ],
  },
  {
    kind: 'features',
    heading: '핵심 기능 · FEATURES',
    bullets: [
      '템플릿 탐색 — 카테고리 필터와 실제 모바일 미리보기로 시작점을 고릅니다',
      '실시간 에디터 — 정보·디자인·모듈 설정을 바꾸면 휴대폰 프리뷰에 즉시 반영됩니다',
      '모듈 조합 — RSVP·방명록·투표·계좌·갤러리·영상·BGM·지도·일정표를 행사에 맞게 켜고 끕니다',
      '행사별 언어 — 웨딩의 “예식 일시”가 전시·부고에 새지 않도록 카테고리별 문구를 분리했습니다',
      '라이트·다크 템플릿 — 배경 명도에 맞춰 본문·카드·지도까지 함께 전환됩니다',
      '발행과 공유 — 사용자 지정 슬러그, 링크 복사, QR, 카카오 공유 메타를 제공합니다',
      '공유 썸네일 — 세로 화면을 정사각 카드에 contain 합성해 공유 채널에서 잘리지 않게 했습니다',
      '참석 응답(RSVP) — 참석 여부·인원·식사·메시지를 공개 초대장에서 수집합니다',
      '방명록 — 하객 메시지를 모으고 주최자가 관리합니다',
      '방문 통계 — 60초 중복 방지 방문 로그로 누적·30일 추이를 보여줍니다',
      '짝꿍 편집 — 초대 링크로 공동 편집자를 연결하고 소유권과 편집 권한을 구분합니다',
      '관리자 템플릿 편집 — 사용자 초대장 편집과 템플릿 원본 편집을 같은 코어에서 모드로 나눴습니다',
    ],
  },
  {
    kind: 'gallery',
    heading: '화면 · SCREENS',
    media: [
      { kind: 'image', mediaId: M.shotDashboard, caption: '내 초대장 — 행사별 카드와 링크·카카오·QR 공유' },
      { kind: 'image', mediaId: M.shotCatalog, caption: '카테고리별 템플릿 카탈로그' },
      { kind: 'image', mediaId: M.shotEditor, caption: '편집 패널 + 모바일 실시간 프리뷰' },
      { kind: 'image', mediaId: M.shotRsvp, caption: '참석 정보 — 참석/불참·측·인원·식사·메시지' },
      { kind: 'image', mediaId: M.shotGuestbook, caption: '방명록 관리' },
      { kind: 'image', mediaId: M.shotInvitation, caption: '하객이 보는 공개 초대장' },
    ],
  },
  {
    kind: 'diagram',
    heading: '전체 흐름 한눈에 · HOW IT WORKS',
    body: `flowchart LR
  G["@icon:monitor 주최자<br/>템플릿 선택"]
  E["@icon:box 모듈형 에디터<br/>실시간 프리뷰"]
  S["@icon:server 서버 · API"]
  DB[("@icon:database 초대장 JSON")]
  V["@icon:smartphone 공개 초대장<br/>SSR · 공유 메타"]
  H["@icon:radio 하객<br/>RSVP · 방명록"]
  D["@icon:zap 통계 · 관리"]
  G --> E
  E -->|자동저장| S
  S --> DB
  DB --> V
  V --> H
  H -->|응답·방문 로그| S
  S --> D
  D --> G
  classDef c fill:#141b2e,stroke:@accent,stroke-width:1.5px,color:#e9eefb;
  class G,E,S,DB,V,H,D c;`,
    bullets: [
      '초대장은 필드 데이터와 모듈 배열을 나눈 JSON 스냅샷으로 저장됩니다',
      '공개 초대장은 SSR로 열리고, 하객의 응답·방문은 다시 주최자 통계로 돌아옵니다',
    ],
  },
  {
    kind: 'timeline',
    heading: '역할 · ROLE',
    body: '2인 팀의 팀장으로 기획부터 개발·런칭까지 제품 풀사이클을 리드했습니다.',
    bullets: [
      '2023 — 2024 · 2인 팀 팀장 — 기획 → 개발 → 런칭 풀사이클 리드',
      '이후 재구축(V3) — 현재 저장소의 커밋 작성자는 본인 단독으로 확인됩니다. Next.js App Router 전환, 모듈형 에디터, 공유·참여·통계 기능, 템플릿 12종 개편',
    ],
  },
  {
    kind: 'challenge',
    heading: '기술적으로 풀어낸 문제들',
    body: '기능이 늘어날수록 스키마와 화면이 함께 늘어나는 구조를 깨는 것이 핵심이었습니다. 각 문제의 상세 과정은 딥다이브 글에서 다룹니다.',
    bullets: [
      '기능마다 컬럼이 늘어나는 문제 — 필드/모듈을 분리한 JSON 스냅샷과 렌더러 계약으로 20종 이상을 한 모델에 담음',
      '웨딩 문구가 다른 행사에 새는 문제 — 모듈 config → 콘텐츠 → 카테고리 프리셋 순의 카피 토큰과 의미 단위 표면 토큰',
      '발행 이후가 비는 문제 — 공개 쓰기/소유자 읽기 권한 분리, 중복 방지 방문 로그, contain 합성 공유 썸네일',
    ],
  },
  {
    kind: 'default',
    heading: '확장 방향',
    body: '템플릿 마켓과 제작자 수익 분배는 구상 단계이고, 행사 유형별 분석 벤치마크·다국어 초대장·접근성 감사 자동화는 지향점입니다. 공동 편집의 실시간 동기화와 버전 히스토리는 아직 구현하지 않았습니다.',
  },
]

const now = Math.floor(Date.now() / 1000)
sqlite
  .prepare(
    'update projects set title=?, title_kr=?, tag=?, year=?, role=?, url=?, summary=?, metrics=?, sections=?, stack=?, cover_id=?, related_note_ids=?, status=?, published_at=coalesce(published_at,?), updated_at=? where id=?',
  )
  .run(
    'OpenDay',
    '오픈데이',
    '웹 · 모바일 초대장',
    '2023 — 2024',
    '팀장 · 2인',
    'openday.ghmate.com',
    '행사 주최자가 디자인 경험 없이도 템플릿을 골라 몇 분 만에 모바일 초대장을 만들고, 공유부터 참석 응답·방명록·방문 통계까지 한곳에서 관리하는 서비스. 웨딩뿐 아니라 돌잔치·비즈니스·문화 행사까지 10개 카테고리를 지원합니다. 2인 팀의 팀장으로 기획부터 런칭까지 풀사이클을 리드했습니다.',
    JSON.stringify(metrics),
    JSON.stringify(sections),
    JSON.stringify(stack),
    M.shotEditor, // 상단 배너 = 가로형 에디터 화면

    JSON.stringify(noteIds),
    'published',
    now,
    now,
    proj.id,
  )

console.log(`[project] openday(#${proj.id}) 갱신 — sections ${sections.length} · notes ${JSON.stringify(noteIds)}`)
sqlite.close()
