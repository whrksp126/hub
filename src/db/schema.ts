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
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }), // 키 소유자(사용자별)
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

// ── 포트폴리오: 프로필 (★ 핵심 콘텐츠 타입) ───────────────────────────
// 한 사용자 = 한 프로필. username으로 공개 URL(/{username})이 결정된다.
// 다양한 사용자가 각자 포트폴리오를 갖는 멀티유저 구조(현재는 단일 관리자).
export type ProfileStat = { value: string; label: string }
export type ProfileSkillGroup = { area: string; items: string[] }
export type ProfileAward = { title: string; kind: string }
export type ProfileSocial = { kind: string; label: string; url: string }
// 히어로 우측의 바로가기 하이라이트 카드. icon=아이콘키, color=프리셋키, href=내부세그먼트 또는 외부 URL.
export type ProfileCard = { icon: string; title: string; href: string; color: string }
// 포트폴리오 글(DESIGN NOTES). 디자인은 목록만 보여주므로 메타만 보관.
export type ProfileNote = {
  category: string
  date: string
  readTime: string
  title: string
  excerpt: string
}

export const profiles = sqliteTable(
  'profiles',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    // 소유자 (멀티유저). 시드/쇼케이스 프로필은 null일 수 있다.
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    username: text('username').notNull(), // 공개 URL slug (예: geonho)
    name: text('name').notNull(), // 한글 이름 (조건호)
    nameEn: text('name_en'), // 영문 (GEONHO JO)
    title: text('title'), // 직함 (풀스택 개발자 · 예비창업가)
    headline: text('headline'), // 히어로 대문자 헤드라인 (FULL-STACK / DEVELOPER)
    tagline: text('tagline'), // 한 줄 소개
    bio: text('bio'), // 프로필 카드용 짧은 소개
    intro: text('intro'), // 히어로 본문 단락
    email: text('email'),
    github: text('github'),
    phone: text('phone'),
    location: text('location'),
    education: text('education'),
    business: text('business'), // 운영 사업체 (슬기로운 사업)
    ctaTitle: text('cta_title'), // 하단 CTA 헤드라인 (예: 함께\n만들어요)
    ctaText: text('cta_text'), // 하단 CTA 설명 문구
    accent: text('accent').notNull().default('#F1531B'), // 테마 강조색
    theme: text('theme').notNull().default('editorial-dark'),
    avatarId: integer('avatar_id').references(() => media.id, { onDelete: 'set null' }),
    stats: text('stats', { mode: 'json' }).$type<ProfileStat[]>(),
    skills: text('skills', { mode: 'json' }).$type<ProfileSkillGroup[]>(),
    awards: text('awards', { mode: 'json' }).$type<ProfileAward[]>(),
    social: text('social', { mode: 'json' }).$type<ProfileSocial[]>(),
    cards: text('cards', { mode: 'json' }).$type<ProfileCard[]>(), // 히어로 바로가기 카드
    notes: text('notes', { mode: 'json' }).$type<ProfileNote[]>(),
    status: text('status', contentStatus).notNull().default('draft'),
    ...timestamps,
  },
  (t) => [uniqueIndex('profiles_username_idx').on(t.username)],
)

// ── 포트폴리오: 프로젝트(케이스 스터디) ───────────────────────────────
export type ProjectMetric = { value: string; label: string }
// 섹션/경력에 첨부하는 미디어 — image/video는 media 테이블 id, embed는 외부 URL(YouTube/Vimeo).
export type SectionMedia = { kind: 'image' | 'video' | 'embed'; mediaId?: number | null; url?: string; caption?: string }
// 케이스 스터디 섹션 시각 유형 — 같은 데이터(제목/본문/불릿)를 종류별로 다르게 렌더.
// diagram=flowchart/sequence(mermaid) / erd=Workbench ERD(React Flow) / gallery=미디어 / specs=스펙 태그.
export type ProjectSectionKind = 'default' | 'lead' | 'features' | 'challenge' | 'timeline' | 'steps' | 'diagram' | 'erd' | 'gallery' | 'specs'
export type ProjectSection = { heading: string; body?: string; bullets?: string[]; kind?: ProjectSectionKind; media?: SectionMedia[] }

