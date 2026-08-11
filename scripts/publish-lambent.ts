/**
 * Lambent 프로젝트 상세 + 딥다이브 5편을 신규 발행한다.
 *
 * 재료: showsound(Lambent) 담당 에이전트가 만든 portfolio_assets.
 * 1) 자산을 MinIO(hub/media)에 업로드하고 media 행을 upsert (파일명 기준 재실행 안전)
 * 2) notes 5편을 마크다운에서 NoteBlock[]으로 변환해 upsert
 * 3) projects.lambent 행을 upsert (없으면 insert)
 *
 * 스크린샷/다이어그램은 원본(4112px·최대 3853px)을 그대로 쓰지 않고 사전 리사이즈본을 올린다.
 *
 * 실행: pnpm exec tsx scripts/publish-lambent.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import Database from 'better-sqlite3'

// ── env(.env.local) 로드 ──────────────────────────────────────────────
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const ASSETS = '/Users/whrksp126/other/project/showsound/portfolio_assets'
// 리사이즈본(스크린샷 2400px / 다이어그램 1800px / 로고 512px)
const PREP = '/private/tmp/claude-501/-Users-whrksp126-other-project-hub/106acfd6-5020-4520-8896-f99b35876bf0/scratchpad/lambent'
const USERNAME = 'geonho'
const SLUG = 'lambent'

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
    sqlite
      .prepare('update media set url=?, alt=?, width=?, height=?, mime=?, size=? where id=?')
      .run(url, alt, width, height, mime(key), body.length, exist.id)
    return exist.id
  }
  const r = sqlite
    .prepare('insert into media (filename,url,alt,width,height,mime,size,created_at) values (?,?,?,?,?,?,?,?)')
    .run(key, url, alt, width, height, mime(key), body.length, now)
  return Number(r.lastInsertRowid)
}

/** 포스터처럼 media 행이 필요 없는 오브젝트는 URL만 반환 */
async function putObject(key: string, file: string): Promise<string> {
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: `media/${key}`, Body: fs.readFileSync(file), ContentType: mime(key) }))
  return publicUrl(`media/${key}`)
}

// ── 1. 자산 업로드 ────────────────────────────────────────────────────
const SHOT = (n: string) => `${PREP}/img/${n}.png` // 2400×1552
const DG = (n: string) => `${PREP}/dg/${n}.png`

