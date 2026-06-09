import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

// Plate 본문(에디터 문서) JSON 타입. 구체 타입은 에디터 단계에서 좁힌다.
export type PlateValue = unknown

// 모든 테이블 공통 타임스탬프(초 단위 unix epoch).
const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}

const contentStatus = { enum: ['draft', 'published'] as const }

// ── 관리자 계정 (단일~소수, 세션 로그인) ──────────────────────────────
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  role: text('role').notNull().default('admin'),
  ...timestamps,
})

// ── 에이전트 API 키 (Bearer) ─────────────────────────────────────────
export const apiKeys = sqliteTable('api_keys', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  prefix: text('prefix').notNull(), // 키 식별용 앞자리(평문)
  keyHash: text('key_hash').notNull(), // sha-256(전체 키)
  scopes: text('scopes', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'`),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

// ── 미디어 (MinIO 업로드) ────────────────────────────────────────────
export const media = sqliteTable('media', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  filename: text('filename').notNull(),
  url: text('url').notNull(), // 공개 직접 URL (objectstore.ghmate.com/hub/media/...)
  alt: text('alt'),
  width: integer('width'),
  height: integer('height'),
  mime: text('mime'),
  size: integer('size'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

// ── 블로그 (중심 콘텐츠) ─────────────────────────────────────────────
export const posts = sqliteTable(
  'posts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    excerpt: text('excerpt'),
    content: text('content', { mode: 'json' }).$type<PlateValue>(),
    coverId: integer('cover_id').references(() => media.id, { onDelete: 'set null' }),
    category: text('category', { enum: ['news', 'bugfix', 'tech'] }).notNull().default('tech'),
    tags: text('tags', { mode: 'json' }).$type<string[]>(),
    theme: text('theme').notNull().default('clean'),
    status: text('status', contentStatus).notNull().default('draft'),
    publishedAt: integer('published_at', { mode: 'timestamp' }),
    ...timestamps,
  },
  (t) => [uniqueIndex('posts_slug_idx').on(t.slug)],
)

// ── 문서 (3순위) ─────────────────────────────────────────────────────
export const docs = sqliteTable(
  'docs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    section: text('section'),
    order: integer('order').notNull().default(0),
    content: text('content', { mode: 'json' }).$type<PlateValue>(),
    status: text('status', contentStatus).notNull().default('draft'),
    ...timestamps,
  },
  (t) => [uniqueIndex('docs_slug_idx').on(t.slug)],
)

// ── 서비스 (4순위) ───────────────────────────────────────────────────
export const services = sqliteTable(
  'services',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    tagline: text('tagline'),
    description: text('description', { mode: 'json' }).$type<PlateValue>(),
    logoId: integer('logo_id').references(() => media.id, { onDelete: 'set null' }),
    screenshots: text('screenshots', { mode: 'json' }).$type<number[]>(), // media id 배열
    features: text('features', { mode: 'json' }).$type<string[]>(),
    serviceUrl: text('service_url'),
    status: text('status', { enum: ['operating', 'preparing', 'closed'] })
      .notNull()
      .default('operating'),
    order: integer('order').notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex('services_slug_idx').on(t.slug)],
)

// ── 공지 (4순위) ─────────────────────────────────────────────────────
export const announcements = sqliteTable(
  'announcements',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    date: integer('date', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    type: text('type', { enum: ['maintenance', 'update', 'general'] })
      .notNull()
      .default('general'),
    content: text('content', { mode: 'json' }).$type<PlateValue>(),
    pinned: integer('pinned', { mode: 'boolean' }).notNull().default(false),
    status: text('status', contentStatus).notNull().default('draft'),
    ...timestamps,
  },
  (t) => [uniqueIndex('announcements_slug_idx').on(t.slug)],
)

// 타입 추론 export
export type User = typeof users.$inferSelect
export type ApiKey = typeof apiKeys.$inferSelect
export type Media = typeof media.$inferSelect
export type Post = typeof posts.$inferSelect
export type Doc = typeof docs.$inferSelect
export type Service = typeof services.$inferSelect
export type Announcement = typeof announcements.$inferSelect
