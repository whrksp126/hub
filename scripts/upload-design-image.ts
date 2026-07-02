/**
 * Claude Design에서 받아 persisted된 이미지(JSON 안 base64)를 MinIO에 올리고
 * media 테이블에 등록한다. 등록된 media id를 stdout에 `MEDIA_ID=<id>`로 출력.
 *
 * 사용: pnpm tsx scripts/upload-design-image.ts <persistedJson> <keyName> "<alt>"
 */
import { readFileSync } from 'node:fs'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from '../src/db/schema'

config({ path: '.env.local' })
config({ path: '.env' })

const [persistedPath, keyName, alt] = process.argv.slice(2)
if (!persistedPath || !keyName) {
  console.error('usage: tsx upload-design-image.ts <persistedJson> <keyName> "<alt>"')
  process.exit(1)
}

const raw = JSON.parse(readFileSync(persistedPath, 'utf8'))
const buf: Buffer = Buffer.from(raw.content, 'base64')
const isPng = buf[0] === 0x89 && buf[1] === 0x50
const isJpg = buf[0] === 0xff && buf[1] === 0xd8
const ext = isPng ? 'png' : isJpg ? 'jpg' : 'bin'
const contentType = isPng ? 'image/png' : isJpg ? 'image/jpeg' : 'application/octet-stream'

const endpoint = (process.env.S3_ENDPOINT || 'https://objectstore.ghmate.com').replace(/\/$/, '')
const bucket = process.env.S3_BUCKET || 'hub'
const region = process.env.S3_REGION || 'us-east-1'
const accessKeyId = process.env.S3_ACCESS_KEY_ID
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY
if (!accessKeyId || !secretAccessKey) {
  console.error('S3 자격증명 없음 (.env.local의 S3_ACCESS_KEY_ID/SECRET 필요)')
  process.exit(1)
}

const s3 = new S3Client({
  endpoint,
  region,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
})

const sqlite = new Database(process.env.DATABASE_PATH || './data/hub.db')
const db = drizzle(sqlite, { schema })

async function main() {
  const objectKey = `media/${keyName}.${ext}`
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: buf,
      ContentType: contentType,
      ACL: 'public-read',
    }),
  )
  const url = `${endpoint}/${bucket}/${objectKey}`
  const [row] = await db
    .insert(schema.media)
    .values({ filename: `${keyName}.${ext}`, url, alt: alt || keyName, mime: contentType, size: buf.length })
    .returning({ id: schema.media.id })
  console.log(`uploaded → ${url}`)
  console.log(`MEDIA_ID=${row.id}`)
  sqlite.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
