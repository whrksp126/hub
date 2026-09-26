/** 면접에서 공격받기 쉬운 표현을 방어 가능한 형태로 고친다(사실은 그대로, 프레이밍만). */
const Database = require('better-sqlite3')
const db = new Database(process.env.DATABASE_PATH || './data/hub.db')
const now = Math.floor(Date.now() / 1000)
const asPattern = (t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[ \u00a0]/g, '[ \\u00a0]'), 'g')

const PROJECTS = {
  codingpt: [
    ['서버도 명령 내용을 못 보게 했다 — 원격 조작 명령과 파일 요청을 외부 라이브러리 없이 직접 암호화하고, 4개 구현이 서로 호환되는지 테스트로 고정했다',
     '서버도 명령 내용을 못 보게 했다 — 모바일 WebView와 RN 런타임에는 WebCrypto가 아예 없어서, 표준 스위트(X25519·HKDF·ChaCha20-Poly1305)를 4개 환경이 같은 코드로 쓰도록 맞췄다. 맞게 구현했는지는 OS 기본 구현과 결과를 대조하는 테스트로 고정했다'],
  ],
  orderandgo: [
    ['격자 맞춤·크기 조절 판정을 외부 라이브러리 없이 직접 만들었다',
     '격자 맞춤·크기 조절 판정을 Pointer Events만으로 직접 만들었다'],
  ],
  lambent: [
    ['Lambent는 유료 기능의 그리기 코드 자체를 암호로 봉인해, 정식 라이선스가 있어야만 풀리게 했습니다.',
     'Lambent는 유료 기능의 그리기 코드 자체를 암호로 봉인해, 정식 라이선스가 있어야만 풀리게 했습니다. 배포 파일을 정적 분석해도 유료 프리셋의 식별자가 나오지 않습니다.'],
  ],
  ghc: [
    ['역할별 에이전트 6종 — 실시간 미디어, 백엔드, DB, 인프라, 프론트엔드, 코드 리뷰',
     '역할별 에이전트를 나눠 정의 — 실시간 미디어, 백엔드, DB, 인프라, 프론트엔드, 코드 리뷰'],
  ],
}

for (const [slug, pairs] of Object.entries(PROJECTS)) {
  const row = db.prepare('select id, summary, metrics, sections from projects where slug=?').get(slug)
  let { summary, metrics, sections } = row
  let hits = 0, miss = []
  for (const [a, b] of pairs) {
    let found = false
    for (const key of ['summary', 'metrics', 'sections']) {
      const cur = { summary, metrics, sections }[key]
      if (!cur) continue
      const re = asPattern(a); re.lastIndex = 0
      if (!re.test(cur)) continue
      re.lastIndex = 0
      const next = cur.replace(re, () => b)
      if (key === 'summary') summary = next; else if (key === 'metrics') metrics = next; else sections = next
      found = true
    }
    if (found) hits++; else miss.push(a.slice(0, 34))
  }
  db.prepare('update projects set summary=?, metrics=?, sections=?, updated_at=? where id=?')
    .run(summary, metrics, sections, now, row.id)
  console.log(`[${slug}] ${hits}/${pairs.length}` + (miss.length ? `  └ 못 찾음: ${miss.join(' / ')}` : ''))
}
db.close()
