import 'server-only'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const endpoint = (process.env.S3_ENDPOINT || 'https://objectstore.ghmate.com').replace(/\/$/, '')
const bucket = process.env.S3_BUCKET || 'hub'
const region = process.env.S3_REGION || 'us-east-1'
const accessKeyId = process.env.S3_ACCESS_KEY_ID
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY

export const s3Enabled = Boolean(accessKeyId && secretAccessKey)

function buildClient(): S3Client {
  return new S3Client({
    endpoint,
    region,
    forcePathStyle: true, // MinIO path-style
    credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
  })
}

// 싱글턴으로 재사용하되, 시계 오차(RequestTimeTooSkewed)를 만나면 재생성한다.
// AWS SDK는 첫 skew 때 보정 오프셋을 캐시하는데, 호스트 시계가 정상 복구돼도
// 그 낡은 오프셋 때문에 계속 실패한다(프로세스 재시작 전까지). 클라이언트를
// 재생성하면 오프셋이 리셋돼 재시작 없이 자동 회복한다.
// (GHMATE_SERVER_GUIDE.md "서버 시각 동기" 참고 — 홈서버 RTC 미교정으로 부팅 직후 창 존재)
let client: S3Client | null = s3Enabled ? buildClient() : null

function isClockSkewError(err: unknown): boolean {
  const e = err as { name?: string; Code?: string; code?: string } | null
  const tag = `${e?.name ?? ''} ${e?.Code ?? ''} ${e?.code ?? ''}`
  return /RequestTimeTooSkewed|ClockSkew|InvalidSignature.*(time|skew)/i.test(tag)
}

// skew 감지 시 클라이언트를 재생성 후 1회 재시도하는 래퍼.
async function sendWithSkewRecovery(command: PutObjectCommand): Promise<void> {
  if (!client) throw new Error('S3(MinIO) 미설정: S3_ACCESS_KEY_ID/SECRET 필요')
  try {
    await client.send(command)
  } catch (err) {
    if (!isClockSkewError(err)) throw err
    // 캐시된 clock offset 폐기 → 재생성 → 재시도
    client = buildClient()
    await client.send(command)
  }
}

// 공개 직접 URL: https://objectstore.ghmate.com/hub/media/<key>
export function publicUrl(key: string) {
  return `${endpoint}/${bucket}/${key}`
}

// media/ prefix 아래에 업로드하고 공개 URL을 반환.
export async function uploadMedia(
  key: string,
  body: Buffer | Uint8Array,
  contentType?: string,
): Promise<string> {
  if (!s3Enabled) throw new Error('S3(MinIO) 미설정: S3_ACCESS_KEY_ID/SECRET 필요')
  const objectKey = key.startsWith('media/') ? key : `media/${key}`
  await sendWithSkewRecovery(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: body,
      ContentType: contentType,
      ACL: 'public-read',
    }),
  )
  return publicUrl(objectKey)
}