type Up = { name: string; key: string; file: string; alt: string; w: number; h: number }
const UPLOADS: Up[] = [
  // 오버레이 — 배경 3종 × ON/OFF
  { name: 'darkOn', key: 'lambent-bloom-dark-on.png', file: SHOT('A1-bloom-dark-on'), alt: '어두운 배경 위에서 화면 네 변이 호박색 빛으로 물든 Lambent 오버레이', w: 2400, h: 1552 },
  { name: 'darkOff', key: 'lambent-bloom-dark-off.png', file: SHOT('A2-bloom-dark-off'), alt: '같은 화면, 오버레이를 껐을 때', w: 2400, h: 1552 },
  { name: 'lightOn', key: 'lambent-bloom-light-on.png', file: SHOT('A3-bloom-light-on'), alt: '흰 배경 위 오버레이 켬 — 밝기 대신 색이 물든다', w: 2400, h: 1552 },
  { name: 'lightOff', key: 'lambent-bloom-light-off.png', file: SHOT('A4-bloom-light-off'), alt: '흰 배경 위 오버레이 끔', w: 2400, h: 1552 },
  { name: 'blueOn', key: 'lambent-bloom-blue-on.png', file: SHOT('A5-bloom-blue-on'), alt: '채도 높은 파란 배경 위에서 청록 팔레트로 그려진 오버레이', w: 2400, h: 1552 },
  { name: 'blueOff', key: 'lambent-bloom-blue-off.png', file: SHOT('A6-bloom-blue-off'), alt: '같은 파란 배경, 오버레이 끔', w: 2400, h: 1552 },
  // 프리셋
  { name: 'presetBars', key: 'lambent-preset-bars.png', file: SHOT('B1-preset1-dark'), alt: '막대 프리셋 — 32밴드가 가장자리를 따라 선다', w: 2400, h: 1552 },
  { name: 'presetWave', key: 'lambent-preset-wave.png', file: SHOT('B2-preset2-dark'), alt: '파형 프리셋', w: 2400, h: 1552 },
  { name: 'presetDots', key: 'lambent-preset-dots.png', file: SHOT('B3-preset3-dark'), alt: '점선 프리셋', w: 2400, h: 1552 },
  { name: 'presetRidge', key: 'lambent-preset-ridge.png', file: SHOT('B4-preset4-dark'), alt: '윤곽 프리셋 — Oscilloscope 팔레트', w: 2400, h: 1552 },
  // 앱 UI
  { name: 'settingsGeneral', key: 'lambent-settings-general.png', file: SHOT('C1-settings-general'), alt: '설정 일반 탭 — 재생 중 헤더, 실시간 미리보기, 프리셋 5종, 세부 조정 슬라이더', w: 2400, h: 1552 },
  { name: 'settingsAudio', key: 'lambent-settings-audio.png', file: SHOT('C3-settings-bloom'), alt: '설정 일반 탭 — 다이나믹과 오디오 소스 섹션', w: 2400, h: 1552 },
  { name: 'settingsAbout', key: 'lambent-settings-about.png', file: SHOT('C4-settings-about-premium'), alt: '설정 정보 탭 — 버전, 프리미엄 활성화 상태, 업데이트 확인', w: 2400, h: 1552 },
  { name: 'menubar', key: 'lambent-menubar-menu.png', file: SHOT('C5-menubar-menu'), alt: '메뉴 막대 아이콘 메뉴 — 설정 열기, 오버레이 가리기, 종료', w: 2400, h: 1552 },
  { name: 'onboarding1', key: 'lambent-onboarding-1.png', file: SHOT('D1-onboarding-1'), alt: '온보딩 1단계 — 오버레이가 이미 뒤에서 돌고 있다', w: 2400, h: 1552 },
  { name: 'onboarding2', key: 'lambent-onboarding-2.png', file: SHOT('D2-onboarding-2'), alt: '온보딩 2단계 — 시스템 오디오 권한과 보라색 점 안내', w: 2400, h: 1552 },
  { name: 'onboarding3', key: 'lambent-onboarding-3.png', file: SHOT('D3-onboarding-3'), alt: '온보딩 3단계 — 화면 녹화 전 단축키로 가리기', w: 2400, h: 1552 },
  { name: 'landing', key: 'lambent-landing.png', file: SHOT('E1-landing'), alt: '랜딩 페이지 히어로 — 실제 앱 셰이더가 배경으로 돈다', w: 2400, h: 1552 },
  { name: 'landingPremium', key: 'lambent-landing-premium.png', file: SHOT('E2-landing-premium'), alt: '랜딩 프리미엄 섹션 — 파형 프리셋 4종과 일시불 가격', w: 2400, h: 1552 },
  { name: 'premiumLocked', key: 'lambent-premium-locked.png', file: SHOT('F1-premium-locked'), alt: '프리미엄 미활성 — 프리셋이 선택돼 있는데 아무것도 그려지지 않는다', w: 2400, h: 1552 },
  { name: 'licenseEntry', key: 'lambent-license-entry.png', file: SHOT('F2-license-entry'), alt: '라이선스 입력 화면 (키는 마스킹)', w: 2400, h: 1552 },
  { name: 'cutThrough', key: 'lambent-cursor-cutthrough.png', file: SHOT('G1-cursor-cutthrough'), alt: '포인터가 빛 아래로 들어가 그 자리에 구멍이 열린 상태', w: 2400, h: 1552 },
  // 브랜드
  { name: 'mark', key: 'lambent-mark.png', file: SHOT('lambent-mark'), alt: 'Lambent 앱 마크', w: 512, h: 512 },
  // 딥다이브 다이어그램
  { name: 'dgCompositing', key: 'lambent-dd-compositing.png', file: DG('compositing'), alt: '클릭 통과 오버레이의 합성 모델', w: 1800, h: 2426 },
  { name: 'dgCapture', key: 'lambent-dd-capture.png', file: DG('capture'), alt: '시스템 오디오 캡처 체인', w: 1800, h: 352 },
  { name: 'dgTuning', key: 'lambent-dd-tuning.png', file: DG('tuning'), alt: 'DSP 튜닝 루프', w: 1800, h: 3024 },
  { name: 'dgLicense', key: 'lambent-dd-license.png', file: DG('license'), alt: '결제에서 오프라인 검증까지의 시퀀스', w: 1800, h: 1748 },
  { name: 'dgSpikes', key: 'lambent-dd-spikes.png', file: DG('spikes'), alt: '스파이크 게이트 흐름', w: 1800, h: 800 },
  // 영상
  { name: 'videoSound', key: 'lambent-sound-to-light.mp4', file: `${ASSETS}/videos/01-sound-to-light.mp4`, alt: '조용한 도입부에서 비트가 들어오며 네 변이 살아나는 시연', w: 1670, h: 1080 },
  { name: 'videoPresets', key: 'lambent-toggle-presets.mp4', file: `${ASSETS}/videos/02-toggle-and-presets.mp4`, alt: '오버레이를 끄고 켜고 프리셋을 바꾸는 시연', w: 1670, h: 1080 },
  { name: 'videoLicense', key: 'lambent-license-activation.mp4', file: `${ASSETS}/videos/03-license-activation.mp4`, alt: '라이선스 키로 활성화해 프리미엄 셰이더가 열리는 시연', w: 1670, h: 1080 },
  { name: 'videoCutThrough', key: 'lambent-cursor-cutthrough.mp4', file: `${ASSETS}/videos/04-cursor-cutthrough.mp4`, alt: '포인터를 따라 빛에 구멍이 열리는 커서 컷스루 시연', w: 1670, h: 1080 },
]

