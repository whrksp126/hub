/**
 * 로컬 DB의 포트폴리오 콘텐츠를 프로덕션에 옮길 수 있는 형태로 내보낸다.
 *
 * 핵심: media.id 는 로컬과 프로덕션이 다르다. 그래서 본문·섹션 안의 mediaId 를
 * `@@<filename>` 플레이스홀더로 바꿔서 내보내고, 적용 쪽(prod-apply-content.cjs)이
 * 프로덕션의 media 테이블에서 파일명으로 id 를 다시 찾아 넣는다.
 * (MinIO 오브젝트 자체는 이미 공용 버킷에 올라가 있으므로 URL 은 그대로 쓴다.)
 *
 * 실행: node scripts/export-content.cjs  →  scripts/prod-content.json
 */
const fs = require('node:fs')
const Database = require('better-sqlite3')

const db = new Database(process.env.DATABASE_PATH || './data/hub.db', { readonly: true })
const USERNAME = 'geonho'

const profile = db.prepare('select * from profiles where username=?').get(USERNAME)
if (!profile) throw new Error('프로필 없음')

// 파일명 ← id 역방향 맵
const mediaRows = db.prepare('select id, filename, url, alt, width, height, mime, size from media').all()
const nameById = new Map(mediaRows.map((m) => [m.id, m.filename]))

/** 객체 안의 mediaId/coverId/logoId 숫자를 `@@filename` 으로 치환 */
function deref(value) {
  if (Array.isArray(value)) return value.map(deref)
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = k === 'mediaId' && typeof v === 'number' ? (nameById.get(v) ? `@@${nameById.get(v)}` : null) : deref(v)
    }
    return out
  }
  return value
}
const refId = (id) => (id && nameById.get(id) ? `@@${nameById.get(id)}` : null)
const j = (s) => (s == null ? null : JSON.parse(s))

const payload = {
  generatedFrom: 'local',
  media: mediaRows.map(({ id, ...rest }) => rest), // id 는 버린다 — 프로덕션에서 새로 잡힌다
  profile: {
    username: profile.username,
    fields: {
      name: profile.name, name_en: profile.name_en, title: profile.title, headline: profile.headline,
      tagline: profile.tagline, bio: profile.bio, intro: profile.intro, email: profile.email,
      github: profile.github, phone: profile.phone, location: profile.location, education: profile.education,
      business: profile.business, cta_title: profile.cta_title, cta_text: profile.cta_text,
      accent: profile.accent, theme: profile.theme, status: profile.status,
    },
    json: {
      stats: j(profile.stats), skills: j(profile.skills), awards: j(profile.awards),
      social: j(profile.social), cards: j(profile.cards), notes: j(profile.notes),
    },
    avatar: refId(profile.avatar_id),
  },
  experiences: db.prepare('select * from experiences where profile_id=? order by "order"').all(profile.id).map((e) => ({
    company: e.company, role: e.role, period: e.period, length: e.length, context: e.context,
    current: e.current, order: e.order,
    points: j(e.points), stack: j(e.stack), media: deref(j(e.media)),
    logo: refId(e.logo_id), cover: refId(e.cover_id),
  })),
  projects: db.prepare('select * from projects where profile_id=? order by "order"').all(profile.id).map((p) => ({
    slug: p.slug, title: p.title, title_kr: p.title_kr, tag: p.tag, year: p.year, role: p.role, url: p.url,
    summary: p.summary, order: p.order, featured: p.featured, status: p.status,
    metrics: j(p.metrics), sections: deref(j(p.sections)), stack: j(p.stack),
    relatedNoteSlugs: (j(p.related_note_ids) || [])
      .map((id) => db.prepare('select slug from notes where id=?').get(id)?.slug)
      .filter(Boolean),
    cover: refId(p.cover_id), logo: refId(p.logo_id),
  })),
  notes: db.prepare('select * from notes where profile_id=? order by "order"').all(profile.id).map((n) => ({
    slug: n.slug, category: n.category, date: n.date, read_time: n.read_time, title: n.title,
    excerpt: n.excerpt, order: n.order, featured: n.featured, status: n.status,
    content: deref(j(n.content)), cover: refId(n.cover_id),
  })),
}

fs.writeFileSync('scripts/prod-content.json', JSON.stringify(payload, null, 1))
console.log(
  `[export] media ${payload.media.length} · experiences ${payload.experiences.length} · ` +
    `projects ${payload.projects.length} · notes ${payload.notes.length} → scripts/prod-content.json`,
)
