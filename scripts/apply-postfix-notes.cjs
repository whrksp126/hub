/**
 * 담당 에이전트들이 실제로 코드를 고쳐 배포한 뒤, "한계"로 적어 둔 문구를 "고쳤다"로 되돌린다.
 *
 *  - HeyVoca  : 로그아웃 시 토큰 버전 상향으로 기존 refresh 무효화 (ee2a9d3)
 *  - HeyVoca  : 소프트 lapse 하한을 2배로 바꿔 정답률 보너스가 의도대로 동작
 *  - OrderAndGo : 로그인·소유권 확인 전면 적용, 알림 채널 매장별 분리 (9db383b·ed00e15·61119e3)
 *  - OpenDay  : 비공개 초대장 방명록 조회 차단 + 공개 방명록 서버 저장 (6c423a2)
 *  - GHC      : 창·화면 캡처 모드는 제품에서 쓰지 않기로 확정(브라우저 라이브로 대체)
 */
const Database = require('better-sqlite3')
const db = new Database(process.env.DATABASE_PATH || './data/hub.db')
const now = Math.floor(Date.now() / 1000)
const asPattern = (t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[ \u00a0]/g, '[ \\u00a0]'), 'g')

const PLAN = {
  'login-session-webview': [
    ['지금 refresh 는 서명과 만료만 검사한다. DB에 저장해 둔 최신 토큰과 대조하지 않아서, **탈취된 토큰은 물론 로그아웃한 뒤에 남은 토큰도 90일간 계속 회전된다.** → refresh **재사용 탐지**(같은 old 토큰으로 재요청 시 전체 세션 강제 로그아웃)를 추가해 탈취 방어를 강화하고 싶다.',
     '처음엔 서명과 만료만 검사해서, 로그아웃한 뒤에 남은 토큰도 90일간 계속 회전됐다. 점검에서 이걸 발견하고 **계정마다 토큰 버전**을 두는 방식으로 고쳤다. 로그아웃하면 버전이 올라가 그 계정의 기존 refresh 토큰이 모든 기기에서 한 번에 무효가 된다(탈퇴한 계정도 거절). 배포 전에 발급된 토큰은 버전 0으로 봐서 강제 로그아웃은 없었다. 남은 것은 **재사용 탐지**(같은 old 토큰으로 재요청 시 세션 전체 강제 로그아웃)다.'],
  ],
  'fsrs-migration': [
    ['오답 한 번에 기억 안정도가 이전의 30%(연속 오답은 10%) 아래로 떨어지지 않도록 하한을 두고, **표준값과 하한 중 큰 쪽**을 채택한다.',
     '오답 한 번에 기억 안정도가 이전의 30%(연속 오답은 10%) 아래로 떨어지지 않도록 하한을 두고, **표준값과 하한 중 큰 쪽**을 채택한다. 그 단어를 최근에 잘 맞혀 온 경우에는 하한을 2배로 올려 덜 깎는다.'],
    ['rate *= 0.5    # 의도는 "덜 깎기"였지만 rate 는 남기는 하한이라 실제로는 더 깎인다 (수정 대상)',
     'rate *= 2.0    # 잘 맞혀 온 단어는 하한을 올려 덜 깎는다'],
    ['rate = 0.1 if is_consecutive else 0.3', 'rate = 0.1 if is_consecutive else 0.3   # 남기는 하한'],
  ],
  multitenant: [
    ['실제로 일부 API는 로그인·소유권 확인이 아예 빠져 있다 — 읽기뿐 아니라 쓰기도 그렇다. 다시 만든다면 **테넌트 스코프를 세션에 심고 쿼리 레벨에서 자동 주입**하는 계층을 두겠다(예: 베이스 쿼리 믹스인/`before_request` 스코프).',
     '실제로 점검해 보니 데코레이터 순서가 잘못돼 로그인 확인이 **한 번도 적용되지 않은** 라우트가 여럿 있었고, 클라이언트가 준 부모 id를 재검증 없이 신뢰하는 곳도 있었다. 블루프린트 단위로 로그인 확인을 걸고, 20여 곳에 "로그인한 매장의 데이터인지" 확인을 넣어 고쳤다. 다시 만든다면 처음부터 **테넌트 스코프를 세션에 심고 쿼리 레벨에서 자동 주입**하는 계층을 두겠다(예: 베이스 쿼리 믹스인/`before_request` 스코프).'],
  ],
  'realtime-sync': [
    ['**테넌트 격리.** 주방 화면은 매장별 방으로 나눴다. 다만 POS 알림은 아직 공용 방이라, 매장이 늘면 매장별 방으로 옮겨야 한다(현재 한계).',
     '**테넌트 격리.** 처음엔 새 주문 알림이 모든 매장 POS가 같이 쓰는 방으로 나갔다. 점검에서 발견하고 알림 채널을 매장별로 나눴고, 방에 들어갈 때 로그인한 매장인지도 확인한다.'],
  ],
  'payment-polling': [
    ['# 진행 중 결제 (payment_id -> 상태)',
     '# 진행 중 결제 (payment_id -> 상태). 조회는 단말기 토큰의 매장이 결제의 매장과 같아야 한다.'],
  ],
  'openday-publish-share-engagement': [
    ['참석 응답은 누구나 남기되 조회는 주최자만 가능하도록 나눴고(방명록 조회 보호는 남은 과제), 통계 장애가 공개 페이지를 막지 않게 했다.',
     '참석 응답도 방명록도 누구나 남기되 조회는 주최자와 짝꿍만 가능하도록 나눴고, 통계 장애가 공개 페이지를 막지 않게 했다. 비공개 초대장은 목록 요청에 아예 "없음"으로 답해 존재 여부조차 드러내지 않는다.'],
  ],
  'ghc-native-capture-bridge': [
    ['창/화면 캡처 모드 — 소스를 고르고, 소리는 나만 끈다',
     '창/화면 캡처 모드 — 만들었지만 쓰지 않기로 한 길'],
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
  const m = pairs.filter(([a]) => !seen.has(a)).map(([a]) => a.slice(0, 30))
  hit += seen.size; miss += m.length
  console.log(`[${slug}] ${seen.size}/${pairs.length}` + (m.length ? `  └ 못 찾음: ${m.join(' / ')}` : ''))
}
console.log(`\n[done] ${hit}건 반영 · ${miss}건 미적용`)
db.close()
