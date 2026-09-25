/**
 * ghc-selfhost 딥다이브의 컨테이너 표를 현재 구성(8개)에 맞춘다.
 *  - 08-17 에 mediamtx 가 추가돼 1935(RTMP 원본 수신)를 맡고, Ingress 는 1936 으로 내려갔다.
 *  - 자원 표는 2026-08-13 스냅샷이라 측정 시점을 밝힌다.
 */
const Database = require('better-sqlite3')
const db = new Database(process.env.DATABASE_PATH || './data/hub.db')
const now = Math.floor(Date.now() / 1000)

const row = db.prepare("select id, content from notes where slug='ghc-selfhost-seven-containers'").get()
const doc = JSON.parse(row.content)
let changed = 0

for (const b of doc) {
  if (b.type !== 'table' || !b.rows) continue

  // ① 구성 표: ingress 역할 정정 + mediamtx 행 추가
  if (b.header && b.header[0] === '#' && b.rows.length === 7) {
    const ing = b.rows.find((r) => r[1].includes('ingress'))
    if (ing) ing[2] = 'RTMP(1936) → 룸 트랙 변환'
    b.rows.push(['⑧', '`mediamtx`', 'RTMP(1935) 원본 수신 → HLS 고화질 버퍼 + LiveKit 중계', '**host**'])
    changed++
  }

  // ② 자원 표: 측정 시점이 7개 기준임을 밝힌다
  if (b.header && b.header[0] === '컨테이너' && b.rows.some((r) => r[0] === '**합계**')) {
    const sum = b.rows.find((r) => r[0] === '**합계**')
    if (sum && !sum[0].includes('7개')) sum[0] = '**합계(2026-08 · 7개 기준)**'
    changed++
  }

  // ③ 안정성 표: 현재 시제로 읽히지 않게 시점을 명시
  if (b.rows.some((r) => String(r[0]).includes('8개 컨테이너 재시작'))) {
    for (const r of b.rows) if (String(r[0]).includes('8개 컨테이너 재시작')) r[0] = '컨테이너 재시작 횟수'
    b.rows.push(['2026-09 재확인', '컨테이너 8개 · 재시작 0회 · 유휴 CPU 합 약 1.5%'])
    changed++
  }
}

db.prepare('update notes set content=?, updated_at=? where id=?').run(JSON.stringify(doc), now, row.id)
console.log(`[ghc-selfhost] 표 ${changed}개 갱신`)
db.close()
