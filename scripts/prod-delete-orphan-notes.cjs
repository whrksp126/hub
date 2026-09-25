/**
 * 어느 프로젝트에도 연결되지 않은 구버전 딥다이브 4편을 삭제한다.
 *
 *   #1 토스 결제 단말기에서 WebSocket 없이…      → payment-polling 으로 대체됨(중복)
 *   #2 FSRS-5 간격 반복 알고리즘을 직접…          → fsrs-migration 으로 대체됨(중복)
 *   #3 홈서버 한 대로 SFU·TURN·Ingress까지…      → ghc-selfhost-seven-containers 로 대체됨(중복)
 *   #4 혼자서 iOS·Android·웹을 동시에 운영…      → 중복 아님. 사실과 다름(아래 참고)
 *
 * #4 는 HeyVoca 를 "팀이 있는 것도 아니고 나 혼자다" 라고 서술하고 공유 로직을
 * TypeScript 패키지로 뺐다고 쓰는데, 실제로는 5인 팀 프로젝트이고 백엔드는
 * Python/Flask, 클라이언트는 웹 한 벌 + 하이브리드 WebView 다. 이력서 서술과 정면으로
 * 어긋나므로 삭제한다.
 *
 * id 가 아니라 slug 로 지운다 — 로컬과 프로덕션의 id 가 다를 수 있기 때문.
 *
 * 실행: docker exec hub_app_prod node /app/prod-delete-orphan-notes.cjs
 */
const Database = require('better-sqlite3')

const SLUGS = [
  '토스-결제-단말기에서-websocket-없이-실시간을-만든-방법-1',
  'fsrs-5-간격-반복-알고리즘을-직접-구현하며-배운-것-2',
  '홈서버-한-대로-sfuturningress까지-클라우드-비용-0원-미디어-스택-3',
  '혼자서-iosandroid웹을-동시에-운영한다는-것-4',
]

const db = new Database(process.env.DATABASE_PATH || './data/hub.db')
db.pragma('foreign_keys = ON')

// 안전장치: 어느 프로젝트든 이 노트를 참조하고 있으면 지우지 않는다.
const linked = new Set()
for (const p of db.prepare('select related_note_ids from projects').all()) {
  for (const id of JSON.parse(p.related_note_ids || '[]')) linked.add(id)
}

let gone = 0
for (const slug of SLUGS) {
  const n = db.prepare('select id, title from notes where slug=?').get(slug)
  if (!n) { console.log(`[skip] 없음 — ${slug}`); continue }
  if (linked.has(n.id)) { console.log(`[skip] 프로젝트가 참조 중 #${n.id} — ${n.title}`); continue }
  db.prepare('delete from notes where id=?').run(n.id)
  console.log(`[del]  #${n.id} ${n.title}`)
  gone++
}

const left = db.prepare('select count(*) c from notes').get().c
console.log(`[done] 삭제 ${gone}건 · 남은 딥다이브 ${left}편`)
db.close()