const M: Record<string, number> = {}
for (const u of UPLOADS) {
  M[u.name] = await putMedia(u.key, u.file, u.alt, u.w, u.h)
  console.log(`[media] ${u.key} → #${M[u.name]}`)
}
const posterSound = await putObject('lambent-sound-to-light-poster.jpg', `${ASSETS}/videos/01-sound-to-light.poster.jpg`)
const posterPresets = await putObject('lambent-toggle-presets-poster.jpg', `${ASSETS}/videos/02-toggle-and-presets.poster.jpg`)
const posterLicense = await putObject('lambent-license-activation-poster.jpg', `${ASSETS}/videos/03-license-activation.poster.jpg`)
const posterCutThrough = await putObject('lambent-cursor-cutthrough-poster.jpg', `${ASSETS}/videos/04-cursor-cutthrough.poster.jpg`)
console.log('[media] 포스터 4개 업로드 완료')

// ── 2. 프로필 조회 ────────────────────────────────────────────────────
const profile = sqlite.prepare('select id from profiles where username=?').get(USERNAME) as { id: number }
if (!profile) throw new Error(`${USERNAME} 프로필 없음`)

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
    if (line === '') {
      i++
      continue
    }
    // 수평선 → divider (openday 파서는 "---" 를 문단으로 흘렸다)
    if (/^-{3,}$/.test(line)) {
      blocks.push({ type: 'divider' })
      i++
      continue
    }
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim() || undefined
      const buf: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) buf.push(lines[i]), i++
      i++
      blocks.push({ type: 'code', text: buf.join('\n'), lang })
      continue
    }
    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.slice(4) })
      i++
      continue
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3) })
      i++
      continue
    }
    // 콜아웃 — 연속된 "> " 줄을 한 블록으로 합친다(줄마다 카드가 쪼개지지 않게)
    if (line.startsWith('>')) {
      const buf: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        buf.push(lines[i].trim().replace(/^>\s?/, ''))
        i++
      }
      blocks.push({ type: 'callout', text: buf.join('\n').trim() })
      continue
    }
    if (line.startsWith('|')) {
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = lines[i]
          .trim()
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((c) => c.trim())
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
      if (!a) console.warn(`  ! 이미지 자산 미매핑: ${img[2]} — 블록 스킵`)
      if (a) {
        const b: NoteBlock = { type: 'image', mediaId: a.mediaId }
        blocks.push(b)
        i++
        pushCaptionTo(b)
      } else {
        i++
      }
      continue
    }
    const vid = line.match(/^<video\s+src="([^"]+)"/)
    if (vid) {
      const a = assetMap[vid[1]]
      if (!a) console.warn(`  ! 영상 자산 미매핑: ${vid[1]} — 블록 스킵`)
      if (a) {
        const b: NoteBlock = { type: 'video', mediaId: a.mediaId, poster: a.poster }
        blocks.push(b)
        i++
        pushCaptionTo(b)
      } else {
        i++
      }
      continue
    }
    // 일반 문단(연속 줄 병합)
    const buf = [line]
    i++
    while (i < lines.length && lines[i].trim() !== '' && !/^(#{2,3} |[-*] |\d+\. |\||>|```|!\[|<video|-{3,}$)/.test(lines[i].trim())) {
      buf.push(lines[i].trim())
      i++
    }
    blocks.push({ type: 'p', text: buf.join(' ') })
  }
  return { meta, blocks }
}

