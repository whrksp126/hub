import 'server-only'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const endpoint = (process.env.S3_ENDPOINT || 'https://objectstore.ghmate.com').replace(/\/$/, '')
const bucket = process.env.S3_BUCKET || 'hub'
const region = process.env.S3_REGION || 'us-east-1'
const accessKeyId = process.env.S3_ACCESS_KEY_ID
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY

export const s3Enabled = Boolean(accessKeyId && secretAccessKey)

export const s3 = s3Enabled
  ? new S3Client({
      endpoint,
      region,
      forcePathStyle: true, // MinIO path-style
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    })
  : null

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
  if (!s3) throw new Error('S3(MinIO) 미설정: S3_ACCESS_KEY_ID/SECRET 필요')
  const objectKey = key.startsWith('media/') ? key : `media/${key}`
  await s3.send(
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
