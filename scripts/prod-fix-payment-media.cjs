/**
 * OrderAndGo 결제 시연 영상의 개인정보 노출 대응.
 *
 * 영상 12초 이후 POS 영수증 모달에 실제 사업자번호·대표자 실명·주소·카드 승인번호가
 * 그대로 노출돼 있었다. 해당 영역을 블러 처리한 새 파일을 새 오브젝트 키로 올리고,
 * DB 가 그 키를 가리키도록 바꾼다. (옛 키는 Cloudflare 캐시 때문에 즉시 갱신되지 않아
 * 키 자체를 바꾼다. 옛 키의 오브젝트도 이미 블러본으로 덮어썼다.)
 *
 * 실행: docker exec hub_app_prod node /app/prod-fix-payment-media.cjs
 */
const Database = require('better-sqlite3')

const OLD_VIDEO = 'https://objectstore.ghmate.com/hub/media/oag-v3d-toss-payment-dual.mp4'
const NEW_VIDEO = 'https://objectstore.ghmate.com/hub/media/oag-v3e-toss-payment-dual.mp4'
const OLD_POSTER = 'https://objectstore.ghmate.com/hub/media/oag-v3d-poster-toss-payment-dual.png'
const NEW_POSTER = 'https://objectstore.ghmate.com/hub/media/oag-v3e-poster-toss-payment-dual.png'

const db = new Database(process.env.DATABASE_PATH || './data/hub.db')
const now = Math.floor(Date.now() / 1000)

const m = db.prepare('select id, url from media where url=?').get(OLD_VIDEO)
if (m) {
  db.prepare('update media set url=?, size=? where id=?').run(NEW_VIDEO, 1950733, m.id)
  console.log(`[media] #${m.id} url 교체`)
} else {
  console.log('[media] 옛 URL 을 쓰는 행이 없음 (이미 적용됐을 수 있음)')
}

let touched = 0
for (const p of db.prepare('select id, slug, sections from projects').all()) {
  if (!p.sections || !p.sections.includes(OLD_POSTER)) continue
  db.prepare('update projects set sections=?, updated_at=? where id=?')
    .run(p.sections.split(OLD_POSTER).join(NEW_POSTER), now, p.id)
  console.log(`[project] ${p.slug} poster 교체`)
  touched++
}

for (const n of db.prepare('select id, slug, content from notes').all()) {
  if (!n.content || (!n.content.includes(OLD_POSTER) && !n.content.includes(OLD_VIDEO))) continue
  const next = n.content.split(OLD_POSTER).join(NEW_POSTER).split(OLD_VIDEO).join(NEW_VIDEO)
  db.prepare('update notes set content=?, updated_at=? where id=?').run(next, now, n.id)
  console.log(`[note] ${n.slug} 교체`)
  touched++
}

console.log(`[done] 갱신 ${touched}건`)
db.close()
