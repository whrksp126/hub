// 단일 이미지 업로드 + media upsert. 실행: pnpm exec tsx scripts/upload-one.ts <파일> <키> <alt>  → media id 출력
import fs from "node:fs"
import { execFileSync } from "node:child_process"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import Database from "better-sqlite3"
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
const [file, key, alt] = process.argv.slice(2)
let w = 0, h = 0
if (file.endsWith('.mp4')) {
  const o = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file], { encoding: 'utf8' }).trim().split(',')
  w = Number(o[0]); h = Number(o[1])
} else {
  const out = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file], { encoding: 'utf8' })
  w = Number(out.match(/pixelWidth: (\d+)/)?.[1]); h = Number(out.match(/pixelHeight: (\d+)/)?.[1])
}
putMedia(key, file, alt, w, h).then((id) => console.log(id))
