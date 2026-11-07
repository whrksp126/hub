/**
 * 기존 딥다이브(notes) 한 편을 담당 에이전트가 보낸 수정본 마크다운으로 갱신한다(또는 새로 만든다).
 * - 마크다운 안의 ![..](상대경로) / <video src poster> 자산을 찾아 MinIO에 올리고 media 행을 upsert
 *   (2400px 넘는 이미지는 sips로 줄여서 올림, 키 = <prefix>-<디렉터리>-<파일명>)
 * - title/category/excerpt/reading_time/본문만 바꾸고 date·order·status는 기존 값 유지
 *
 * 실행: pnpm exec tsx scripts/refresh-deepdive.ts <md경로> <slug> <키prefix> [date(새 글일 때)]
 */
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFileSync } from 'node:child_process'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import Database from 'better-sqlite3'


// ── env(.env.local) 로드 ──────────────────────────────────────────────
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

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

const [mdPath, slug, prefix, newDate] = process.argv.slice(2)
if (!mdPath || !slug || !prefix) throw new Error('usage: <md> <slug> <prefix> [date]')
const dir = path.dirname(mdPath)
const md = fs.readFileSync(mdPath, 'utf8')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-'))

function dims(file: string): [number, number] {
  const out = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file], { encoding: 'utf8' })
  return [Number(out.match(/pixelWidth: (\d+)/)?.[1] ?? 0), Number(out.match(/pixelHeight: (\d+)/)?.[1] ?? 0)]
}
function prepImage(file: string): string {
  const [w] = dims(file)
  if (w <= 2400) return file
  const dst = path.join(tmp, path.basename(file))
  execFileSync('sips', ['-Z', '2400', file, '--out', dst], { stdio: 'ignore' })
  return dst
}
const keyOf = (rel: string) => `${prefix}-${rel.replace(/^\.\//, '').replace(/[\/]/g, '-')}`

async function main() {
  const assetMap: Record<string, { mediaId: number; poster?: string }> = {}
  for (const m of md.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)) {
    const rel = m[2]
    const f = path.join(dir, rel)
    if (!fs.existsSync(f)) { console.warn(`  ! 파일 없음: ${rel}`); continue }
    const p = prepImage(f)
    const [w, h] = dims(p)
    assetMap[rel] = { mediaId: await putMedia(keyOf(rel), p, m[1] || slug, w, h) }
  }
  for (const m of md.matchAll(/<video\s+src="([^"]+)"(?:[^>]*?poster="([^"]+)")?/g)) {
    const rel = m[1]
    const f = path.join(dir, rel)
    if (!fs.existsSync(f)) { console.warn(`  ! 파일 없음: ${rel}`); continue }
    let poster: string | undefined
    let w = 0, h = 0
    if (m[2] && fs.existsSync(path.join(dir, m[2]))) {
      const pf = prepImage(path.join(dir, m[2]))
      ;[w, h] = dims(pf)
      poster = await putObject(keyOf(m[2]), pf)
    }
    assetMap[rel] = { mediaId: await putMedia(keyOf(rel), f, slug, w, h), poster }
  }
  const { meta, blocks } = parseDeepdive(md, assetMap)
  const profile = sqlite.prepare('select id from profiles where username=?').get(USERNAME) as { id: number }
  const now = Math.floor(Date.now() / 1000)
  const exist = sqlite.prepare('select id from notes where profile_id=? and slug=?').get(profile.id, slug) as { id: number } | undefined
  if (exist) {
    sqlite.prepare('update notes set category=?, read_time=?, title=?, excerpt=?, content=?, updated_at=? where id=?')
      .run(meta.category ?? null, meta.reading_time ?? null, meta.title, meta.excerpt ?? null, JSON.stringify(blocks), now, exist.id)
    console.log(`[note] update #${exist.id} ${slug} — ${blocks.length}블록, 자산 ${Object.keys(assetMap).length}`)
  } else {
    const max = (sqlite.prepare('select coalesce(max("order"),0) m from notes where profile_id=?').get(profile.id) as { m: number }).m
    const r = sqlite.prepare('insert into notes (profile_id,slug,category,date,read_time,title,excerpt,content,"order",status,published_at,updated_at,created_at) values (?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(profile.id, slug, meta.category ?? null, newDate ?? '2026.11', meta.reading_time ?? null, meta.title, meta.excerpt ?? null, JSON.stringify(blocks), max + 1, 'published', now, now, now)
    console.log(`[note] insert #${r.lastInsertRowid} ${slug} — ${blocks.length}블록`)
  }
}
main()
