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
  // 2회차 — 데스크탑 앱 실물 (2026-08-14)
  { name: 'dDrm', key: 'ghc-desktop-drm-comparison.png', file: SS('desktop-30-drm-engine-comparison'), alt: '같은 DRM 스트림을 두 엔진에서 연 결과 — 앱 내장 Chromium은 검은 화면, 브라우저 라이브 헬퍼는 정상 재생', w: 2000, h: 1275 },
  { name: 'dCrop', key: 'ghc-desktop-toolbar-crop.png', file: SS('desktop-31-toolbar-crop'), alt: '헬퍼 창에는 툴바가 보이지만 시청자에게 도착한 화면에는 없다', w: 1700, h: 710 },
  { name: 'dHelper', key: 'ghc-desktop-helper-window.png', file: SS('desktop-32-helper-window'), alt: '브라우저 라이브 헬퍼 창 — 주소창과 소리 잠금, LIVE 버튼이 있는 전용 툴바', w: 3200, h: 1960 },
  { name: 'dRoomBL', key: 'ghc-desktop-room-browser-live.png', file: SS('desktop-33-room-browser-live'), alt: '브라우저 라이브가 송출 중인 방 — 타일 라벨이 페이지 제목으로 붙는다', w: 2560, h: 1640 },
  { name: 'dModal', key: 'ghc-desktop-native-live-modal.png', file: SS('desktop-34-native-live-modal'), alt: '네이티브 라이브 모달 — 화면과 창 중에서 송출할 소스를 고른다', w: 880, h: 1180 },
  { name: 'dAudio', key: 'ghc-desktop-app-audio-mute.png', file: SS('desktop-35-app-audio-mute'), alt: '앱 오디오 캡처 — 이 기기에서는 안 들리고 라이브에는 그대로 나간다', w: 880, h: 820 },
  { name: 'dRoomWin', key: 'ghc-desktop-room-window-capture.png', file: SS('desktop-36-room-native-window-capture'), alt: '화면 공유가 아니라 앱이 직접 창을 캡처해 송출 중인 방', w: 2560, h: 1640 },
  { name: 'dInfo', key: 'ghc-desktop-app-info.png', file: SS('desktop-37-app-info-update'), alt: '데스크탑 전용 앱 정보 — 현재 v0.1.4, 최신 v0.1.4 (실제 배포 피드 조회)', w: 900, h: 760 },
  { name: 'dMenubar', key: 'ghc-desktop-macos-menubar.png', file: SS('desktop-38-macos-menubar'), alt: 'macOS 메뉴바에 GHC로 뜨는 서명·공증 패키지 빌드', w: 2400, h: 1900 },
  { name: 'vBrowserLive', key: 'ghc-browser-live-flow.mp4', file: VD('browser-live-flow'), alt: '방 메뉴에서 브라우저 라이브를 열고 LIVE를 누르기까지, 그리고 시청자 화면에 뜨는 순간', w: 1920, h: 1080 },
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
const pBrowserLive = await putObject('ghc-browser-live-flow-poster.jpg', `${ASSETS}/videos/browser-live-flow.poster.jpg`)
console.log('[media] 포스터 5개 업로드 완료')

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
      'video/browser-live-flow.mp4': { mediaId: M.vBrowserLive, poster: pBrowserLive },
      'img/drm-engine-comparison.png': { mediaId: M.dDrm },
      'img/toolbar-crop.png': { mediaId: M.dCrop },
      'img/native-live-modal.png': { mediaId: M.dModal },
      'img/app-audio-mute.png': { mediaId: M.dAudio },
      'img/room-native-window-capture.png': { mediaId: M.dRoomWin },
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
  { value: '보호된 영상까지', label: 'DRM이 걸려 일반 앱에서는 재생도 안 되는 스트리밍을 전용 창으로 방송' },
  { value: '140~250 vs 87 Mbps', label: '동시 45개 방에 필요한 대역폭 vs 집 서버의 실제 회선 (실측)' },
  { value: '9일 무중단', label: '집 서버 컨테이너 7개 · 유휴 시 CPU 1.58% · 메모리 336MB' },
]

const stack = [
  'TypeScript', 'React 18 · Vite · PWA', 'Zustand', 'Tailwind CSS',
  'Node 20 · Express', 'Socket.IO', 'LiveKit SFU (자가호스팅)', 'WebRTC',
  'coturn', 'LiveKit Ingress (RTMP)',
  'MySQL 8 · Sequelize', 'Redis', 'MinIO (S3 호환)',
  'Electron', 'Swift · ScreenCaptureKit · CoreAudio', 'C++ / WinRT', 'C# / .NET 8 (WebView2)',
  'ffmpeg', 'Docker Compose', 'Cloudflare',
]

