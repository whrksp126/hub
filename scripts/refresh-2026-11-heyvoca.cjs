// 2026-11 최신화: heyvoca 담당 에이전트 refresh-2026-11/CHANGES.md 반영
// 실행: node scripts/refresh-2026-11-heyvoca.cjs <ids 파일(key=mediaId 줄)>
const fs = require('node:fs')
const Database = require('better-sqlite3')
const db = new Database(process.env.DATABASE_PATH || './data/hub.db')
const id = Object.fromEntries(fs.readFileSync(process.argv[2], 'utf8').trim().split('\n').map((l) => l.split('=')).map(([k, v]) => [k, Number(v)]))
const poster = (k) => `https://objectstore.ghmate.com/hub/media/hv-r11-${k}.poster.jpg`
const p = db.prepare("select id, metrics, stack, sections from projects where slug='heyvoca'").get()
const metrics = JSON.parse(p.metrics), stack = JSON.parse(p.stack), S = JSON.parse(p.sections)

const summary = '외운 단어를 잊는 게 진짜 문제입니다. 담아두기만 하면 잊을 때쯤 알아서 다시 꺼내 주고, 단어마다 작물처럼 자라는 모습으로 "오늘 무엇을 해야 하는지"까지 보여주는 단어 학습 서비스. 웹 한 벌로 iOS·Android 앱까지 제공하고, 일본어 학습도 베타로 엽니다.'
metrics[0] = { value: '3축', label: '기억을 안정도·난이도·회상 확률로 계산하고, 안정도를 작물 경험치로 보여준다' }
metrics[2] = { value: '5만 + 2.3만', label: '영한·일한 사전을 사용자 DB와 따로 배포 (예문 약 16만)' }
stack[stack.indexOf('MySQL (2-schema)')] = 'MySQL (3-schema: 사용자 · 영한 · 일한)'
stack.push('Edge TTS (신경망 음성)', 'spaCy · Kiwi (형태소 분석)')

const lead = S[0].bullets
lead[0] = '잊기 전에 다시 — 맞히고 틀린 기록으로 단어마다 복습일을 따로 계산하고, 그 기억 상태를 작물의 성장과 시듦으로 보여준다'
lead.push('외우는 데서 쓰는 데까지 — 고르기 문제에서 시작해 철자 쓰기·문장 조립까지, 실력에 맞춰 난이도가 오르내린다')

S[1].body = '단어마다 "언제 다시 봐야 하는지"를 따로 계산합니다. 자주 틀린 단어는 자주, 잘 외운 단어는 뜸하게 나옵니다. 그 계산값(기억의 안정도)을 그대로 경험치로 바꿔, 단어가 심은 씨앗 → 새싹 → 이파리 → 당근 → 황금 당근으로 자랍니다. 복습일을 넘기면 목마르고, 시들고, 결국 썩습니다.'
S[1].media = [
  { kind: 'image', mediaId: id.wdf, caption: '단어마다 다음 단계까지 남은 경험치와 다음 복습일이 따로 계산된다' },
  { kind: 'image', mediaId: id.gsu, caption: '맞히는 순간 경험치가 오르고 다음 작물로 자란다' },
]
S[2].body = S[2].body.trim() + " 담은 단어는 씨앗이 되어, '새 씨앗 심기'에서 카드로 만나고 문제로 확인해야 밭에 심깁니다."
S[2].media = [{ kind: 'video', mediaId: id.dict_to_test, caption: '검색해서 담으면 씨앗으로 들어가 심을 차례를 기다린다', poster: poster('dict-to-test') }]
S[3].body = "아무리 좋은 복습 알고리즘도 안 들어오면 소용이 없습니다. 홈의 '오늘 할 일'이 썩기 직전 단어부터 새 씨앗까지 급한 순서로 보여주고, 하루 5단어를 맞히면 연속 학습이 이어집니다. 쉬는 날은 보호권이 자동으로 메워 줍니다. 단어장과 농장 도구를 사는 상점도 있고, 앱 안 결제가 실제로 이뤄집니다."
S[3].media = [
  { kind: 'video', mediaId: id.combo_chain, caption: '맞히면 경험치가 올라 다음 작물로 자라고, 틀려도 현재 단계 아래로는 내려가지 않는다', poster: poster('combo-chain') },
  { kind: 'image', mediaId: id.today, caption: '오늘 할 일과 연속 학습 — 쉬는 날은 보호권이 메운다' },
]
const newGallery = {
  kind: 'gallery',
  heading: '④ 외우는 데서 쓰는 데까지',
  body: '새 단어는 카드로 먼저 만나고 문제를 거쳐야 밭에 심깁니다. 작물이 자랄수록 철자 쓰기·문장 조립처럼 어려운 유형이 열리고, 알파벳·히라가나·가타카나는 획순을 따라 쓰며 익힙니다.',
  media: [
    { kind: 'video', mediaId: id.plant_session, caption: '새 씨앗 심기 — 카드로 만나고, 고르기 → 쓰기 문제를 맞혀야 밭에 심긴다', poster: poster('plant-session') },
    { kind: 'video', mediaId: id.sentence_arrange, caption: '문장 조립 — 맞히면 완성된 문장으로 바로 확인된다', poster: poster('sentence-arrange') },
    { kind: 'video', mediaId: id.script_trace, caption: '글자 학습 — 획순 시범을 보고 손가락으로 따라 쓴다', poster: poster('script-trace') },
  ],
}