const DEEPDIVES = [
  {
    dir: '01-compositing-model',
    slug: 'lambent-compositing-model',
    assets: {
      'diagram/compositing.png': { mediaId: M.dgCompositing },
      'img/A1-bloom-dark-on.png': { mediaId: M.darkOn },
      'img/A3-bloom-light-on.png': { mediaId: M.lightOn },
      'img/A4-bloom-light-off.png': { mediaId: M.lightOff },
      'img/A5-bloom-blue-on.png': { mediaId: M.blueOn },
      'video/01-sound-to-light.mp4': { mediaId: M.videoSound, poster: posterSound },
    },
  },
  {
    dir: '02-system-audio-capture',
    slug: 'lambent-system-audio-capture',
    assets: {
      'diagram/capture.png': { mediaId: M.dgCapture },
      'img/C3-settings-bloom.png': { mediaId: M.settingsAudio },
      'img/C5-menubar-menu.png': { mediaId: M.menubar },
      'img/D2-onboarding-2.png': { mediaId: M.onboarding2 },
      'video/01-sound-to-light.mp4': { mediaId: M.videoSound, poster: posterSound },
    },
  },
  {
    dir: '03-dsp-retune',
    slug: 'lambent-dsp-retune',
    assets: {
      'diagram/tuning.png': { mediaId: M.dgTuning },
      'img/A1-bloom-dark-on.png': { mediaId: M.darkOn },
      'img/C1-settings-general.png': { mediaId: M.settingsGeneral },
      'video/01-sound-to-light.mp4': { mediaId: M.videoSound, poster: posterSound },
    },
  },
  {
    dir: '04-sealed-premium',
    slug: 'lambent-sealed-premium',
    assets: {
      'diagram/license.png': { mediaId: M.dgLicense },
      'img/F1-premium-locked.png': { mediaId: M.premiumLocked },
      'img/F2-license-entry.png': { mediaId: M.licenseEntry },
      'img/C4-settings-about-premium.png': { mediaId: M.settingsAbout },
      'img/B4-preset4-dark.png': { mediaId: M.presetRidge },
      'video/03-license-activation.mp4': { mediaId: M.videoLicense, poster: posterLicense },
    },
  },
  {
    dir: '05-spike-gate',
    slug: 'lambent-spike-gate',
    assets: {
      'diagram/spikes.png': { mediaId: M.dgSpikes },
      'img/A3-bloom-light-on.png': { mediaId: M.lightOn },
      'img/A4-bloom-light-off.png': { mediaId: M.lightOff },
      'img/A5-bloom-blue-on.png': { mediaId: M.blueOn },
      'img/A1-bloom-dark-on.png': { mediaId: M.darkOn },
      'video/02-toggle-and-presets.mp4': { mediaId: M.videoPresets, poster: posterPresets },
    },
  },
]

