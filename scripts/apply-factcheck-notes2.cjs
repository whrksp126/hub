/** 1차에서 문구가 달라 못 잡은 항목들을 실제 본문 표기(굵게 표시·붙임표 등)에 맞춰 정정한다. */
const Database = require('better-sqlite3')
const db = new Database(process.env.DATABASE_PATH || './data/hub.db')
const now = Math.floor(Date.now() / 1000)
const asPattern = (t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[ \u00a0]/g, '[ \\u00a0]'), 'g')

const PLAN = {
  'fsrs-migration': [
    ['SM2→FSRS 데이터 마이그레이션 **715건 완료**(운영 문서 기록).',
     'SM2→FSRS 데이터 변환은 읽을 때와 서버 기동 때 새 형식으로 자동 처리된다.'],
  ],
  'codingpt-outbound-relay': [
    ['**멀티플렉싱은 공짜가 아니다.** 연결을 아끼려다 흐름 제어를 직접 구현하게 된다. 연결을 더 여는 비용을 감수하면 커널이 대신 해준다.',
     '**멀티플렉싱은 공짜가 아니다.** 릴레이 경로에서는 연결을 아끼려다 흐름 제어를 직접 구현하게 된다. 연결을 더 여는 비용을 감수하면 채널끼리 서로 막지 않는다. (같은 Wi-Fi 직결 경로는 반대로 TCP 하나 위에서 채널을 나눈다.)'],
  ],
  'ghc-home-server-capacity': [
    ['**87.1 Mbps** — 링크레이트의 87%.', '**87.1 Mbps**(2026-08 측정. 2026-09 재측정은 71~79Mbps) — 링크레이트의 87%.'],
  ],
  'ghc-p2p-preview-vs-sfu': [
    ['즉 **coturn은 SFU 경로를 위해 있는 게 아니라 오직 이 P2P 프리뷰를 위해 존재하는 컨테이너**다.',
     '즉 **coturn은 원래 이 P2P 프리뷰를 위해 들인 컨테이너**다. (이후 UDP가 막힌 망에서 방 연결의 우회로도 맡게 됐다.)'],
  ],
  'ghc-mediasoup-to-livekit': [
    ['지금 백엔드가 미디어에 대해 하는 일은 **토큰 한 장 발급**이 전부다.',
     '지금 백엔드가 미디어에 대해 하는 일은 **입장 토큰 발급과 방송 입력(Ingress) 관리**뿐이다. 미디어 시그널링 이벤트는 전부 사라졌다.'],
  ],
  'ghc-native-capture-bridge': [
    ['LIVE를 누른 뒤 **1.99초** 만에 타일이 뜬다.', 'LIVE를 누르면 시청자 방에 타일이 뜬다.'],
    ['**1.99 s** (1,981 / 1,993 ms · 콜드 첫 회 3,803 ms)',
     '**1.99 s** (2026-08-14 측정, HLS 버퍼 도입 전 · 콜드 첫 회 3,803 ms)'],
    ['웹 UI 재사용률', '데스크탑 전용 화면'],
    ['macOS `GHC.dmg` **93 MB** · Windows `GHC-Setup.exe` **194 MB**',
     'macOS `GHC.dmg` **약 99MB** · Windows `GHC-Setup.exe` **약 400MB**'],
    ['**앱 0.1.4를 실제로 돌려 잰 값**이다.', '**앱 0.1.4를 실제로 돌려 잰 값**이다(현재 배포본은 0.1.33).'],
    ['macOS **0.1.4** (서명 + 공증 + 인앱 자동 업데이트 라이브) · Windows **0.1.1** (구 피드에만 존재)',
     'macOS **0.1.33** (서명 + 공증 + 인앱 자동 업데이트 라이브) · Windows **0.1.4** (수동 빌드라 릴리스가 뒤처짐)'],
  ],
  'lambent-sealed-premium': [
    ['`licenses` 테이블에는 **`license_key` 당 활성 행 1개**라는 유니크 제약이 있습니다.',
     '`activations` 테이블의 **`license_key` 유니크 인덱스**가 곧 “기기 1대” 규칙입니다.'],
  ],
  'lambent-system-audio-capture': [
    ['**100–500배 분리.** 문서대로 정확히 동작합니다.',
     '**약 90–500배 분리.** 착수 전 실험에서 측정한 값입니다(출시 앱은 소리를 내지 않아 재현 대상이 아닙니다).'],
  ],
}

let hit = 0, miss = 0
for (const [slug, pairs] of Object.entries(PLAN)) {
  const row = db.prepare('select id, title, content from notes where slug=?').get(slug)
  if (!row) { console.log(`[skip] ${slug}`); continue }
  const seen = new Set()
  const walk = (n) => {
    if (Array.isArray(n)) return n.map(walk)
    if (n && typeof n === 'object') { const o = {}; for (const [k, v] of Object.entries(n)) o[k] = walk(v); return o }
    if (typeof n === 'string') {
      let s = n
      for (const [a, b] of pairs) { const re = asPattern(a); if (re.test(s)) { re.lastIndex = 0; s = s.replace(re, () => b); seen.add(a) } }
      return s
    }
    return n
  }
  const doc = walk(JSON.parse(row.content))
  let title = row.title
  for (const [a, b] of pairs) { const re = asPattern(a); if (re.test(title)) { re.lastIndex = 0; title = title.replace(re, () => b); seen.add(a) } }
  db.prepare('update notes set content=?, title=?, updated_at=? where id=?').run(JSON.stringify(doc), title, now, row.id)
  const m = pairs.filter(([a]) => !seen.has(a)).map(([a]) => a.slice(0, 32))
  hit += seen.size; miss += m.length
  console.log(`[${slug}] ${seen.size}/${pairs.length}` + (m.length ? `  └ 못 찾음: ${m.join(' / ')}` : ''))
}
console.log(`\n[done] 추가 치환 ${hit}건 · 미적용 ${miss}건`)
db.close()