const sections = [
  {
    kind: 'lead',
    heading: '한 줄로 말하면',
    body:
      '여러 각도에서 찍으려면 각도만큼 카메라를 사야 하고, 그걸 방송으로 내보내려면 OBS 같은 프로그램을 따로 배워야 합니다. ' +
      'GHC는 둘 다 없앴습니다. 서랍에 있는 안 쓰는 폰이 카메라가 되고, 방송은 앱 안에서 버튼 하나로 시작됩니다.',
    bullets: [
      '기기가 곧 카메라 — 같은 계정으로 로그인만 하면 그 폰이 카메라 목록에 들어온다',
      '방송 프로그램이 필요 없다 — 앱이 화면과 소리를 직접 잡아 내보낸다',
      '보호된 영상도 방송된다 — 다른 도구로는 안 되는 부분이고, 이 서비스에서 가장 손이 많이 갔다',
      '클라우드 비용 0 — 집에 있는 컴퓨터 한 대로 운영 중',
    ],
  },
  {
    kind: 'gallery',
    heading: '① 다른 도구로는 안 되는 것 — 보호된 영상 방송하기',
    body:
      '넷플릭스처럼 저작권 보호가 걸린 영상은 일반 앱에서 아예 재생되지 않습니다. 재생에 필요한 열쇠를 앱이 갖고 있지 않기 때문입니다. ' +
      '그래서 재생만 담당하는 전용 창을 따로 만들었습니다. 그 창에서 영상을 틀고, 그 창만 방송으로 내보냅니다. ' +
      '창을 여는 것과 방송을 시작하는 것도 분리했습니다. 로그인 화면이 그대로 방송되면 안 되니까요. ' +
      '창에서 로그인하고 원하는 화면까지 옮긴 뒤 LIVE를 눌러야 그때부터 나갑니다.',
    media: [
      { kind: 'image', mediaId: M.dDrm, caption: '같은 영상을 두 곳에서 연 결과 — 왼쪽(앱)은 재생되지 않아 검은 화면, 오른쪽(전용 창)은 정상 재생' },
      { kind: 'video', mediaId: M.vBrowserLive, caption: '왼쪽은 방송하는 사람, 오른쪽은 보는 사람 — LIVE를 누르기 전까지는 아무것도 나가지 않는다', poster: pBrowserLive },
    ],
  },
  {
    kind: 'gallery',
    heading: '② 폰 세 대가 카메라 세 대',
    body:
      '같은 계정으로 로그인한 기기는 카메라 목록에 자동으로 들어옵니다. ' +
      'PC로 방에 들어가면 켜져 있는 내 기기들이 알아서 합류해 각자의 각도를 올립니다. ' +
      '사람은 한 명인데 화면에는 카메라가 세 개 뜹니다. 폰을 만질 필요 없이 PC에서 켜고 끄고 렌즈까지 바꿉니다.',
    media: [
      { kind: 'video', mediaId: M.vMulti, caption: '왼쪽 폰이 카메라, 오른쪽 PC가 보는 화면 — 각도 세 개가 붙고 전환까지', poster: pMulti },
      { kind: 'image', mediaId: M.grid3, caption: '참가자는 한 명인데 카메라는 세 개 ("1명 · 기기 3")' },
      { kind: 'video', mediaId: M.vRegister, caption: '폰을 카메라로 추가하는 데 필요한 건 로그인 한 번뿐', poster: pRegister },
    ],
  },
  {
    kind: 'gallery',
    heading: '③ 집에 있는 컴퓨터 한 대로 운영합니다',
    body:
      '영상 서버·중계 서버·방송 입력·데이터베이스까지 전부 집 서버에서 돌립니다. 외부 클라우드를 쓰지 않아 비용이 들지 않는 대신, 회선이 곧 한계입니다. ' +
      '그래서 만들기 전에 계산부터 했습니다. 동시에 45개 방을 쓰면 140~250Mbps가 필요한데 실제 회선은 87Mbps였습니다. ' +
      '그 숫자에 맞춰 화질 상한과 동시 방송 개수를 정했고, 지금 컨테이너 7개가 9일째 재시작 없이 돌고 있습니다.',
    media: [
      { kind: 'image', mediaId: M.dgOverview, caption: '클라이언트는 웹 하나, 서버는 집 컴퓨터 한 대 안의 컨테이너 7개' },
    ],
  },
  {
    kind: 'features',
    heading: '핵심 기능',
    bullets: [
      '보호된 영상 방송 — 앱에서는 재생도 안 되는 스트리밍을 전용 창에서 틀어 내보낸다',
      '화면·창 방송 — OBS 없이 앱이 직접 캡처한다. 특정 앱의 소리만 골라 넣을 수도 있다',
      'OBS도 그대로 — 방마다 주소와 키를 발급해, 쓰던 도구가 있으면 그대로 합류할 수 있다',
      '기기 자동 등록 — 로그인한 기기가 카메라가 되고, 방에 들어가면 알아서 합류한다',
      '원격 제어 — 다른 내 기기의 카메라를 켜고 끄고, 전면·후면 렌즈까지 바꾼다',
      '방 관리 — 8자리 코드와 QR로 초대, 선택 비밀번호, 방장·멤버·뷰어 권한 구분',
    ],
  },
  {
    kind: 'gallery',
    heading: '화면',
    media: [
      { kind: 'image', mediaId: M.roomList, caption: '내 방 목록' },
      { kind: 'image', mediaId: M.cameras, caption: '카메라 관리 — 내 다른 기기 화면을 서버를 거치지 않고 바로 미리본다' },
      { kind: 'image', mediaId: M.preflight, caption: '입장 전에 어떤 카메라를 데려갈지 고른다' },
      { kind: 'image', mediaId: M.rtmpSetup, caption: 'OBS로 방송하고 싶으면 주소와 키를 받아 넣으면 된다' },
      { kind: 'image', mediaId: M.mGrid, caption: '같은 화면이 모바일에서도 그대로 — 웹 하나로 전부 굴린다' },
    ],
  },
  {
    kind: 'timeline',
    heading: '무엇을 했나',
    body: '기획부터 운영까지 단독 개발. 저장소 세 곳의 커밋 저자가 전부 한 명이다.',
    bullets: [
      '2026.05 — 기획·디자인부터 웹·서버·DB·로그인까지 혼자 만들어 첫 버전을 띄웠다',
      '2026.06 — 라이브가 자꾸 끊겨 원인을 파다 보니 코드가 아니라 회선이었다. 영상 서버를 통째로 교체하고, 회선 한계를 계산해 화질과 동시 방송 상한을 다시 정했다',
      '2026.06 — 데스크탑 앱을 새로 만들었다. Mac은 Swift, Windows는 C++·C#으로 화면·소리·보호 영상 재생을 각각 구현했다',
      '2026.07~08 — 서비스 이름을 전면 변경하고, Mac 앱 서명·공증과 자동 업데이트까지 붙여 배포했다 (현재 macOS 0.1.4)',
    ],
  },
  {
    kind: 'challenge',
    heading: '기술적으로 풀어낸 문제들',
    body: '자세한 과정과 근거는 아래 딥다이브 6편에서 다룹니다.',
    bullets: [
      '라이브가 자꾸 끊겼다 — 원인이 코드가 아니라 회선이라는 걸 확인하고, 직접 운영하던 영상 서버를 LiveKit으로 전면 교체했다. 폰은 화질 하나, PC는 세 단계로 나눠 업로드가 갈리지 않게 했다',
      '만들기 전에 한계를 먼저 쟀다 — 필요한 대역폭 140~250Mbps에 실제 회선은 87Mbps. 송출 화질을 3.5에서 2.0Mbps로 낮추고 동시 방송 8개, 사용자당 카메라 3대로 상한을 걸어 회선이 막히는 상황을 사전에 없앴다',
      '앱에서는 보호된 영상이 재생되지 않았다 — 앱이 쓰는 브라우저 엔진에 재생 열쇠가 하나도 없었다. 재생을 OS 기본 엔진에 맡기는 전용 창을 만들어 우회했고, 창이 뜨는 데 220ms, 방송 버튼을 누르면 시청자 화면에 1.99초 만에 도착한다',
      '화상회의 도구는 "사람 한 명 = 카메라 한 개"를 전제로 만들어져 있다 — 참가자를 사람이 아니라 사용자:기기 단위로 쪼개니 멀티앵글도, 기기별 원격 제어도 자연스럽게 풀렸다',
    ],
  },
  {
    kind: 'default',
    heading: 'AI 활용',
    body: '실시간 영상처럼 영역마다 판단 기준이 다른 코드라, 영역별 전담 에이전트를 정의해 개발했습니다.',
    bullets: [
      '역할별 에이전트 6종 — 실시간 미디어, 백엔드, DB, 인프라, 프론트엔드, 코드 리뷰',
      '각 에이전트에 담당 파일과 판단 범위를 못 박아, 잘못 건드리면 위험한 영역을 분리했다',
      '영상 서버 교체처럼 넓은 변경도 담당 단위로 쪼개 진행했다',
    ],
  },
  {
    kind: 'default',
    heading: '한계와 다음',
    bullets: [
      '이 페이지의 수치는 전부 실제로 측정한 값이다. 반대로 서버 교체 전후 정량 비교와 실사용 부하는 측정하지 못했고, 그대로 남겨 둔다',
      '동시 방송 8개를 넘기려면 영상 서버만 빠른 회선으로 분리해야 한다 — "클라우드 비용 0" 원칙과 충돌해 다시 결정해야 하는 지점이다',
      'Windows 배포가 0.1.1에 멈춰 있다. 릴리스 과정을 양쪽으로 맞추는 일이 남았다',
    ],
  },
]

const now = Math.floor(Date.now() / 1000)
const summary =
  '안 쓰는 폰이 카메라가 되고, 방송은 앱 안에서 버튼 하나로 시작되는 라이브 서비스. ' +
  'OBS 같은 방송 프로그램 없이 앱이 화면과 소리를 직접 잡아 내보내고, ' +
  '일반 앱에서는 재생조차 안 되는 보호된 영상까지 전용 창으로 방송합니다. ' +
  '서버는 클라우드가 아니라 집에 있는 컴퓨터 한 대입니다.'

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
