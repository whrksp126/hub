/** 미디어가 빠져 비어 버린 갤러리 섹션에 적절한 컷을 옮겨 채운다. */
const Database = require('better-sqlite3')
const db = new Database(process.env.DATABASE_PATH || './data/hub.db')
const now = Math.floor(Date.now() / 1000)
const idByName = new Map(db.prepare('select id, filename from media').all().map((m) => [m.filename, m.id]))

// [slug, 옮길 파일명, 출발 섹션 index, 도착 섹션 index, 새 캡션]
const MOVES = [
  ['heyvoca', 'word-detail-farm.png', 3, 1, '단어마다 자라는 단계와 다음 복습일이 따로 계산된다'],
  ['openday', 'openday-editor.png', 4, 1, '편집 패널 + 모바일 실시간 프리뷰'],
]

for (const [slug, file, from, to, caption] of MOVES) {
  const row = db.prepare('select id, sections from projects where slug=?').get(slug)
  const secs = JSON.parse(row.sections)
  const mid = idByName.get(file)
  if (!mid) { console.log(`[skip] ${slug} — ${file} 없음`); continue }

  const src = secs[from]?.media || []
  const idx = src.findIndex((m) => m.mediaId === mid)
  if (idx < 0) { console.log(`[skip] ${slug} — 섹션 ${from} 에 ${file} 없음 (이미 옮김?)`); continue }

  const [moved] = src.splice(idx, 1)
  if (caption) moved.caption = caption
  secs[to].media = secs[to].media || []
  secs[to].media.unshift(moved)

  db.prepare('update projects set sections=?, updated_at=? where id=?').run(JSON.stringify(secs), now, row.id)
  console.log(`[${slug}] ${file}: 섹션 ${from} → ${to}`)
}

// 검증: 미디어 없는 갤러리가 남아 있는지
for (const p of db.prepare('select slug, sections from projects').all()) {
  JSON.parse(p.sections || '[]').forEach((s, i) => {
    if (s.kind === 'gallery' && !(s.media || []).length) console.log(`[warn] ${p.slug} 섹션 ${i} 갤러리가 비어 있음`)
  })
}
db.close()
