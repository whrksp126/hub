/**
 * scripts/prod-content.json 을 프로덕션 DB에 적용한다.
 *
 * 순서가 중요하다:
 *   1) media 를 파일명 기준 upsert → 프로덕션에서의 실제 id 확보
 *   2) 본문/섹션 안의 `@@<filename>` 플레이스홀더를 그 id 로 치환
 *   3) profile · experiences · notes · projects upsert (projects 는 notes id 참조 때문에 마지막)
 *
 * MinIO 오브젝트는 이미 공용 버킷에 올라가 있으므로 파일 업로드는 하지 않는다.
 *
 * 실행(프로덕션 컨테이너 안):
 *   docker exec hub_app_prod node /app/scripts/prod-apply-content.cjs
 */
const fs = require('node:fs')
const path = require('node:path')
const Database = require('better-sqlite3')

const HERE = __dirname
const payload = JSON.parse(fs.readFileSync(path.join(HERE, 'prod-content.json'), 'utf8'))
const dbPath = process.env.DATABASE_PATH || './data/hub.db'
const db = new Database(dbPath)
db.pragma('foreign_keys = ON')
const now = () => Math.floor(Date.now() / 1000)

console.log(`[apply] db=${dbPath}`)

// ── 1) media upsert (파일명이 키) ────────────────────────────────────
const idByName = new Map()
const selMedia = db.prepare('select id from media where filename=?')
const insMedia = db.prepare('insert into media (filename,url,alt,width,height,mime,size,created_at) values (?,?,?,?,?,?,?,?)')
const updMedia = db.prepare('update media set url=?, alt=?, width=?, height=?, mime=?, size=? where id=?')
let mIns = 0, mUpd = 0
for (const m of payload.media) {
  const ex = selMedia.get(m.filename)
  if (ex) {
    updMedia.run(m.url, m.alt, m.width, m.height, m.mime, m.size, ex.id)
    idByName.set(m.filename, ex.id)
    mUpd++
  } else {
    const r = insMedia.run(m.filename, m.url, m.alt, m.width, m.height, m.mime, m.size, now())
    idByName.set(m.filename, Number(r.lastInsertRowid))
    mIns++
  }
}
console.log(`[media] insert ${mIns} · update ${mUpd}`)

// ── 2) `@@filename` → id 치환 ────────────────────────────────────────
const missing = new Set()
function rehydrate(v) {
  if (typeof v === 'string' && v.startsWith('@@')) {
    const name = v.slice(2)
    if (!idByName.has(name)) missing.add(name)
    return idByName.get(name) ?? null
  }
  if (Array.isArray(v)) return v.map(rehydrate)
  if (v && typeof v === 'object') {
    const out = {}
    for (const [k, val] of Object.entries(v)) out[k] = rehydrate(val)
    return out
  }
  return v
}
const jd = (v) => (v == null ? null : JSON.stringify(rehydrate(v)))
const ref = (v) => (v == null ? null : rehydrate(v))

// ── 3) profile ───────────────────────────────────────────────────────
const prof = db.prepare('select id from profiles where username=?').get(payload.profile.username)
if (!prof) throw new Error(`프로필 없음: ${payload.profile.username}`)
const PID = prof.id
{
  const f = payload.profile.fields
  const keys = Object.keys(f)
  db.prepare(
    `update profiles set ${keys.map((k) => `${k}=?`).join(', ')}, stats=?, skills=?, awards=?, social=?, cards=?, notes=?, avatar_id=?, updated_at=? where id=?`,
  ).run(
    ...keys.map((k) => f[k]),
    jd(payload.profile.json.stats), jd(payload.profile.json.skills), jd(payload.profile.json.awards),
    jd(payload.profile.json.social), jd(payload.profile.json.cards), jd(payload.profile.json.notes),
    ref(payload.profile.avatar), now(), PID,
  )
  console.log(`[profile] #${PID} ${payload.profile.username} 갱신`)
}

