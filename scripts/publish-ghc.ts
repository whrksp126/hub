/**
 * GHC(멀티카메라 라이브) 프로젝트 상세 + 딥다이브 6편을 발행한다.
 *
 * 재료: longdcam 담당 에이전트가 만든 portfolio_assets (2026-08-13).
 *   1) 스크린샷 17장 · 영상 4편(+포스터) · 다이어그램 10장을 MinIO(hub/media)에 업로드 → media upsert
 *   2) 딥다이브 6편을 마크다운 → NoteBlock[] 로 변환해 notes upsert
 *   3) projects.ghc 행을 갱신 (섹션·지표·스택·연결 딥다이브)
 *
 * 사실 기준은 portfolio_assets/FACT-CHECK.md 를 따른다. 특히:
 *   · 방 미디어는 참가자 수와 무관하게 항상 SFU 경유 — "1:1은 P2P"는 사실이 아니다
 *   · P2P는 '기기 카메라 미리보기' 경로 전용, coturn도 그 경로용
 *   · 홈서버 업링크 87.1 Mbps는 2026-08-13 실측 (이전 90Mbps는 추정치였음)
 *
 * 실행: pnpm exec tsx scripts/publish-ghc.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import Database from 'better-sqlite3'

for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const ASSETS = '/Users/whrksp126/other/project/longdcam/portfolio_assets'
const USERNAME = 'geonho'
const SLUG = 'ghc'

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

async function putObject(key: string, file: string): Promise<string> {
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: `media/${key}`, Body: fs.readFileSync(file), ContentType: mime(key) }))
  return publicUrl(`media/${key}`)
}

// ── 1. 자산 업로드 ────────────────────────────────────────────────────
const SS = (n: string) => `${ASSETS}/screenshots/${n}.png`
const VD = (n: string) => `${ASSETS}/videos/${n}.mp4`
const DD = (d: string, p: string) => `${ASSETS}/deepdives/${d}/${p}`

const W = 2560, H = 1600      // 데스크탑 캡처
const MW = 804, MH = 1748     // 모바일 캡처

type Up = { name: string; key: string; file: string; alt: string; w: number; h: number }
const UPLOADS: Up[] = [
  // 웹 화면
  { name: 'login', key: 'ghc-login.png', file: SS('01-login'), alt: 'GHC 로그인 화면 — 이메일과 구글 로그인', w: W, h: H },
  { name: 'roomList', key: 'ghc-room-list.png', file: SS('02-home-room-list'), alt: '홈 화면의 내 방 목록 — 방장과 참여 방이 섞여 있다', w: W, h: H },
  { name: 'createRoom', key: 'ghc-create-room.png', file: SS('03-create-room'), alt: '방 만들기 모달 — 이름과 선택 PIN', w: W, h: H },
  { name: 'shareQr', key: 'ghc-share-qr.png', file: SS('04-share-qr'), alt: '방 공유 화면 — 8자리 코드와 QR', w: W, h: H },
  { name: 'cameras', key: 'ghc-cameras-devices.png', file: SS('05-cameras-devices'), alt: '카메라 관리 — 내 다른 기기 3대의 화면을 P2P로 미리보는 중', w: 2560, h: 2084 },
  { name: 'camerasVp', key: 'ghc-cameras-viewport.png', file: SS('05b-cameras-devices-viewport'), alt: '카메라 관리 화면 뷰포트 컷', w: W, h: H },
  { name: 'preflight', key: 'ghc-room-preflight.png', file: SS('06-room-preflight'), alt: '방 입장 준비 — 어떤 카메라를 가져갈지 고른다', w: W, h: H },
  { name: 'grid3', key: 'ghc-room-grid-3angles.png', file: SS('07-room-grid-3angles'), alt: '멀티앵글 그리드 — 사람은 1명인데 카메라가 3개', w: W, h: H },
  { name: 'spotlight', key: 'ghc-room-spotlight.png', file: SS('08-room-spotlight'), alt: '스포트라이트 — 타일을 더블클릭하면 그 앵글이 커진다', w: W, h: H },
  { name: 'moreMenu', key: 'ghc-room-more-menu.png', file: SS('09-room-more-menu'), alt: '방 메뉴 — 마이크 설정, 라이브 송출, 방 종료', w: W, h: H },
  { name: 'rtmpSetup', key: 'ghc-live-rtmp-setup.png', file: SS('10-live-rtmp-setup'), alt: '라이브 송출 설정 — RTMP 주소와 스트림 키(마스킹)', w: W, h: H },
  { name: 'audio', key: 'ghc-audio-settings.png', file: SS('11-audio-settings'), alt: '마이크 설정 — 노이즈 게이트와 감도', w: W, h: H },
  { name: 'download', key: 'ghc-download.png', file: SS('12-download'), alt: '앱 다운로드 — OS를 감지해 최신 빌드를 준다', w: W, h: H },
  // 모바일 화면
  { name: 'mHome', key: 'ghc-mobile-home.png', file: SS('20-mobile-home'), alt: '모바일 홈', w: MW, h: MH },
  { name: 'mCameras', key: 'ghc-mobile-cameras.png', file: SS('21-mobile-cameras'), alt: '모바일 카메라 관리', w: MW, h: MH },
  { name: 'mPreflight', key: 'ghc-mobile-preflight.png', file: SS('22-mobile-preflight'), alt: '모바일 방 입장 준비', w: MW, h: MH },
  { name: 'mGrid', key: 'ghc-mobile-room-grid.png', file: SS('23-mobile-room-grid'), alt: '모바일 멀티앵글 그리드', w: MW, h: MH },
  // 전체 구조도
  { name: 'dgOverview', key: 'ghc-dg-overview.png', file: `${ASSETS}/diagram/overview.png`, alt: 'GHC 전체 구조 — 단일 React PWA와 홈서버 컨테이너 7개', w: 1568, h: 836 },
  // 딥다이브 다이어그램
  { name: 'dgBeforeAfter', key: 'ghc-dd-before-after.png', file: DD('01-mediasoup-to-livekit', 'diagram/before-after.png'), alt: 'mediasoup 직접 운영과 LiveKit 자가호스팅의 책임 경계 비교', w: 1568, h: 950 },
  { name: 'dgSimulcast', key: 'ghc-dd-simulcast.png', file: DD('01-mediasoup-to-livekit', 'diagram/simulcast.png'), alt: '폰은 단일 계층, 데스크탑은 3계층 simulcast', w: 1568, h: 606 },
  { name: 'dgCapacity', key: 'ghc-dd-capacity.png', file: DD('02-home-server-capacity', 'diagram/capacity.png'), alt: '요구 대역폭과 서버 능력, 거기서 역산한 제품 결정', w: 1568, h: 578 },
  { name: 'dgIdentity', key: 'ghc-dd-identity.png', file: DD('03-one-account-many-cameras', 'diagram/identity.png'), alt: '한 계정 아래 세 기기가 SFU에서는 서로 다른 참가자가 된다', w: 1568, h: 1204 },
  { name: 'dgRemoteStart', key: 'ghc-dd-remote-start.png', file: DD('03-one-account-many-cameras', 'diagram/remote-start.png'), alt: 'PC에서 방에 들어가면 내 폰이 헤드리스로 방에 합류한다', w: 1568, h: 924 },
  { name: 'dgBridge', key: 'ghc-dd-bridge.png', file: DD('04-native-capture-bridge', 'diagram/bridge.png'), alt: '웹 코어 하나 + OS별 네이티브 셸 구조', w: 1568, h: 1180 },
  { name: 'dgTwoPaths', key: 'ghc-dd-two-paths.png', file: DD('05-p2p-preview-vs-sfu', 'diagram/two-paths.png'), alt: '방 미디어는 SFU, 기기 프리뷰는 P2P', w: 1568, h: 544 },
  { name: 'dgTopology', key: 'ghc-dd-topology.png', file: DD('06-selfhost-seven-containers', 'diagram/topology.png'), alt: '홈서버 컨테이너 7개와 외부 경로', w: 1568, h: 700 },
  // 영상
  { name: 'vMulti', key: 'ghc-multi-angle.mp4', file: VD('multi-angle'), alt: '한 계정의 기기 3대가 독립 카메라 3개로 붙는 멀티앵글 시연', w: 1920, h: 1080 },
  { name: 'vRegister', key: 'ghc-device-register.mp4', file: VD('device-register'), alt: '폰을 카메라로 추가하는 시연 — 로그인 한 번이면 끝', w: 1920, h: 1080 },
  { name: 'vRtmp', key: 'ghc-rtmp-live.mp4', file: VD('rtmp-live'), alt: '화면 송출이 RTMP에서 Ingress를 거쳐 방으로 합류하는 시연', w: 1920, h: 1080 },
  { name: 'vRemote', key: 'ghc-remote-control.mp4', file: VD('remote-control'), alt: '내 폰 카메라를 PC에서 원격으로 켜고 끄는 시연', w: 1920, h: 1080 },
]

const M: Record<string, number> = {}
for (const u of UPLOADS) {
  M[u.name] = await putMedia(u.key, u.file, u.alt, u.w, u.h)
  console.log(`[media] ${u.key} → #${M[u.name]}`)
}
const pMulti = await putObject('ghc-multi-angle-poster.jpg', `${ASSETS}/videos/multi-angle.poster.jpg`)
const pRegister = await putObject('ghc-device-register-poster.jpg', `${ASSETS}/videos/device-register.poster.jpg`)
const pRtmp = await putObject('ghc-rtmp-live-poster.jpg', `${ASSETS}/videos/rtmp-live.poster.jpg`)
const pRemote = await putObject('ghc-remote-control-poster.jpg', `${ASSETS}/videos/remote-control.poster.jpg`)
console.log('[media] 포스터 4개 업로드 완료')

// ── 2. 프로필 ─────────────────────────────────────────────────────────
const profile = sqlite.prepare('select id from profiles where username=?').get(USERNAME) as { id: number }
if (!profile) throw new Error(`${USERNAME} 프로필 없음`)

// ── 3. 딥다이브 마크다운 → NoteBlock[] (publish-lambent 파서와 동일) ──
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
    const line = lines[i].trim()
    if (line === '') { i++; continue }
    if (/^-{3,}$/.test(line)) { blocks.push({ type: 'divider' }); i++; continue }
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
    if (line.startsWith('>')) {
      const buf: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('>')) { buf.push(lines[i].trim().replace(/^>\s?/, '')); i++ }
      blocks.push({ type: 'callout', text: buf.join('\n').trim() })
      continue
    }
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
      if (!a) { console.warn(`  ! 이미지 미매핑: ${img[2]}`); i++; continue }
      const b: NoteBlock = { type: 'image', mediaId: a.mediaId }
      blocks.push(b); i++; pushCaptionTo(b)
      continue
    }
    const vid = line.match(/^<video\s+src="([^"]+)"/)
    if (vid) {
      const a = assetMap[vid[1]]
      if (!a) { console.warn(`  ! 영상 미매핑: ${vid[1]}`); i++; continue }
      const b: NoteBlock = { type: 'video', mediaId: a.mediaId, poster: a.poster }
      blocks.push(b); i++; pushCaptionTo(b)
      continue
    }
    const buf = [line]
    i++
    while (i < lines.length && lines[i].trim() !== '' && !/^(#{2,3} |[-*] |\d+\. |\||>|```|!\[|<video|-{3,}$)/.test(lines[i].trim())) {
      buf.push(lines[i].trim()); i++
    }
    blocks.push({ type: 'p', text: buf.join(' ') })
  }
  return { meta, blocks }
}

const DEEPDIVES = [
  {
    dir: '01-mediasoup-to-livekit', slug: 'ghc-mediasoup-to-livekit',
    assets: {
      'diagram/before-after.png': { mediaId: M.dgBeforeAfter },
      'diagram/simulcast.png': { mediaId: M.dgSimulcast },
      'video/multi-angle.mp4': { mediaId: M.vMulti, poster: pMulti },
    },
  },
  {
    dir: '02-home-server-capacity', slug: 'ghc-home-server-capacity',
    assets: { 'diagram/capacity.png': { mediaId: M.dgCapacity } },
  },
  {
    dir: '03-one-account-many-cameras', slug: 'ghc-one-account-many-cameras',
    assets: {
      'diagram/identity.png': { mediaId: M.dgIdentity },
      'diagram/remote-start.png': { mediaId: M.dgRemoteStart },
      'img/room-grid-3angles.png': { mediaId: M.grid3 },
      'video/device-register.mp4': { mediaId: M.vRegister, poster: pRegister },
      'video/remote-control.mp4': { mediaId: M.vRemote, poster: pRemote },
    },
  },
  {
    dir: '04-native-capture-bridge', slug: 'ghc-native-capture-bridge',
    assets: {
      'diagram/bridge.png': { mediaId: M.dgBridge },
      'video/rtmp-live.mp4': { mediaId: M.vRtmp, poster: pRtmp },
    },
  },
  {
    dir: '05-p2p-preview-vs-sfu', slug: 'ghc-p2p-preview-vs-sfu',
    assets: {
      'diagram/two-paths.png': { mediaId: M.dgTwoPaths },
      'img/cameras-p2p-preview.png': { mediaId: M.cameras },
    },
  },
  {
    dir: '06-selfhost-seven-containers', slug: 'ghc-selfhost-seven-containers',
    assets: { 'diagram/topology.png': { mediaId: M.dgTopology } },
  },
]

const noteIds: number[] = []
let order = 31
for (const dd of DEEPDIVES) {
  const file = path.join(ASSETS, 'deepdives', dd.dir, `${dd.dir}.md`)
  const { meta, blocks } = parseDeepdive(fs.readFileSync(file, 'utf8'), dd.assets)
  const now = Math.floor(Date.now() / 1000)
  const exist = sqlite.prepare('select id from notes where profile_id=? and slug=?').get(profile.id, dd.slug) as { id: number } | undefined
  const args = [meta.category ?? null, '2026.08', meta.reading_time ?? null, meta.title, meta.excerpt ?? null, JSON.stringify(blocks), order, 'published', now, now]
  if (exist) {
    sqlite.prepare('update notes set category=?, date=?, read_time=?, title=?, excerpt=?, content=?, "order"=?, status=?, published_at=?, updated_at=? where id=?')
      .run(...args, exist.id)
    noteIds.push(exist.id)
    console.log(`[note] update #${exist.id} ${dd.slug} — ${blocks.length}블록`)
  } else {
    const r = sqlite.prepare(
      'insert into notes (profile_id,slug,category,date,read_time,title,excerpt,content,"order",status,published_at,updated_at,created_at) values (?,?,?,?,?,?,?,?,?,?,?,?,?)',
    ).run(profile.id, dd.slug, ...args, now)
    noteIds.push(Number(r.lastInsertRowid))
    console.log(`[note] insert #${r.lastInsertRowid} ${dd.slug} — ${blocks.length}블록`)
  }
  order++
}

// ── 4. 프로젝트 상세 ──────────────────────────────────────────────────
const metrics = [
  { value: 'FairPlay · Widevine', label: 'DRM 재생 화면까지 송출하는 전용 브라우저를 OS별 네이티브로 구현' },
  { value: '140~250 vs 87 Mbps', label: '45방 기준 필요 대역폭 vs 홈서버 업링크 실측' },
  { value: 'CPU 1.58% · 336 MiB', label: '홈서버 컨테이너 7개 유휴 합계 · 9일 재시작 0회' },
]

const stack = [
  'TypeScript', 'React 18 · Vite · PWA', 'Zustand', 'Tailwind CSS',
  'Node 20 · Express', 'Socket.IO', 'LiveKit SFU (자가호스팅)', 'WebRTC · RTCPeerConnection',
  'coturn (HMAC ephemeral)', 'LiveKit Ingress (RTMP)',
  'MySQL 8 · Sequelize', 'Redis', 'MinIO (S3 호환)',
  'Electron', 'Swift · ScreenCaptureKit · CoreAudio', 'C++ / WinRT (WGC · WASAPI)', 'C# / .NET 8 (WebView2)',
  'ffmpeg (VideoToolbox · NVENC)', 'Docker Compose', 'Cloudflare',
]

const sections = [
  {
    kind: 'lead',
    heading: '개요 · OVERVIEW',
    body:
      '방송을 하려면 OBS를 깔아 씬을 잡아야 하고, 여러 각도를 찍으려면 각도만큼 장비를 사야 했습니다. ' +
      'GHC는 둘 다 없앴습니다. 송출은 데스크탑 앱이 직접 하고 — 화면·창·앱 오디오는 물론 ' +
      '일반 캡처로는 검게 나오는 DRM 재생 화면까지 앱 안에서 잡습니다. ' +
      '카메라는 서랍에 있는 안 쓰는 폰이 대신합니다. 같은 계정으로 로그인만 하면 카메라 목록에 자동 등록되고, ' +
      'PC에서 방에 들어가면 내 기기들이 자동으로 호출되어 각자 앵글을 올립니다. ' +
      '서버는 클라우드가 아니라 집에 있는 컴퓨터 한 대입니다.',
    bullets: [
      'OBS를 깔지 않는다 — 데스크탑 앱이 OS 네이티브 API로 화면·창·앱 오디오를 직접 캡처해 송출한다',
      'DRM 화면도 방송된다 — 재생을 담당할 브라우저를 macOS·Windows 각각의 DRM 스택으로 직접 만들었다',
      '장비를 새로 사지 않는다 — 안 쓰는 폰이 곧 카메라. 기기 수만큼 앵글이 늘어난다',
      '클라우드 비용 0 — 외부 SFU·스토리지·CDN 없이 홈서버와 무료 티어로 운영 중',
    ],
  },
  {
    kind: 'gallery',
    heading: '앱 안에서 끝나는 라이브 · LIVE',
    body:
      '송출 경로가 두 개입니다. 웹에서는 방마다 발급되는 RTMP 주소와 스트림 키로 OBS가 그대로 합류하고, ' +
      '데스크탑 앱에서는 OBS 없이 앱이 화면·창·앱 오디오를 직접 캡처해 같은 방의 트랙으로 올립니다. ' +
      '어느 쪽이든 시청자에게는 앵글 하나가 늘어난 것으로 보입니다.',
    media: [
      { kind: 'video', mediaId: M.vRtmp, caption: '좌: 방장의 송출 설정 / 우: 다른 계정 시청자 — RTMP가 Ingress를 거쳐 방 트랙이 된다', poster: pRtmp },
      { kind: 'image', mediaId: M.rtmpSetup, caption: '웹의 라이브 송출 설정 — OBS에 넣을 주소와 키를 방마다 발급한다 (키는 마스킹)' },
      { kind: 'image', mediaId: M.moreMenu, caption: '방 메뉴 — 데스크탑 앱에서는 여기에 브라우저 라이브 항목이 추가된다' },
    ],
  },
  {
    kind: 'default',
    heading: '브라우저 라이브 · DRM까지 방송되는 전용 브라우저',
    body:
      '넷플릭스 같은 보호된 스트리밍은 일반 화면 캡처로 잡으면 검은 화면이 됩니다. ' +
      '그래서 재생을 담당할 브라우저를 직접 만들었습니다. macOS는 WKWebView(FairPlay), ' +
      'Windows는 WebView2(Widevine)로 각각 구현해 두 OS에서 같은 기능을 제공합니다. ' +
      'GHC에서 가장 손이 많이 간 부분이자, 다른 도구로는 대체가 안 되는 부분입니다.',
    bullets: [
      '열기와 송출을 분리했다 — 창을 열어 로그인하고 원하는 페이지로 이동한 뒤, 준비되면 창 자신의 툴바에서 LIVE를 누른다. 로그인 화면이 방송되는 사고가 구조적으로 일어나지 않는다',
      '헬퍼 툴바는 화면에는 보이되 방송 출력에서는 잘라낸다 — 조작은 필요하지만 시청자가 볼 이유는 없다',
      '사이트의 전체화면 요청을 가로채 같은 창 안에서 처리한다 — OS 네이티브 전체화면은 별도 Space로 빠져나가 캡처가 깨진다',
      '마지막 URL과 쿠키를 남겨, 다음에 열면 보던 페이지에서 시작한다',
      '창 1600×980을 h264_videotoolbox 10Mbps로 인코딩해 RTMP로 넣으면 방의 트랙이 된다',
      'Windows 설치본은 WebView2 고정 런타임·ffmpeg·.NET 브라우저 헬퍼·가상 오디오를 전부 동봉해 382MB — 사용자가 따로 설치할 게 없다는 것과 맞바꿨다 (macOS는 98MB)',
    ],
  },
  {
    kind: 'gallery',
    heading: '한 사람, 카메라 세 대 · MULTI-ANGLE',
    body: 'PC로 방에 들어가면 내 폰들이 자동으로 호출되어 각자 앵글을 올립니다. 참가자는 1명인데 카메라는 3개입니다.',
    media: [
      { kind: 'video', mediaId: M.vMulti, caption: '좌: 카메라로 대기 중인 폰 / 우: 시청·조작하는 PC — 앵글 3개가 붙고 전환까지', poster: pMulti },
      { kind: 'image', mediaId: M.grid3, caption: '멀티앵글 그리드 — 헤더가 "1명 · 기기 3"으로 표시된다' },
      { kind: 'image', mediaId: M.spotlight, caption: '타일을 더블클릭하면 그 앵글이 커진다 (전환 실측 210ms)' },
    ],
  },
  {
    kind: 'gallery',
    heading: '폰을 카메라로 만들기 · DEVICE',
    body: '기기 등록에 페어링 코드나 별도 앱이 필요 없습니다. 같은 계정으로 로그인하면 기기 지문으로 자동 등록됩니다.',
    media: [
      { kind: 'video', mediaId: M.vRegister, caption: '좌: 새 폰이 로그인 / 우: PC의 카메라 관리에 즉시 나타난다', poster: pRegister },
      { kind: 'video', mediaId: M.vRemote, caption: '원격 제어 — PC에서 폰 카메라를 켜고 끈다 (제어 이벤트 6종)', poster: pRemote },
      { kind: 'image', mediaId: M.cameras, caption: '카메라 관리 — 내 다른 기기 화면을 SFU를 거치지 않고 P2P로 미리본다' },
    ],
  },
  {
    kind: 'features',
    heading: '핵심 기능 · FEATURES',
    bullets: [
      '브라우저 라이브 — DRM 재생이 되는 전용 창을 띄워 그 창을 송출. 열기와 송출이 분리돼 로그인 화면은 나가지 않는다',
      '네이티브 캡처 — 데스크탑 앱이 창·화면을 OS 네이티브 API로 캡처해 송출한다. OBS 대체',
      '앱별 오디오 캡처 — 특정 앱 소리만 방송에 넣고 내 스피커에서는 끌 수 있다',
      'RTMP 인입 — 방마다 주소와 키를 발급해 OBS가 그대로 합류. 웹만 쓰는 사람도 송출할 수 있다',
      '동시 라이브 가드 — 회선 상한에서 역산한 기본 8개를 넘으면 한국어 안내와 함께 거절',
      '기기 자동 등록 — 같은 계정으로 로그인하면 그 브라우저·앱이 기기 지문으로 카메라 목록에 추가된다',
      '기기별 독립 카메라 — 참가자 아이덴티티가 사용자:기기라, 한 사람의 여러 기기가 서로 다른 참가자로 붙는다',
      '원격 카메라 제어 — 다른 내 기기의 카메라 시작·중지, 전원, 렌즈 전환(전면·후면·초광각)',
      '기기 프리뷰 — 카메라 관리 화면에서 내 다른 기기 화면을 SFU를 거치지 않고 기기 간 직접 연결로 확인',
      '자동 호출 — 방에 들어가면 내 온라인 기기를 최대 3대까지 자동으로 끌어온다. 직접 끈 기기는 되살리지 않는다',
      '방 생성·참여 — 8자리 코드, 선택 PIN(bcrypt), QR 공유와 스캔 참여, 24시간 초대 링크',
      '역할 — 방장·멤버·뷰어. 뷰어는 토큰의 canPublish=false로 구독만 가능',
      '멀티앵글 레이아웃 — 타일 수와 비율로 열을 자동 계산하는 그리드, 더블클릭 스포트라이트',
      '적응형 화질 — 타일 크기와 가시성에 맞는 simulcast 계층을 자동 요청',
      '셀피 미러링 규칙 — 전면 렌즈만 좌우 반전. 후면은 그대로 둬 현실의 글자가 뒤집히지 않게',
      'PiP·전체화면 — 데스크탑은 여러 피드를 한 캔버스로 합성한 네이티브 PiP, 막힌 환경은 페이지 내장 창으로 폴백',
      '오디오 품질 제어 — 발행 mute 대신 게인 페이드로 동작하는 노이즈 게이트, 참가자별 볼륨·음소거',
      '앱 배포 — /download가 OS를 감지해 자체 오브젝트 스토리지의 최신 빌드를 presigned URL로 제공, 인앱 자동 업데이트',
    ],
  },
  {
    kind: 'gallery',
    heading: '화면 · SCREENS',
    media: [
      { kind: 'image', mediaId: M.roomList, caption: '홈 — 내 방 목록' },
      { kind: 'image', mediaId: M.createRoom, caption: '방 만들기 — 이름과 선택 PIN' },
      { kind: 'image', mediaId: M.shareQr, caption: '공유 — 8자리 코드와 QR' },
      { kind: 'image', mediaId: M.preflight, caption: '입장 준비 — 어떤 카메라를 가져갈지 고른다' },
      { kind: 'image', mediaId: M.moreMenu, caption: '방 메뉴 — 마이크 설정, 라이브 송출, 방 종료' },
      { kind: 'image', mediaId: M.audio, caption: '마이크 설정 — 노이즈 게이트와 감도' },
      { kind: 'image', mediaId: M.download, caption: '다운로드 — OS를 감지해 최신 빌드를 준다' },
      { kind: 'image', mediaId: M.login, caption: '로그인 — 이메일과 구글' },
    ],
  },
  {
    kind: 'gallery',
    heading: '모바일 · MOBILE',
    body: '같은 React PWA를 모바일에서도 그대로 렌더합니다. 폰은 카메라이면서 동시에 시청 화면이기도 합니다.',
    media: [
      { kind: 'image', mediaId: M.mHome, caption: '모바일 홈' },
      { kind: 'image', mediaId: M.mCameras, caption: '모바일 카메라 관리' },
      { kind: 'image', mediaId: M.mPreflight, caption: '모바일 입장 준비' },
      { kind: 'image', mediaId: M.mGrid, caption: '모바일 멀티앵글' },
    ],
  },
  {
    kind: 'gallery',
    heading: '전체 구조 한눈에 · ARCHITECTURE',
    body: '클라이언트는 단 하나의 React PWA입니다. 홈서버 컨테이너 7개가 미디어·시그널링·저장을 전부 담당합니다.',
    media: [{ kind: 'image', mediaId: M.dgOverview, caption: '기기 프리뷰만 P2P, 방 미디어는 전부 SFU를 지난다' }],
  },
  {
    kind: 'timeline',
    heading: '역할 · ROLE',
    body: '단독 개발. git 저자가 전 저장소에서 한 명으로 일치한다 — service 94커밋 · desktop 20커밋 · landing 2커밋.',
    bullets: [
      '2026.05 — 기획·UI·React PWA·Express/Socket.IO·MySQL 스키마·인증(JWT + Google OAuth)·mediasoup 기반 SFU 직접 구현·홈서버 Docker 구성',
      '2026.06 초 — 라이브 끊김 진단에서 원인이 회선임을 확인하고 미디어 계층을 LiveKit 자가호스팅으로 전면 교체. 기기 P2P 프리뷰와 coturn HMAC ephemeral 구성',
      '2026.06 중 — 데스크탑 셸(Electron) 신규. Swift 네이티브 캡처 사이드카(ScreenCaptureKit + CoreAudio 프로세스 탭), ffmpeg RTMP 송출, DRM 브라우저 라이브',
      '2026.06 중 — 보안·확장성 자체 감사 11건 진단 후 수정·배포. 캐파 계산에 따라 비트레이트 하향과 동시 라이브 가드 도입',
      '2026.06 말 — Windows 포팅. C++/WinRT(WGC·WASAPI) 캡처, C#/.NET 8(WebView2) DRM 브라우저, 인코더 프로브, 원샷 빌드 스크립트',
      '2026.07 — longdcam에서 GHC로 전면 리네이밍(도메인·컨테이너·DB·버킷·네이티브 바이너리·브리지 API), 공용 홈서버 격리 하드닝',
      '2026.07~08 — macOS 코드서명·공증, 인앱 자동 업데이트, 릴리스 배포 파이프라인. 데스크탑 0.1.4 라이브',
    ],
  },
  {
    kind: 'challenge',
    heading: '기술적으로 풀어낸 문제들',
    body: '쉬운 길이 막힌 지점들을 직접 설계로 돌파했습니다. 개선 전후와 실측값은 아래 딥다이브에서 근거와 함께 다룹니다.',
    bullets: [
      '화질·끊김 문제로 직접 운영하던 영상 서버(mediasoup)를 LiveKit으로 전면 교체 — 폰은 단일 화질, PC는 3단계 화질로 분리해 업로드가 나뉘어 고화질이 굶주리던 문제 해결(SFU 서버에 직접 질의해 폰 layers=1 · PC layers=3 확인)',
      '홈서버 회선이 버틸 수 있는 한계를 먼저 계산 — 45방 기준 필요 140~250Mbps에 업링크 실측은 87Mbps였다. 데스크탑 송출을 3.5 → 2.0Mbps로, 화면 공유를 3.0 → 2.0Mbps로 낮추고 동시 라이브 8개·사용자당 카메라 3대 상한을 두어 회선 포화를 사전 차단',
      '외부 클라우드 없이 영상 서버·중계 서버·방송 입력·DB를 홈서버 컨테이너 7개로 직접 운영 — 유휴 시 7개 합계 CPU 1.58% · 336MiB, 배포 후 9일 연속 재시작 0회',
      '기기 카메라 미리보기만 SFU를 거치지 않고 기기 간 직접 연결(P2P)로 붙였다 — 방 통화는 참가자 수와 무관하게 SFU를 지나고, 희소한 홈서버 업링크는 미리보기 트래픽에 쓰지 않는다',
      '한 계정의 여러 기기를 각각 독립 카메라로 등록해 멀티앵글로 송출하는 구조 설계 — 사용자:기기 식별자로 참가자를 나눠 기기마다 원격 제어도 가능',
      '브라우저 캡처로는 DRM 재생 화면이 검게 나오고, 특정 앱의 오디오만 뽑을 수도 없었다 — 웹 UI는 그대로 두고 OS 능력만 브리지로 주입하는 데스크탑 셸을 만들어, macOS(ScreenCaptureKit·CoreAudio·WKWebView)와 Windows(WGC·WASAPI·WebView2)에 각각 구현. 데스크탑 전용 React 화면은 0개',
      '실측 체감 — 방 진입에서 내 카메라 첫 프레임까지 154ms, 참여부터 폰 2대 포함 3앵글이 붙기까지 1.87초, 앵글 전환 210ms',
    ],
  },
  {
    kind: 'default',
    heading: 'AI 활용 · AI IN THIS PROJECT',
    body: '실시간 미디어처럼 영역마다 판단 기준이 다른 코드베이스라, 도메인별 전담 에이전트를 정의해 개발했습니다.',
    bullets: [
      '역할별 서브에이전트 6종 정의 — WebRTC·미디어 파이프라인, 백엔드, DB, 데브옵스, 프론트엔드, 코드 리뷰',
      '각 에이전트에 담당 파일 경로와 판단 범위를 명시해, 시그널링·SFU 설정처럼 민감한 영역을 무관한 변경으로부터 분리',
      '미디어 서버 교체(mediasoup → LiveKit)처럼 넓은 변경도 담당 에이전트 단위로 쪼개 진행',
    ],
  },
  {
    kind: 'default',
    heading: '측정하지 않은 것 · NOT MEASURED',
    body: '이 페이지의 수치는 전부 실제로 측정한 값입니다. 반대로 측정하지 못한 것도 그대로 적어 둡니다.',
    bullets: [
      'mediasoup → LiveKit 교체 전후 정량 비교 — 교체 당시 계측 하네스가 없었고, 끊김의 원인이 회선이라 로컬 A/B로는 원인 자체가 재현되지 않는다. 대신 검증 가능한 것만 실었다',
      '재연결 소요 시간 — 소켓을 강제로 끊는 두 방법이 모두 실패해 이벤트를 잡지 못했다. 관찰 결과만 기록',
      '프로덕션 부하 시 리소스, 글라스-투-글라스 지연, 네이티브 캡처 fps·CPU — 실사용자 트래픽이나 물리 계측이 필요해 미측정',
      '지연·RTT 실측은 기기 3대가 전부 같은 노트북 안에서 돈 결과라 실사용을 대표하지 않는다',
    ],
  },
  {
    kind: 'default',
    heading: '확장 방향 · NEXT',
    bullets: [
      '미디어 오프로드 — 동시 라이브 8개 상한을 넘으려면 미디어만 기가비트 호스트로 분리해야 한다. "클라우드 비용 0" 원칙과 충돌해 트레이드오프를 다시 정하는 결정이 필요하다',
      '시청자가 많은 방송은 HLS pull — 지연을 포기하는 대신 CDN 캐싱으로 대역폭 문제를 우회',
      '모니터링·알림, 자동 백업, CI/CD — 지금은 배포 헬스체크와 도커 로그가 전부다',
      '모바일 네이티브 본구현·녹화·JWT refresh — 구상 단계',
    ],
  },
]

const now = Math.floor(Date.now() / 1000)
const summary =
  '여러 각도를 찍으려면 장비가 각도만큼 늘고, 송출하려면 OBS를 따로 깔아야 했습니다. ' +
  '갖고 있는 기기를 그대로 카메라로 쓰고, 송출도 앱 안에서 끝내고 싶어 만들었습니다. ' +
  '데스크탑 앱이 화면·앱 오디오는 물론 일반 캡처로는 검게 나오는 DRM 재생 화면까지 직접 잡아 내보내고, ' +
  '웹에서는 RTMP로 OBS가 그대로 합류합니다. 기기 여러 대를 독립 카메라로 등록해 멀티앵글까지 한 방에서 처리하는 셀프호스팅 라이브 서비스.'

const existing = sqlite.prepare('select id, cover_id, logo_id from projects where profile_id=? and slug=?')
  .get(profile.id, SLUG) as { id: number; cover_id: number | null; logo_id: number | null } | undefined
if (!existing) throw new Error('ghc 프로젝트 행이 없다 — 먼저 시드해야 함')

sqlite.prepare(
  'update projects set tag=?, year=?, role=?, url=?, summary=?, metrics=?, sections=?, stack=?, related_note_ids=?, status=?, featured=1, published_at=coalesce(published_at,?), updated_at=? where id=?',
).run(
  '실시간 · 미디어',
  '2026.05 — 운영 중',
  '단독 · 풀스택 + 네이티브',
  'longdcam-front.ghmate.com',
  summary,
  JSON.stringify(metrics),
  JSON.stringify(sections),
  JSON.stringify(stack),
  JSON.stringify(noteIds),
  'published',
  now,
  now,
  existing.id,
)
console.log(`[project] ghc(#${existing.id}) 갱신 — sections ${sections.length} · notes ${JSON.stringify(noteIds)}`)

sqlite.close()
