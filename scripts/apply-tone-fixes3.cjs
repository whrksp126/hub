/** 큰따옴표가 든 문장은 raw JSON 치환으로 잡히지 않는다. content 를 파싱해 문자열 단위로 고친다. */
const Database = require('better-sqlite3')
const db = new Database(process.env.DATABASE_PATH || './data/hub.db')
const now = Math.floor(Date.now() / 1000)
const asPattern = (t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[ \u00a0]/g, '[ \\u00a0]'), 'g')

const NOTES = {
  multitenant: [
    ['실제로 점검해 보니 데코레이터 순서가 잘못돼 로그인 확인이 **한 번도 적용되지 않은** 라우트가 여럿 있었고, 클라이언트가 준 부모 id를 재검증 없이 신뢰하는 곳도 있었다. 블루프린트 단위로 로그인 확인을 걸고, 20여 곳에 "로그인한 매장의 데이터인지" 확인을 넣어 고쳤다.',
     '이 관례가 조용히 깨지는 지점이 있었다. `@login_required`를 `@route`보다 **위에** 쓰면 데코레이터가 적용되지 않는데, 라우트는 그래도 200을 돌려주기 때문에 테스트로도 드러나지 않는다. 전수 점검에서 이 패턴을 찾아, 라우트 단위가 아니라 **블루프린트 단위**로 로그인 확인을 걸고 클라이언트가 준 부모 id를 쓰는 20여 곳에 소유권 확인을 넣었다.'],
  ],
  'canvas-editor': [
    ['— **다만 지금은 동작하지 않는다.** 드래그 중 좌표를 실시간으로 갱신하는 최적화를 넣으면서 "직전 위치"로 읽는 값까지 같이 덮어써 버렸다. 크기 조절 쪽은 시작 크기를 따로 보관해 정상 동작한다.',
     '— **다만 지금 코드에서는 이 되돌림이 무력화돼 있다.** 드래그 중 좌표를 실시간으로 갱신하는 최적화를 넣으면서 "직전 위치"로 읽는 값까지 같이 덮어써 버렸다. 크기 조절 쪽은 시작 크기를 따로 보관해 정상 동작한다. 최적화 하나가 같은 변수를 공유하던 다른 기능을 조용히 망가뜨린 전형적인 예라, 고치기 전에 여기 적어 둔다.'],
  ],
  'tts-caching': [
    ['무음 클립으로 "첫 user gesture 언락" 패턴을 써서 브라우저 autoplay 정책(`NotAllowedError`)을 우회.',
     '무음 클립으로 "첫 user gesture 언락" 패턴을 써서 브라우저 autoplay 정책(`NotAllowedError`)이 요구하는 조건을 충족.'],
  ],
}

for (const [slug, pairs] of Object.entries(NOTES)) {
  const row = db.prepare('select id, content from notes where slug=?').get(slug)
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
  db.prepare('update notes set content=?, updated_at=? where id=?').run(JSON.stringify(doc), now, row.id)
  const m = pairs.filter(([a]) => !seen.has(a)).map(([a]) => a.slice(0, 34))
  console.log(`[${slug}] ${seen.size}/${pairs.length}` + (m.length ? `  └ 못 찾음: ${m.join(' / ')}` : ''))
}
db.close()
