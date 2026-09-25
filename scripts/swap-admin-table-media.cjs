/**
 * OrderAndGo 강점 ③ 의 admin-table.mp4 를 정지 화면으로 바꾼다.
 * 영상에 겹침 되돌리기 버그가 그대로 찍혀 있다(8번을 9번 위에 놓자 8번이 가려지고,
 * 이후 3번이 끝까지 가려진 채 19칸만 보인다). 버그를 고치고 다시 찍기 전까지는 내린다.
 */
const Database = require('better-sqlite3')
const db = new Database(process.env.DATABASE_PATH || './data/hub.db')
const now = Math.floor(Date.now() / 1000)

const URL = 'https://objectstore.ghmate.com/hub/media/oag-v3e-admin-table-grid.png'
let m = db.prepare('select id from media where filename=?').get('admin-table-grid.png')
if (!m) {
  const r = db.prepare('insert into media (filename,url,alt,mime,size,created_at) values (?,?,?,?,?,?)')
    .run('admin-table-grid.png', URL, '매장 테이블 배치 편집 화면', 'image/png', 86705, now)
  m = { id: Number(r.lastInsertRowid) }
  console.log('[media] insert admin-table-grid.png #' + m.id)
}

// 같은 파일명이 여러 행에 있어 URL 로 특정한다
const vid = db.prepare('select id from media where url=?').get('https://objectstore.ghmate.com/hub/media/oag-v2-admin-table.mp4')
const row = db.prepare("select id, sections from projects where slug='orderandgo'").get()
const secs = JSON.parse(row.sections)
let done = 0
for (const s of secs) {
  if (!s.media) continue
  for (let i = 0; i < s.media.length; i++) {
    if (vid && s.media[i].mediaId === vid.id) {
      s.media[i] = { kind: 'image', mediaId: m.id, caption: '매장 테이블 배치 — 격자에 끌어다 놓으면 0.5초 뒤 자동 저장된다' }
      done++
    }
  }
}
if (done) {
  db.prepare('update projects set sections=?, updated_at=? where id=?').run(JSON.stringify(secs), now, row.id)
  console.log('[orderandgo] admin-table.mp4 → 정지 화면 교체 ' + done + '건')
} else {
  console.log('[orderandgo] 교체 대상 없음(이미 반영됨)')
}
db.close()
