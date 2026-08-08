/**
 * CodingPT 프로젝트 상세 + 딥다이브 4편을 발행한다. (2026-07 피벗 반영 — 기존 '코딩 교육' 설명 전면 교체)
 *
 * 재료: codingpt 담당 에이전트가 만든 portfolio_assets (문서/스크린샷/딥다이브/다이어그램).
 *  - 모바일 스크린샷·시연 영상은 미수령 → 재촬영 후 별도 반영 (이 스크립트는 재실행 안전)
 * 1) 자산을 MinIO(hub/media)에 업로드하고 media 행을 upsert (파일명 기준)
 * 2) projects.codingpt 행을 UPDATE (metrics/sections/stack/summary/url/cover/tag/year/role)
 * 3) notes 4편을 마크다운 → NoteBlock[]으로 변환해 upsert
 *
 * 실행: pnpm exec tsx scripts/publish-codingpt.ts
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

const ASSETS = '/Users/whrksp126/other/project/codingpt/portfolio_assets'
const CROPPED = '/private/tmp/claude-501/-Users-whrksp126-other-project-hub/49c8cf8b-a013-4e09-bfc6-5de586e2cf5a/scratchpad/codingpt'
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
  // 시연 영상 (분할 멀티화면 — 폰 조작과 PC 반응이 같은 프레임 안에)
  { name: 'videoPhoneToPc', key: 'codingpt-phone-to-pc.mp4', file: `${ASSETS}/videos/phone-to-pc.mp4`, alt: '폰에서 지시하면 PC가 실행하고 결과가 폰에 반영되는 시연', w: 1920, h: 1080 },
  { name: 'videoApproval', key: 'codingpt-remote-approval.mp4', file: `${ASSETS}/videos/remote-approval.mp4`, alt: 'PC의 위험한 명령을 폰의 승인 카드에서 허용해 작업이 이어지는 시연', w: 1920, h: 1080 },
  // 스크린샷 (빈 영역·자동화 배너를 잘라낸 크롭본)
  { name: 'shotWorkspace', key: 'codingpt-pc-terminal-ide-2.png', file: `${CROPPED}/pc-terminal-ide.png`, alt: 'PC 데스크톱 앱 — 터미널과 코드 에디터를 나란히 띄운 워크스페이스', w: 3200, h: 1240 },
  { name: 'shotAgent', key: 'codingpt-pc-agent-select-2.png', file: `${CROPPED}/pc-agent-select.png`, alt: '이 PC에서 발견된 AI 에이전트(Claude Code · Codex CLI · Cursor CLI) 연동 화면', w: 1760, h: 1240 },
  { name: 'shotDocs', key: 'codingpt-web-docs.png', file: `${CROPPED}/web-docs.png`, alt: '공개 웹 문서 — 설치·페어링·BYO AI·보안 가이드', w: 3200, h: 1700 },
  { name: 'shotLanding', key: 'codingpt-web-landing.png', file: `${CROPPED}/web-landing.png`, alt: '공개 랜딩 — 내 PC의 코딩 에이전트를 폰에서 이어서', w: 3200, h: 1712 },
  // 모바일 (실제 데모 계정 로그인 상태)
  { name: 'shotMobileTerm', key: 'codingpt-mobile-terminal-2.png', file: `${CROPPED}/mobile-terminal.png`, alt: '폰에서 PC의 tmux 세션에 그대로 붙은 터미널 라이브 미러', w: 1080, h: 1800 },
  { name: 'shotMobileIde', key: 'codingpt-mobile-ide-2.png', file: `${CROPPED}/mobile-ide.png`, alt: '폰에서 PC의 파일 트리를 열어 코드를 편집하는 화면', w: 1080, h: 1800 },
  { name: 'shotMobilePreview', key: 'codingpt-mobile-preview-2.png', file: `${CROPPED}/mobile-preview.png`, alt: 'PC에서 돌고 있는 dev 서버를 폰 화면에서 그대로 여는 실시간 미리보기', w: 1080, h: 1800 },
  // 딥다이브 다이어그램
  { name: 'dgRelay', key: 'codingpt-dd-outbound-relay.png', file: `${ASSETS}/deepdives/01-outbound-relay/diagram/relay.png`, alt: '아웃바운드 전용 릴레이와 dial-back 스트림 구조', w: 1702, h: 2430 },
  { name: 'dgApproval', key: 'codingpt-dd-byo-approval.png', file: `${ASSETS}/deepdives/02-byo-agent-approval/diagram/approval.png`, alt: 'BYO 실행과 원격 승인 경로', w: 1574, h: 1978 },
  { name: 'dgSidecar', key: 'codingpt-dd-daemon-sidecar.png', file: `${ASSETS}/deepdives/03-daemon-sidecar/diagram/sidecar.png`, alt: '사이드카 번들 구성과 배포 파이프라인', w: 2030, h: 2460 },
  { name: 'dgGating', key: 'codingpt-dd-pivot-gating.png', file: `${ASSETS}/deepdives/04-pivot-gating/diagram/gating.png`, alt: '삭제와 게이팅을 가르는 기준, capability 교집합', w: 2982, h: 1586 },
]

const M: Record<string, number> = {}
for (const u of UPLOADS) {
  M[u.name] = await putMedia(u.key, u.file, u.alt, u.w, u.h)
  console.log(`[media] ${u.key} → #${M[u.name]}`)
}
const posterPhoneToPc = await putObject('codingpt-phone-to-pc-poster.jpg', `${ASSETS}/videos/phone-to-pc.poster.jpg`)
const posterApproval = await putObject('codingpt-remote-approval-poster.jpg', `${ASSETS}/videos/remote-approval.poster.jpg`)
console.log('[media] 포스터 2개 업로드 완료')

// ── 2. 프로필/프로젝트 조회 ───────────────────────────────────────────
const profile = sqlite.prepare('select id from profiles where username=?').get(USERNAME) as { id: number }
if (!profile) throw new Error(`${USERNAME} 프로필 없음`)
const proj = sqlite.prepare('select id from projects where profile_id=? and slug=?').get(profile.id, 'codingpt') as { id: number }
if (!proj) throw new Error('codingpt 프로젝트 행 없음')

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
    if (line === '---') { blocks.push({ type: 'divider' }); i++; continue }
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
    while (i < lines.length && lines[i].trim() !== '' && !/^(#{2,3} |[-*] |\d+\. |\||>|```|!\[|<video|---$)/.test(lines[i].trim())) {
      buf.push(lines[i].trim())
      i++
    }
    blocks.push({ type: 'p', text: buf.join(' ') })
  }
  return { meta, blocks }
}

const DEEPDIVES = [
  { dir: '01-outbound-relay', slug: 'codingpt-outbound-relay', assets: { 'diagram/relay.png': { mediaId: M.dgRelay } } },
  { dir: '02-byo-agent-approval', slug: 'codingpt-byo-agent-approval', assets: { 'diagram/approval.png': { mediaId: M.dgApproval } } },
  { dir: '03-daemon-sidecar', slug: 'codingpt-daemon-sidecar', assets: { 'diagram/sidecar.png': { mediaId: M.dgSidecar } } },
  { dir: '04-pivot-gating', slug: 'codingpt-pivot-gating', assets: { 'diagram/gating.png': { mediaId: M.dgGating } } },
]

const noteIds: number[] = []
let order = 17
for (const dd of DEEPDIVES) {
  const file = path.join(ASSETS, 'deepdives', dd.dir, `${dd.dir}.md`)
  const { meta, blocks } = parseDeepdive(fs.readFileSync(file, 'utf8'), dd.assets)
  const now = Math.floor(Date.now() / 1000)
  const exist = sqlite.prepare('select id from notes where profile_id=? and slug=?').get(profile.id, dd.slug) as
    | { id: number }
    | undefined
  const args = [
    meta.category ?? null,
    '2026.08',
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
  { value: '0', label: '우리 서버가 대신 부르는 AI 호출 — 사용자 PC에서 사용자 자신의 구독으로 실행' },
  { value: '0', label: '사용자가 열어야 하는 인바운드 포트 — 데몬은 아웃바운드 연결만 사용' },
  { value: '3', label: '동시 운영 중인 클라이언트 — iOS · Android · macOS 데스크톱 앱' },
]

const stack = [
  'React Native (iOS · Android)',
  'Tauri (Rust) · macOS 서명/공증',
  'Node.js 데몬 · node-pty · tmux',
  'Express · WebSocket 릴레이',
  'PostgreSQL',
  'Next.js App Router (SSR)',
  'React 18 · Vite (어드민)',
  'S3 호환 오브젝트 스토리지',
  'X25519 · Ed25519 종단 간 암호화',
]

const sections = [
  {
    kind: 'lead',
    heading: '개요 · OVERVIEW',
    body: 'AI 코딩 에이전트를 쓰기 시작하면 작업의 무게중심이 타이핑에서 “지시하고 기다리고 승인하기”로 옮겨갑니다. 그런데 그 승인은 책상 앞에 앉아 있어야만 할 수 있습니다. CodingPT는 실행을 클라우드로 옮기는 대신 조작을 사용자 쪽으로 보냅니다 — 내 PC에 데몬 하나를 띄우면 터미널·파일·dev 서버·AI CLI는 원래 있던 그 PC에서 돌고, 폰과 태블릿은 그 화면을 이어받아 조작합니다.',
    bullets: [
      '추가 AI 구독료 0 — 이미 쓰는 Claude Code·Codex CLI를 그대로(BYO). 서비스가 대신 모델을 호출하지 않습니다',
      '내 개발환경 그대로 — 도트파일·툴체인·로컬 DB·시뮬레이터가 있는 바로 그 머신에서 실행됩니다',
      '네트워크 설정 0 — 데몬은 아웃바운드 WebSocket만 엽니다. 포트포워딩·공유기·방화벽 설정이 없습니다',
      '미러링이 아닌 재설계 — 원격 데스크톱처럼 화면을 욱여넣지 않고 터미널·에디터·미리보기를 모바일 UI로 다시 만들었습니다',
    ],
  },
  {
    kind: 'default',
    heading: '방향을 바꾼 이유 · PIVOT',
    body: '처음의 CodingPT는 모바일 코딩 교육 앱이었습니다. 레슨을 읽고 코드를 제출하면 서버의 도커 실행기가 채점하는 구조였고, 그 실행기를 빠르게 만드는 캐싱이 기술적 자랑거리였습니다. 2026년 상반기 AI 코딩 도구가 실무를 바꾸면서 그 전제가 흔들렸습니다. 사람들은 코딩을 배우려고 에디터를 여는 게 아니라 에이전트에게 시키고 결과를 승인하려고 열기 시작했고, 그때 병목은 지식이 아니라 자리였습니다. 잘 만들어 둔 “서버에서 코드를 대신 실행해 주는 엔진”은 사용자의 진짜 환경도 진짜 AI 구독도 없는, 틀린 위치의 실행기였습니다. 2026년 7월 9일 가설을 갈아치웠습니다 — 실행을 우리 쪽으로 가져오는 대신, 조작을 사용자 쪽으로 보낸다. 같은 날 클라우드 AI 엔진 경로를 걷어내고 구독 신규 판매를 껐으며, 레슨은 지우지 않고 얼려 두었습니다.',
  },
  {
    kind: 'gallery',
    heading: '시연 · 폰에서 지시하면 내 PC가 실행합니다',
    media: [
      {
        kind: 'video',
        mediaId: M.videoPhoneToPc,
        caption: '폰에서 명령을 보내면 PC 터미널에서 실제로 돌고, 바뀐 결과가 폰 미리보기에 그대로 반영됩니다',
        poster: posterPhoneToPc,
      },
    ],
  },
  {
    kind: 'gallery',
    heading: '시연 · 위험한 명령은 폰에서 승인해야 진행됩니다',
    media: [
      {
        kind: 'video',
        mediaId: M.videoApproval,
        caption: 'PC의 에이전트가 승인을 요구하면 폰에 카드가 도착하고, 허용하는 순간 PC에서 작업이 이어집니다',
        poster: posterApproval,
      },
    ],
  },
  {
    kind: 'gallery',
    heading: '폰에서 · ON MOBILE',
    media: [
      { kind: 'image', mediaId: M.shotMobileTerm, caption: '터미널 라이브 미러 — PC의 tmux 세션에 그대로 붙어 테스트 결과와 git 로그가 흐릅니다' },
      { kind: 'image', mediaId: M.shotMobileIde, caption: '코드 에디터 — PC의 파일 트리를 열어 폰에서 편집합니다' },
      { kind: 'image', mediaId: M.shotMobilePreview, caption: '실시간 미리보기 — PC에서 도는 dev 서버를 폰 화면에서 그대로 엽니다' },
    ],
  },
  {
    kind: 'gallery',
    heading: 'PC에서 · ON DESKTOP',
    media: [
      { kind: 'image', mediaId: M.shotWorkspace, caption: 'PC 데스크톱 앱 — 터미널과 코드 에디터를 나란히 둔 워크스페이스' },
      { kind: 'image', mediaId: M.shotAgent, caption: '이 PC에서 발견된 AI 에이전트를 골라 연동 — 자격증명은 PC 밖으로 나가지 않습니다' },
      { kind: 'image', mediaId: M.shotLanding, caption: '공개 랜딩 — codingpt.ghmate.com' },
      { kind: 'image', mediaId: M.shotDocs, caption: '공개 웹 문서 — 설치·기기 연결·BYO AI·보안까지' },
    ],
  },
  {
    kind: 'features',
    heading: '핵심 기능 · FEATURES',
    bullets: [
      '터미널 라이브 미러 — PC의 tmux 세션에 그대로 붙습니다. 앱을 껐다 켜도, 기기를 바꿔도 하던 작업이 살아 있습니다',
      '원격 승인 인박스 — 에이전트가 “이 명령 실행해도 됩니까”를 물으면 폰에 카드로 뜨고 거기서 허용·거절·코멘트를 보냅니다',
      'BYO 에이전트 실행 — 사용자의 claude·codex CLI를 그 PC에서 그대로 실행합니다. 자격증명은 PC 밖으로 나가지 않습니다',
      '코드 에디터(IDE) — PC의 파일 트리를 열고 고치고 저장합니다. 변경은 양방향으로 즉시 반영됩니다',
      '실시간 미리보기 — PC에서 돌고 있는 dev 서버를 폰에서 엽니다. 진짜 localhost 오리진으로 포워딩해 쿠키·CORS가 로컬과 동일하게 동작합니다',
      '워크스페이스 셸 — 한 화면을 타일로 쪼개 터미널·에디터·미리보기를 동시에 놓고 씁니다',
      '한글 IME 터미널 입력 — 조합 중인 글자가 깨지지 않도록 입력을 델타 방식으로 보냅니다',
      '특수키 보조 패널 — 물리 키보드 없이 Ctrl·Esc·화살표 등 조합키를 보냅니다',
      '여러 PC 전환 — 등록한 PC들을 오가고, 같은 프로젝트의 여러 PC 사본을 하나로 묶어 보여줍니다',
      '푸시 알림 — 작업 완료·승인 대기·질문 도착을 지금 보고 있는 기기 기준으로 라우팅합니다',
      '에뮬레이터·시뮬레이터 조작 — PC에 붙은 Android 에뮬레이터와 iOS 시뮬레이터 화면을 폰에서 보고 터치합니다',
      'cpt CLI — 터미널 안의 AI가 미리보기 열기·IDE 파일 열기·레이아웃 변경·알림·코드 리뷰 요청을 직접 호출하는 컨트롤 플레인',
      '데몬 내장 배포 — Node도 tmux도 없는 맥에 .dmg 하나로 배달합니다. 서명·공증·자동 업데이트 포함',
      '작업 스냅샷 — 사용자의 HEAD와 워킹트리를 건드리지 않고 git plumbing으로 체크포인트를 만듭니다',
      '종단 간 암호화 — 기기 키와 세대 단위 마스터키로 릴레이가 구조상 내용을 못 보게 했습니다',
    ],
  },
  {
    kind: 'diagram',
    heading: '전체 흐름 한눈에 · HOW IT WORKS',
    body: `flowchart LR
  P["@icon:smartphone 폰 · 태블릿<br/>워크스페이스 셸"]
  R["@icon:cloud 릴레이 서버<br/>내용 무해석"]
  D["@icon:server 내 PC 데몬<br/>아웃바운드 전용"]
  T["@icon:box tmux 세션<br/>끊겨도 생존"]
  C["@icon:zap 내 AI CLI<br/>claude · codex"]
  F[("@icon:database 프로젝트 파일<br/>dev 서버")]
  A["@icon:shield 원격 승인 · 알림"]
  P -->|암호화 봉투| R
  R -->|stream_open 지시| D
  D -->|스트림 dial-back| R
  R -->|PTY · 파일 · 미리보기| P
  D --> T
  D --> F
  T --> C
  C -->|승인 질문| A
  A --> P
  classDef c fill:#141b2e,stroke:@accent,stroke-width:1.5px,color:#e9eefb;
  class P,R,D,T,C,F,A c;`,
    bullets: [
      '데몬은 인바운드 포트를 열지 않습니다 — 제어 채널 1개를 밖으로 걸고, 스트림은 필요할 때마다 되걸어 옵니다',
      'AI는 사용자 PC에서 사용자 자신의 구독으로 돌고, 서버는 결과 바이트를 옮기는 교환원 역할만 합니다',
    ],
  },
  {
    kind: 'challenge',
    heading: '기술적으로 풀어낸 문제들',
    body: '“내 PC를 폰으로 이어 쓴다”는 한 문장을 실제로 성립시키려면 네트워크·에이전트·배포·제품 전환 네 층을 각각 다시 설계해야 했습니다. 각 문제의 상세 과정은 딥다이브 글에서 다룹니다.',
    bullets: [
      '공유기를 만지게 하면 제품이 죽는다 — 아웃바운드 전용 제어 채널과 스트림별 dial-back으로 NAT을 넘고, 채널별 TCP 백프레셔까지 얻었습니다',
      '남의 AI를 대신 돌리지 않는다 — 사용자 PC의 사용자 CLI를 그대로 쓰되, 터미널 안에서만 뜨던 승인 질문을 폰으로 옮겼습니다',
      'Node도 tmux도 없는 맥에 데몬을 배달한다 — 런타임까지 사이드카로 번들해 .dmg 하나로, 서명·공증·자동 업데이트까지 이었습니다',
      '피벗하면서 코드를 지우지 않는다 — 무엇을 삭제하고 무엇을 얼릴지 가르는 기준과, 서버·데몬·클라이언트 capability 교집합으로만 기능을 켜는 협상',
    ],
  },
  {
    kind: 'timeline',
    heading: '역할 · ROLE',
    body: '레슨 시대에는 팀으로 시작했고, 2026년 7월 피벗 이후의 제품은 단독으로 개발하고 있습니다.',
    bullets: [
      '2025-07 — 2026-05 · 팀 협업 — 앱 아키텍처·인증·백엔드·인프라 전반을 맡았습니다. 레슨 콘텐츠와 레슨 화면 모듈은 공동 기여자 1명이 담당했습니다',
      '2026-05 — · 제품 모노레포 신설 — 릴레이 백엔드·공개 웹·어드민 분리까지 저장소 커밋 작성자 단독으로 확인됩니다',
      '2026-07-09 — 현재 · 피벗 이후 전 구간 단독 — 데몬·릴레이·PC 데스크톱 앱·모바일 워크스페이스 셸·원격 승인·알림·종단 간 암호화·스토어 배포',
    ],
  },
  {
    kind: 'default',
    heading: '확장 방향',
    body: '클라우드 러너와 구독 과금은 구현이 남아 있지만 스위치를 꺼둔 상태로, PC가 없는 사용자를 위한 경로로 보류해 두었습니다. Windows 호스트 지원은 데몬에 분기가 일부 있으나 끝까지 검증한 적이 없어 “준비 중”입니다. 팀 협업(한 워크스페이스를 여러 사람이), 릴레이 탈중앙화, 에이전트 자동화 레시피는 아직 구상 단계입니다.',
  },
]

const now = Math.floor(Date.now() / 1000)
sqlite
  .prepare(
    'update projects set title=?, title_kr=?, tag=?, year=?, role=?, url=?, summary=?, metrics=?, sections=?, stack=?, cover_id=?, related_note_ids=?, status=?, published_at=coalesce(published_at,?), updated_at=? where id=?',
  )
  .run(
    'CodingPT',
    '코딩피티',
    '개발도구 · 앱 · 데스크톱',
    '2025 — 현재',
    '팀 협업 후 단독',
    'codingpt.ghmate.com',
    '내 PC에서 돌고 있는 AI 코딩 에이전트(Claude Code·Codex CLI)와 터미널·에디터·미리보기를 폰과 태블릿에서 그대로 이어서 쓰는 원격 작업 도구. 코드는 클라우드가 아니라 사용자 PC에서 사용자 자신의 구독으로 실행되고, 서버는 기기 사이를 잇는 릴레이 역할만 합니다. 교육 앱으로 시작해 2026년 7월 원격 개발 도구로 방향을 바꿨습니다.',
    JSON.stringify(metrics),
    JSON.stringify(sections),
    JSON.stringify(stack),
    M.shotWorkspace, // 상단 배너 = 가로형 워크스페이스 화면
    JSON.stringify(noteIds),
    'published',
    now,
    now,
    proj.id,
  )

console.log(`[project] codingpt(#${proj.id}) 갱신 — sections ${sections.length} · notes ${JSON.stringify(noteIds)}`)
sqlite.close()