// ── 4) experiences (company 가 키) ───────────────────────────────────
for (const e of payload.experiences) {
  const ex = db.prepare('select id from experiences where profile_id=? and company=?').get(PID, e.company)
  const cols = [e.role, e.period, e.length, e.context, e.current, jd(e.points), jd(e.stack), jd(e.media), ref(e.logo), ref(e.cover), e.order]
  if (ex) {
    db.prepare('update experiences set role=?, period=?, length=?, context=?, current=?, points=?, stack=?, media=?, logo_id=?, cover_id=?, "order"=?, updated_at=? where id=?')
      .run(...cols, now(), ex.id)
    console.log(`[exp] update #${ex.id} ${e.company}`)
  } else {
    const r = db.prepare('insert into experiences (profile_id,company,role,period,length,context,current,points,stack,media,logo_id,cover_id,"order",created_at,updated_at) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(PID, e.company, ...cols, now(), now())
    console.log(`[exp] insert #${r.lastInsertRowid} ${e.company}`)
  }
}

// ── 5) notes (slug 가 키) ────────────────────────────────────────────
const noteIdBySlug = new Map()
for (const n of payload.notes) {
  const ex = db.prepare('select id from notes where profile_id=? and slug=?').get(PID, n.slug)
  const cols = [n.category, n.date, n.read_time, n.title, n.excerpt, jd(n.content), ref(n.cover), n.order, n.featured, n.status]
  if (ex) {
    db.prepare('update notes set category=?, date=?, read_time=?, title=?, excerpt=?, content=?, cover_id=?, "order"=?, featured=?, status=?, published_at=coalesce(published_at,?), updated_at=? where id=?')
      .run(...cols, now(), now(), ex.id)
    noteIdBySlug.set(n.slug, ex.id)
    console.log(`[note] update #${ex.id} ${n.slug}`)
  } else {
    const r = db.prepare('insert into notes (profile_id,slug,category,date,read_time,title,excerpt,content,cover_id,"order",featured,status,published_at,created_at,updated_at) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(PID, n.slug, ...cols, now(), now(), now())
    noteIdBySlug.set(n.slug, Number(r.lastInsertRowid))
    console.log(`[note] insert #${r.lastInsertRowid} ${n.slug}`)
  }
}

// ── 6) projects (slug 가 키, notes id 참조 때문에 마지막) ────────────
for (const p of payload.projects) {
  const noteIds = (p.relatedNoteSlugs || []).map((s) => noteIdBySlug.get(s)).filter((v) => typeof v === 'number')
  const ex = db.prepare('select id from projects where profile_id=? and slug=?').get(PID, p.slug)
  const cols = [
    p.title, p.title_kr, p.tag, p.year, p.role, p.url, p.summary,
    jd(p.metrics), jd(p.sections), jd(p.stack), JSON.stringify(noteIds),
    ref(p.cover), ref(p.logo), p.order, p.featured, p.status,
  ]
  if (ex) {
    db.prepare('update projects set title=?, title_kr=?, tag=?, year=?, role=?, url=?, summary=?, metrics=?, sections=?, stack=?, related_note_ids=?, cover_id=?, logo_id=?, "order"=?, featured=?, status=?, published_at=coalesce(published_at,?), updated_at=? where id=?')
      .run(...cols, now(), now(), ex.id)
    console.log(`[project] update #${ex.id} ${p.slug} — notes ${JSON.stringify(noteIds)}`)
  } else {
    const r = db.prepare('insert into projects (profile_id,slug,title,title_kr,tag,year,role,url,summary,metrics,sections,stack,related_note_ids,cover_id,logo_id,"order",featured,status,published_at,created_at,updated_at) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(PID, p.slug, ...cols, now(), now(), now())
    console.log(`[project] insert #${r.lastInsertRowid} ${p.slug} — notes ${JSON.stringify(noteIds)}`)
  }
}

if (missing.size) console.warn(`[warn] media 미해결 ${missing.size}건: ${[...missing].slice(0, 10).join(', ')}`)
db.close()
console.log('[apply] 완료')