const F = S[4].bullets
F[1] = '12가지 문제 — 단어(사지선다 정·역방향, 카드 맞추기, 철자 쓰기)와 문장(빈칸 고르기·쓰기, 문장 조립, 듣고 조립, 해석 조립)에 듣기까지. 작물이 자랄수록 어려운 유형이 열리고, 틀리면 한 단계 쉬운 유형으로 다시 나온다'
F[3] = '농장 — 단어마다 경험치로 5단계 성장, 복습을 미루면 시들고 썩는다. 오늘 할 일·연속 학습 보호권·업적'
F.push('새 씨앗 심기 — 새 단어는 카드로 먼저 만나고 고르기 → 쓰기 문제를 거쳐야 밭에 심긴다',
  '수준 맞춤 예문 — 예문마다 CEFR A1~C2 난이도를 붙이고, 사용자 수준과 아는 단어에 맞는 문장을 골라 매번 새 문장으로 출제',
  "글자 학습 — 알파벳·히라가나·가타카나를 '글자 밭'에서 하나씩, 획순 시범을 보고 손가락으로 따라 쓴다",
  '일본어 학습(베타) — 실험실에서 켜면 일한 사전 2.3만 항목·JLPT 단어장 25권으로 같은 학습을 일본어로',
  '오류 신고 — 학습 중 헤더 깃발로 문제 오류를 바로 신고, 운영자가 모아 처리')

S[5].media = [
  { kind: 'image', mediaId: id.home, caption: '홈 — 내 농장과 학습 시작' },
  { kind: 'image', mediaId: id.sheet, caption: '학습 고르기 — 썩은 단어 살리기·농장 돌보기·새 씨앗 심기·밭 골라 학습' },
  { kind: 'image', mediaId: id.arr, caption: '문장 조립 문제' },
  { kind: 'image', mediaId: id.script, caption: '글자 밭 — 배운 글자와 복습할 글자' },
  { kind: 'image', mediaId: id.store, caption: '상점 — 보석으로 단어장과 농장 도구를 산다' },
]

const T = S[6].bullets
T[T.length - 1] = '2026 ~ 현재 — 복습 알고리즘 교체, 발음 엔진 교체·캐싱, DB 분리, 농장 v2, 새 문제 유형·수준 맞춤, 일본어·글자 학습, 배포까지 사실상 단독 주도'

const C = S[7].bullets
C[0] = '기존 복습 알고리즘을 버리고 최신 알고리즘을 직접 구현했다 — 서버의 구버전 Python에선 기존 라이브러리를 쓸 수 없었고, 한 번 틀렸다고 복습 간격이 급락하지 않게 보정도 넣었다. 답한 속도로 등급을 매기던 방식은 문제 유형이 늘자 오히려 간격을 흔들어 걷어냈다'
C[1] = '하나였던 DB를 사용자용과 사전용으로 분리했다 — 영한·일한 사전을 검증된 배포 파일로 만들어 관리자 화면에서 교체·되돌리게 했고, 교체를 RENAME 한 문장으로 바꿔 디스크 쓰기를 3환경 8.7GB에서 환경당 1.4GB로 줄였다'
C.push('새 규칙 없이 알고리즘 값을 게임으로 번역했다 — 작물 경험치는 기억 안정도×10, 시듦·부패는 복습일에서 조회 시점에 계산해 DB에 상태를 저장하지 않는다',
  '로그아웃해도 살아 있던 로그인 토큰을 막았다 — 토큰에 버전을 넣어 로그아웃 시 모든 기기의 갱신 토큰이 즉시 무효가 되게 했다')

const A = S[8].bullets
A[2] = '사전 예문 약 9.9만 개에 강조 위치·문장 조각·난이도 라벨을 붙였다 — 생성과 판정은 AI 서브에이전트가, 최종 통과는 형태소 분석·발음 사전 기반 검증 스크립트가 맡는다'
A.push('일한 사전을 하루 만에 — 공개 사전(JMdict·Tatoeba) 골격 위에 AI로 한국어화하고, 다른 모델이 블라인드로 표본 감사',
  '헷갈리는 오답 보기 정리 — 임베딩 후보를 AI가 판정해 뜻이 겹치는 단어 그룹 45,059개를 만들고, 같은 그룹 단어는 오답 보기에서 뺀다')

const L = S[9].bullets
L[2] = '일별 실사용자 리포트는 만들었지만, 리텐션·복습 완료율 같은 효과 지표는 아직 계측하지 않고 있다'
L.push('일본어 학습은 베타다 — 일본어 예문 난이도는 형태소 분석기 없이 규칙으로 매겨 과대 판정이 남아 있다')

S.splice(4, 0, newGallery)
db.prepare('update projects set summary=?, metrics=?, stack=?, sections=?, updated_at=? where id=?')
  .run(summary, JSON.stringify(metrics), JSON.stringify(stack), JSON.stringify(S), Math.floor(Date.now() / 1000), p.id)
console.log('heyvoca updated')
