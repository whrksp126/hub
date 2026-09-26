/**
 * 면접에서 오해·역공을 부를 수 있는 서술을 다듬는다. 사실은 그대로 두고 주어와 순서만 바꾼다.
 *  ① GHC — 브랜드명과 "보호 영상을 방송한다"가 앞에 서면 저작권 질문이 기술 얘기를 덮는다
 *  ② OrderAndGo — "로그인 확인이 한 번도 적용되지 않았다"는 사실이지만, 결함의 종류(데코레이터 순서)를
 *     주어로 올려야 "왜 몰랐나"가 아니라 "어떻게 찾았나"로 읽힌다
 *  ③ canvas-editor — 미수정 버그를 적는 건 유지하되, 교훈으로 닫는다
 *  ④ 이미 고친 항목의 잔여 "남은 과제" 문구 정리
 */
const Database = require('better-sqlite3')
const db = new Database(process.env.DATABASE_PATH || './data/hub.db')
const now = Math.floor(Date.now() / 1000)
const asPattern = (t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[ \u00a0]/g, '[ \\u00a0]'), 'g')

const PROJECTS = {
  ghc: [
    ['일반 앱에서는 재생조차 안 되는 보호된 영상까지 전용 창으로 방송합니다.',
     '앱이 쓰는 브라우저 엔진에 재생 키가 없어 아예 열리지 않던 보호 콘텐츠도 OS 기본 재생기를 쓰는 전용 창으로 다룹니다.'],
    ['① 다른 도구로는 안 되는 것 — 보호된 영상 방송하기',
     '① 다른 도구로는 안 되는 것 — 앱에서 아예 열리지 않던 화면 다루기'],
    ['넷플릭스처럼 저작권 보호가 걸린 영상은 일반 앱에서 아예 재생되지 않습니다. 재생에 필요한 열쇠를 앱이 갖고 있지 않기 때문입니다.',
     '저작권 보호(DRM)가 걸린 영상은 일반 앱에서 재생 자체가 시작되지 않습니다. 재생에 필요한 키 시스템을 앱이 쓰는 브라우저 엔진이 갖고 있지 않기 때문입니다.'],
    ['보호된 영상 방송 — 앱에서는 재생도 안 되는 스트리밍을 전용 창에서 틀어 내보낸다',
     '보호 콘텐츠 처리 — 키가 없어 재생되지 않던 화면을 OS 기본 재생기를 쓰는 전용 창으로 분리'],
    ['보호된 영상도 방송된다 — 다른 도구로는 안 되는 부분이고, 이 서비스에서 가장 손이 많이 갔다',
     '보호 콘텐츠도 다룬다 — 다른 도구로는 안 되는 부분이고, 이 서비스에서 가장 손이 많이 갔다'],
    ['앱에서는 보호된 영상이 재생되지 않았다 — 앱이 쓰는 브라우저 엔진에 재생 열쇠가 하나도 없었다.',
     '앱에서는 보호 콘텐츠가 아예 열리지 않았다 — 앱이 쓰는 브라우저 엔진에 재생 키 시스템이 하나도 없었다.'],
  ],
}

const NOTES = {
  multitenant: [
    ['실제로 점검해 보니 데코레이터 순서가 잘못돼 로그인 확인이 **한 번도 적용되지 않은** 라우트가 여럿 있었고, 클라이언트가 준 부모 id를 재검증 없이 신뢰하는 곳도 있었다. 블루프린트 단위로 로그인 확인을 걸고, 20여 곳에 "로그인한 매장의 데이터인지" 확인을 넣어 고쳤다.',
     '이 관례가 조용히 깨지는 지점이 있었다. `@login_required`를 `@route`보다 **위에** 쓰면 데코레이터가 적용되지 않는데, 그래도 라우트는 200을 돌려주기 때문에 테스트로도 드러나지 않는다. 전수 점검에서 이 패턴을 찾아 라우트 단위가 아니라 **블루프린트 단위**로 로그인 확인을 걸고, 클라이언트가 준 부모 id를 쓰는 20여 곳에 소유권 확인을 넣었다.'],
    ['다만 방에 들어갈 때 매장 검증과, POS 공용 방 분리는 아직 남은 과제다.',
     '방에 들어갈 때도 로그인한 매장인지 확인하고, 모든 매장이 같이 쓰던 알림 채널도 매장별로 나눴다.'],
  ],
  'canvas-editor': [
    ['— **다만 지금은 동작하지 않는다.** 드래그 중 좌표를 실시간으로 갱신하는 최적화를 넣으면서 "직전 위치"로 읽는 값까지 같이 덮어써 버렸다. 크기 조절 쪽은 시작 크기를 따로 보관해 정상 동작한다.',
     '— **다만 지금 코드에서는 이 되돌림이 무력화돼 있다.** 드래그 중 좌표를 실시간으로 갱신하는 최적화를 넣으면서 "직전 위치"로 읽는 값까지 같이 덮어써 버렸다. 크기 조절 쪽은 시작 크기를 따로 보관해 정상 동작한다. 최적화 하나가 같은 변수를 공유하던 다른 기능을 조용히 망가뜨린 전형적인 예라, 고치기 전에 여기 적어 둔다.'],
  ],
  'tts-caching': [
    ['무음 클립으로 "첫 user gesture 언락" 패턴을 써서 브라우저 autoplay 정책(`NotAllowedError`)을 우회.',
     '무음 클립으로 "첫 user gesture 언락" 패턴을 써서 브라우저 autoplay 정책(`NotAllowedError`)을 정책이 요구하는 방식으로 충족.'],
  ],
}

const run = (table, plan, cols) => {
  for (const [slug, pairs] of Object.entries(plan)) {
    const row = db.prepare(`select id, ${cols.join(', ')} from ${table} where slug=?`).get(slug)
    if (!row) { console.log(`[skip] ${slug}`); continue }
    const vals = {}
    for (const c of cols) vals[c] = row[c]
    let hits = 0, miss = []
    for (const [a, b] of pairs) {
      let found = false
      for (const c of cols) {
        if (!vals[c]) continue
        const re = asPattern(a); re.lastIndex = 0
        if (!re.test(vals[c])) continue
        re.lastIndex = 0
        vals[c] = vals[c].replace(re, () => b); found = true
      }
      if (found) hits++; else miss.push(a.slice(0, 34))
    }
    db.prepare(`update ${table} set ${cols.map((c) => `${c}=?`).join(', ')}, updated_at=? where id=?`)
      .run(...cols.map((c) => vals[c]), now, row.id)
    console.log(`[${slug}] ${hits}/${pairs.length}` + (miss.length ? `  └ 못 찾음: ${miss.join(' / ')}` : ''))
  }
}

run('projects', PROJECTS, ['summary', 'sections'])
run('notes', NOTES, ['content'])
db.close()