export const projects = sqliteTable(
  'projects',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    profileId: integer('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(), // profile 내 고유 (예: orderandgo)
    title: text('title').notNull(), // OrderAndGo
    titleKr: text('title_kr'), // 오더앤고
    tag: text('tag'), // SaaS · 주문/결제
    year: text('year'), // 2023 — 운영 중
    role: text('role'), // 1인 풀스택
    url: text('url'), // order.ghmate.com
    summary: text('summary'),
    metrics: text('metrics', { mode: 'json' }).$type<ProjectMetric[]>(),
    sections: text('sections', { mode: 'json' }).$type<ProjectSection[]>(),
    stack: text('stack', { mode: 'json' }).$type<string[]>(),
    relatedNoteIds: text('related_note_ids', { mode: 'json' }).$type<number[]>(), // 연결된 딥다이브(notes.id) 참조
    coverId: integer('cover_id').references(() => media.id, { onDelete: 'set null' }), // 상세 상단 노션식 커버 배너 + 목록 썸네일
    logoId: integer('logo_id').references(() => media.id, { onDelete: 'set null' }), // 브랜드 로고(상세 제목 옆)
    order: integer('order').notNull().default(0),
    featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
    status: text('status', contentStatus).notNull().default('draft'),
    publishedAt: integer('published_at', { mode: 'timestamp' }),
    ...timestamps,
  },
  (t) => [uniqueIndex('projects_profile_slug_idx').on(t.profileId, t.slug)],
)

// ── 포트폴리오: 경력 항목 ─────────────────────────────────────────────
export const experiences = sqliteTable('experiences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  profileId: integer('profile_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  company: text('company').notNull(),
  role: text('role'),
  period: text('period'), // 2023.06 — 2026.02
  length: text('length'), // 2년 9개월
  context: text('context'),
  current: integer('current', { mode: 'boolean' }).notNull().default(false),
  points: text('points', { mode: 'json' }).$type<string[]>(),
  stack: text('stack', { mode: 'json' }).$type<string[]>(),
  media: text('media', { mode: 'json' }).$type<SectionMedia[]>(), // 경력 상세 갤러리(이미지/영상/임베드)
  logoId: integer('logo_id').references(() => media.id, { onDelete: 'set null' }), // 회사 로고
  coverId: integer('cover_id').references(() => media.id, { onDelete: 'set null' }), // 카드 상단 노션식 커버 배너
  order: integer('order').notNull().default(0),
  ...timestamps,
})

// ── 포트폴리오: 글(아티클) — 실제 본문을 가진 블로그 글 ────────────────
// 블록 기반 본문(가벼운 인라인 에디터). 편집/공개가 같은 블록 컴포넌트를 공유.
export type NoteBlock =
  | { type: 'h2' | 'h3' | 'p' | 'quote' | 'callout'; text: string }
  | { type: 'image'; mediaId: number | null; caption?: string }
  | { type: 'video'; mediaId?: number | null; url?: string; caption?: string }
  | { type: 'divider' }

export const notes = sqliteTable(
  'notes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    profileId: integer('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(), // profile 내 고유 (URL: /p/<user>/deep-dives/<slug>)
    category: text('category'), // 아키텍처 · 알고리즘 …
    date: text('date'), // 표시용 (2026.04)
    readTime: text('read_time'), // 8분
    title: text('title').notNull(),
    excerpt: text('excerpt'),
    coverId: integer('cover_id').references(() => media.id, { onDelete: 'set null' }),
    content: text('content', { mode: 'json' }).$type<NoteBlock[]>(), // 본문 블록
    order: integer('order').notNull().default(0),
    featured: integer('featured', { mode: 'boolean' }).notNull().default(false), // 홈 노출 여부
    status: text('status', contentStatus).notNull().default('draft'),
    publishedAt: integer('published_at', { mode: 'timestamp' }),
    ...timestamps,
  },
  (t) => [uniqueIndex('notes_profile_slug_idx').on(t.profileId, t.slug)],
)

// 타입 추론 export
export type User = typeof users.$inferSelect
export type ApiKey = typeof apiKeys.$inferSelect
export type Media = typeof media.$inferSelect
export type Post = typeof posts.$inferSelect
export type Doc = typeof docs.$inferSelect
export type Service = typeof services.$inferSelect
export type Announcement = typeof announcements.$inferSelect
export type Profile = typeof profiles.$inferSelect
export type Project = typeof projects.$inferSelect
export type Experience = typeof experiences.$inferSelect
export type Note = typeof notes.$inferSelect