const noteIds: number[] = []
let order = 21
for (const dd of DEEPDIVES) {
  const file = path.join(ASSETS, 'deepdives', dd.dir, `${dd.dir}.md`)
  const { meta, blocks } = parseDeepdive(fs.readFileSync(file, 'utf8'), dd.assets)
  const now = Math.floor(Date.now() / 1000)
  const exist = sqlite.prepare('select id from notes where profile_id=? and slug=?').get(profile.id, dd.slug) as { id: number } | undefined
  const args = [meta.category ?? null, '2026.07', meta.reading_time ?? null, meta.title, meta.excerpt ?? null, JSON.stringify(blocks), order, 'published', now, now]
  if (exist) {
    sqlite
      .prepare('update notes set category=?, date=?, read_time=?, title=?, excerpt=?, content=?, "order"=?, status=?, published_at=?, updated_at=? where id=?')
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
  { value: '60 fps', label: '네 변을 매 프레임 다시 그려도 안 끊김' },
  { value: '+27%p', label: '오버레이를 켤 때 늘어나는 CPU (코어 1개 기준)' },
  { value: '0회', label: '활성화 이후 서버 호출. 검증은 계속 오프라인' },
]

const stack = [
  'Rust (staticlib · C FFI)',
  'wgpu 29 · WGSL · Metal',
  'Swift · AppKit',
  'SwiftUI (설정 창)',
  'Core Audio 프로세스 탭',
  'Oklab · Oklch',
  'Node.js · Express · PostgreSQL',
  'Docker · nginx',
  'Ed25519 · XChaCha20-Poly1305',
  'Sparkle · notarytool',
  'Lemon Squeezy',
]

const sections = [
  {
    kind: 'lead',
    heading: '개요 · OVERVIEW',
    body: '음악에 맞춰 방이 물드는 경험을 얻으려면 지금까지는 앰비라이트를 사서 모니터 뒤에 붙이거나, 비주얼라이저 앱에 창 하나를 내줘야 했습니다. Lambent는 화면 가장자리를 씁니다. 시스템에서 나는 소리를 32밴드로 나눠 네 변에 빛으로 얹습니다. 클릭이 통과하는 오버레이라 하던 일을 가리지 않습니다.',
    bullets: [
      '살 것도 붙일 것도 없습니다 — DMG 받아 실행하면 끝. 스트립도 배선도 전원도 없습니다',
      '작업을 멈추지 않아도 됩니다 — 모든 창 위에 그려지지만 마우스는 그대로 통과합니다',
      '권한은 하나뿐 — 시스템 오디오 캡처. 마이크도 화면 기록도 받지 않습니다',
      '언제든 가릴 수 있습니다 — 녹화나 발표 직전에 단축키 한 번이면 사라집니다',
    ],
  },
  {
    kind: 'gallery',
    heading: '소리가 빛이 되는 순간',
    body: '조용한 도입부에는 빛이 꺼져 있다가, 비트가 들어오면 네 변이 함께 부풉니다. 영상은 무음이라 가운데 레벨 미터가 지금 나는 소리입니다.',
    media: [
      { kind: 'video', mediaId: M.videoSound, caption: '가운데 레벨 미터가 소리, 네 변의 빛이 그 스펙트럼입니다', poster: posterSound },
    ],
  },
  {
    kind: 'gallery',
    heading: '배경이 달라도 옳게 보입니다',
    body: '오버레이는 뒤에 무엇이 있는지 읽지 않습니다. 빛을 더하는 방식이라 어두운 배경에서는 밝기가 오르고, 흰 배경에서는 색이 물듭니다. 셰이더 하나로 분기 없이 처리합니다.',
    media: [
      { kind: 'image', mediaId: M.darkOn, caption: '어두운 배경 · 켬 — 앨범 아트에서 뽑은 호박색' },
      { kind: 'image', mediaId: M.darkOff, caption: '같은 화면 · 끔' },
      { kind: 'image', mediaId: M.blueOn, caption: '파란 배경 — 청록 아트워크가 팔레트를 바꾼다' },
    ],
  },
  {
    kind: 'gallery',
    heading: '가리지 않습니다',
    body: '빛 위를 클릭하면 아래 앱이 받습니다. 포인터가 빛 아래로 들어오면 그 자리만 뚫려 가려진 내용이 보입니다.',
    media: [
      { kind: 'video', mediaId: M.videoCutThrough, caption: '포인터를 따라 구멍이 따라다닙니다 — 반경 150pt', poster: posterCutThrough },
      { kind: 'image', mediaId: M.cutThrough, caption: '가려질 내용이 있으면 그 부분만 비칩니다' },
    ],
  },
  {
    kind: 'features',
    heading: '핵심 기능 · FEATURES',
    bullets: [
      '가장자리 오버레이 — 네 변에 창 4개를 띄워 빛을 그립니다. 전체화면 앱 위에서도 뜹니다',
      '클릭 통과 — 마우스 이벤트를 받지 않습니다. 빛 위를 클릭하면 아래 앱이 받습니다',
      '커서 컷스루 — 포인터가 들어오면 그 자리만 뚫려 가려진 내용이 보입니다',
      '소리 반응 — 30 Hz–16 kHz를 32밴드로 나눈 스펙트럼과 비트·템포가 빛을 몰아갑니다',
      '무음 자동 정지 — 소리가 없으면 잦아들었다가, 다시 나면 깨어납니다',
      '앨범 아트 색 추출 — 재생 중인 곡의 아트워크에서 색을 뽑아 씁니다',
      '프리셋 5종 — 무료 Edge Bloom + 프리미엄 파형 계열 4종(막대·파형·점선·윤곽)',
      '세부 조정 — 세기·깊이·높이·투명도·둥글기를 프리셋마다 따로 기억합니다',
      '다이나믹 — 반응 속도, 대비, 비트 강조, 잔잔할 때의 움직임',
      '오디오 소스 — 시스템 전체, 또는 특정 앱 하나의 소리만',
      '라이브 미리보기 — 설정 창의 미리보기가 실제 엔진 화면이라 즉시 바뀝니다',
      '메뉴 막대 전용 — Dock 아이콘 없이 메뉴 막대가 유일한 진입점입니다',
      '전역 단축키 — 어디서든 끄고 켭니다. 접근성 권한이 필요 없습니다',
      '자동 업데이트 — 매일 확인하고, 무결성은 개발자 서명으로 봅니다',
      '프리미엄 활성화 — 키를 넣으면 이 맥에 묶이고, 비활성화로 기기를 옮깁니다',
    ],
  },
  {
    kind: 'gallery',
    heading: '프리셋 · PRESETS',
    body: '같은 소리를 다른 방식으로 그립니다. 무료 Edge Bloom은 부드러운 빛의 띠, 프리미엄 4종은 스펙트럼의 모양을 그대로 보여줍니다.',
    media: [
      { kind: 'video', mediaId: M.videoPresets, caption: '끄고 켜기와 프리셋 전환 — 미리보기도 함께 바뀝니다', poster: posterPresets },
      { kind: 'image', mediaId: M.presetBars, caption: '막대 — 32밴드가 가장자리를 따라 선다' },
      { kind: 'image', mediaId: M.presetWave, caption: '파형' },
      { kind: 'image', mediaId: M.presetDots, caption: '점선' },
      { kind: 'image', mediaId: M.presetRidge, caption: '윤곽 — Oscilloscope 팔레트' },
    ],
  },
  {
    kind: 'diagram',
    heading: '소리에서 빛까지 · HOW IT WORKS',
    body: `flowchart LR
  SND["@icon:radio 재생 중인 소리<br/>시스템 오디오"]
  TAP["@icon:shield Core Audio 프로세스 탭<br/>자기 소리 제외 · 512프레임"]
  DSP["@icon:zap Rust 코어<br/>STFT · 32밴드 · 온셋 · 템포"]
  ART["@icon:box 앨범 아트 색 추출<br/>Oklab k-means"]
  GPU["@icon:monitor wgpu · Metal<br/>프리셋 셰이더"]
  EDGE["@icon:monitor 가장자리 4분할 오버레이<br/>모든 창 위 · 클릭 통과"]
  SND --> TAP --> DSP --> GPU
  ART --> GPU
  GPU -->|"final = L + (1-a)·BG"| EDGE
  classDef c fill:#141b2e,stroke:@accent,stroke-width:1.5px,color:#e9eefb;
  class SND,TAP,DSP,ART,GPU,EDGE c;`,
    bullets: [
      '실시간 오디오 스레드는 링버퍼에 쓰기만 하고, 무거운 계산은 전부 그 밖에서 합니다',
      '탭이 주는 512프레임이 그대로 STFT 한 홉이라, 속도를 맞추는 코드가 없습니다',
    ],
  },
  {
    kind: 'gallery',
    heading: '앱 화면 · SCREENS',
    media: [
      { kind: 'image', mediaId: M.settingsGeneral, caption: '설정 — 재생 중 헤더, 실시간 미리보기, 프리셋과 세부 조정' },
      { kind: 'image', mediaId: M.settingsAudio, caption: '다이나믹과 오디오 소스' },
      { kind: 'image', mediaId: M.onboarding2, caption: '온보딩 — 권한 하나와 보라색 점의 의미' },
      { kind: 'image', mediaId: M.onboarding3, caption: '온보딩 — 녹화 전에 가리는 방법' },
      { kind: 'image', mediaId: M.menubar, caption: '메뉴 막대 — 여기가 유일한 진입점' },
      { kind: 'image', mediaId: M.landing, caption: '랜딩 — 배경이 실제 앱의 셰이더입니다' },
    ],
  },
  {
    kind: 'specs',
    heading: '배포 스펙 · SHIPPING',
    bullets: [
      '최소 macOS — 14.4',
      '아키텍처 — Universal (arm64 + x86_64)',
      '배포 — 서명 · 노타라이즈 · 스테이플 DMG',
      '필요 권한 — 시스템 오디오 캡처 1종',
      '앱 크기 — 28 MB (DMG 11.9 MB)',
      '가격 — 일시불 ₩7,000 · 기기 1대',
    ],
  },
  {
    kind: 'diagram',
    heading: '유료화 · 한 번만 온라인, 그 뒤로는 오프라인',
    body: `sequenceDiagram
  participant U as 사용자
  participant LS as Lemon Squeezy
  participant API as 활성화 서버 (홈서버)
  participant APP as Lambent
  U->>LS: 일시불 결제
  LS->>API: 웹훅 order_created
  API-->>U: 라이선스 키 발급
  U->>APP: 키 붙여넣기 (최초 1회)
  APP->>API: 활성화 요청 (키 + 기기 식별 해시)
  API-->>APP: 이 기기에 묶인 서명 라이선스
  APP->>APP: 서명 검증 → 프리미엄 셰이더 복호화
  Note over APP: 이후 실행부터 서버를 부르지 않는다<br/>검증은 전부 로컬 연산`,
    bullets: [
      '프리미엄은 조건문으로 잠그지 않습니다. 셰이더가 암호문이고, 라이선스가 있어야 열립니다',
      '서버가 멈춰도 이미 산 사람은 그대로 씁니다. 새 활성화만 잠시 미뤄집니다',
    ],
  },
  {
    kind: 'gallery',
    heading: '구매에서 해금까지',
    media: [
      { kind: 'video', mediaId: M.videoLicense, caption: '키를 넣자 같은 프리셋이 그려집니다 (실제 운영 서버로 촬영, 키는 마스킹)', poster: posterLicense },
      { kind: 'image', mediaId: M.premiumLocked, caption: '활성화 전 — 프리셋은 골랐지만 아무것도 안 그려집니다' },
      { kind: 'image', mediaId: M.settingsAbout, caption: '활성화 후 — 정보 탭에서 상태와 업데이트 확인' },
      { kind: 'image', mediaId: M.landingPremium, caption: '랜딩의 프리미엄 섹션' },
    ],
  },
  {
    kind: 'timeline',
    heading: '역할 · ROLE',
    body: '기획부터 DSP·렌더러·앱, 브랜드, 결제와 서버, 배포와 판매까지 전부 혼자 했습니다.',
    bullets: [
      '2026.07.16 — 착수 전 스파이크 4종. 오디오 탭·GPU 오버레이·앨범 아트·전체화면을 각각 실측해, 계획서의 가정 아홉 개를 반증하고 설계를 고쳤습니다',
      '2026.07 — 코어와 앱. Rust로 DSP·색 추출·렌더러·라이선스를, Swift로 오버레이·설정·온보딩을 만들고 C FFI로 이었습니다',
      '2026.07.22 — 배포. 서명부터 자동 업데이트 피드까지 전 과정을 스크립트 한 줄로 재현되게 만들었습니다',
      '2026.07.22 — 유료화. 결제와 활성화 서버를 붙이고, 실제 결제로 구매부터 기기 이동까지 검증했습니다',
      '2026.08 — 판매 중. 0.1.5가 라이브, 프리미엄은 일시불 ₩7,000 · 기기 1대',
    ],
  },
  {
    kind: 'challenge',
    heading: '기술적으로 풀어낸 문제들',
    body: '가장 어려웠던 건 기능이 아니라 “확인”이었습니다. 빛이 도는 화면은 눈으로 보면 늘 잘 되는 것처럼 보여서, 매번 눈 대신 숫자로 판정할 방법을 먼저 만들어야 했습니다. 자세한 과정은 딥다이브에서 다룹니다.',
    bullets: [
      '뒤에 뭐가 있는지 모른 채 그려야 한다 — 배경을 읽지 않고, 빛을 더하는 합성 하나로 흰 배경과 검은 배경을 동시에 만족시켰습니다',
      '자기 소리를 다시 듣는다 — 가상 드라이버 없이 시스템 출력을 듣되 자기 소리만 빼서 피드백을 막았습니다',
      '합성 신호로 맞춘 DSP가 실제 음악에서 무너졌다 — 화면을 보며 만지는 대신 파일 기반 스윕으로 다시 맞췄습니다',
      '유료 기능을 어떻게 잠그나 — 조건문 대신 셰이더 자체를 암호문으로 두고 라이선스로만 열리게 했습니다',
      '착수 전에 무엇이 틀렸는지 안다 — 스파이크 넷으로 가정 아홉 개를 먼저 깨고 시작했습니다',
    ],
  },
  {
    kind: 'default',
    heading: '확장 방향',
    bullets: [
      '조용한 곡에서 킥이 덜 잡히는 문제와 템포가 절반으로 잡히는 오류 — 원인까지 좁혔고 아직 안 고쳤습니다',
      '다중 디스플레이와 로그인 시 실행 — 코드에는 있지만 설정 화면에 아직 없습니다',
      '체험판 발급 경로 — 없습니다. 현재 신규 사용자는 무료 티어입니다',
      'Intel 실기기 · 다중 디스플레이 핫플러그 · 44.1/96 kHz — 개발기가 한 대라 미검증입니다',
    ],
  },
]

const now = Math.floor(Date.now() / 1000)
const summary =
  '재생 중인 소리를 화면 가장자리의 빛으로 그리는 macOS 앱. 창을 하나 더 열지 않고, 클릭도 그대로 통과합니다. Rust 코어와 Swift 앱으로 만들고 결제·서버·배포까지 혼자 붙여 판매 중입니다.'

// 커버는 스크린샷이 아니라 별도 제작한 브랜드 배너(2048×1000, aspect 1024/500에 맞춤).
// 다른 프로젝트(codingpt·heyvoca·ghc·orderandgo)와 같은 키비주얼 형식이다.
const coverRow = sqlite.prepare('select id from media where filename=?').get('lambent-cover.png') as { id: number } | undefined
const coverId = coverRow?.id ?? M.darkOn

const existing = sqlite.prepare('select id from projects where profile_id=? and slug=?').get(profile.id, SLUG) as { id: number } | undefined
const cols = [
  'Lambent',
  '램번트',
  'macOS 앱 · 오디오 비주얼',
  '2026.07 — 판매 중',
  '단독 · 기획부터 판매까지',
  'lambent.ghmate.com',
  summary,
  JSON.stringify(metrics),
  JSON.stringify(sections),
  JSON.stringify(stack),
  coverId, // 커버 배너 = 브랜드 키비주얼
  M.mark,
  JSON.stringify(noteIds),
  'published',
]
if (existing) {
  sqlite
    .prepare(
      'update projects set title=?, title_kr=?, tag=?, year=?, role=?, url=?, summary=?, metrics=?, sections=?, stack=?, cover_id=?, logo_id=?, related_note_ids=?, status=?, featured=1, published_at=coalesce(published_at,?), updated_at=? where id=?',
    )
    .run(...cols, now, now, existing.id)
  console.log(`[project] lambent(#${existing.id}) 갱신 — sections ${sections.length} · notes ${JSON.stringify(noteIds)}`)
} else {
  const r = sqlite
    .prepare(
      'insert into projects (profile_id,slug,title,title_kr,tag,year,role,url,summary,metrics,sections,stack,cover_id,logo_id,related_note_ids,status,"order",featured,published_at,created_at,updated_at) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    )
    .run(profile.id, SLUG, ...cols, 6, 1, now, now, now)
  console.log(`[project] lambent 신규 생성 #${r.lastInsertRowid} — sections ${sections.length} · notes ${JSON.stringify(noteIds)}`)
}

sqlite.close()
