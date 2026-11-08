// 2026-11 codingpt 다이어트: 상단 지표 제거, 중복·TMI 제거, 문장 단축 (사용자 요청)
const Database = require('better-sqlite3')
const db = new Database(process.env.DATABASE_PATH || './data/hub.db')
const p = db.prepare("select id, sections from projects where slug='codingpt'").get()
const S = JSON.parse(p.sections)
const by = (h) => S.find((s) => (s.heading || '').includes(h))
const drop = (sec, ids) => (sec.media = sec.media.filter((m) => !ids.includes(m.mediaId)))

const summary = 'AI에게 일을 맡기고 자리를 떠도, 폰으로 내 PC의 작업을 이어갑니다. 터미널·코드·실행 중인 앱은 원래 PC에서 그대로 돌고, 여러 에이전트에게 나눠 맡긴 일도 폰에서 지켜봅니다.'

const lead = by('한 줄로')
lead.body = '자리를 비워도 AI 작업이 멈추지 않게, 내 PC를 폰에서 그대로 이어 씁니다.'
lead.bullets = ['추가 구독료 0 — 이미 쓰는 AI 도구를 내 PC에서 그대로 실행한다', '네트워크 설정 0 — 공유기나 방화벽을 건드리지 않는다', '폰에 맞게 다시 만든 화면 — 터미널·파일·미리보기']

const g1 = by('①'); g1.body = '폰에서 보낸 명령은 내 PC에서 실행됩니다. 터미널·개발 서버·파일이 폰과 PC에 함께 열리고, 앱을 껐다 켜도 작업이 이어집니다.'
g1.media.find((m) => m.kind === 'video').caption = '폰에서 보낸 명령이 PC에서 실행되고, 결과가 양쪽 미리보기에 함께 반영된다'
const g2 = by('②'); g2.body = 'AI가 실행 전에 묻는 승인 질문을 폰으로 옮겼습니다. 밖에서 허용을 누르면 PC에서 작업이 이어집니다.'
g2.media[0].caption = '승인 요청이 폰에 카드로 오고, 허용하면 PC에서 작업이 이어진다'
const g3 = by('③'); g3.body = '서버가 AI를 대신 부르지 않습니다. 내 PC에 이미 있는 AI 도구를 그대로 실행하고, 계정 정보는 PC 밖으로 나가지 않습니다.'
const g4 = by('④'); g4.body = '할 일을 나눠 맡기면 에이전트들이 각자 브랜치에서 일합니다. 작업자는 PC와 폰 사이드바에 보이고, 폰에서 질문에 답하거나 멈출 수 있습니다.'
g4.media = g4.media.filter((m) => !/막히면/.test(m.caption || ''))
for (const m of g4.media) {
  if (m.kind === 'video') m.caption = '작업자를 띄워 일을 나누고, 폰에서 결정해 주면 결과가 모인다 (약 6분을 18초로 편집)'
  else if (/사이드바/.test(m.caption)) m.caption = '사이드바에 묶음과 작업자가 줄로 보인다'
  else if (/이슈/.test(m.caption)) m.caption = '이슈를 상태별로 보고 바로 맡긴다'
}
const g5 = by('⑤'); g5.body = '에이전트가 미리보기 브라우저·에뮬레이터·가상 PC를 직접 열어 누르고 결과를 읽습니다. 사람은 폰에서 지켜보다가 필요할 때 이어받습니다.'
g5.media = g5.media.filter((m) => !/대화 화면/.test(m.caption || ''))

by('방향을').body = '처음엔 폰으로 코딩을 배우는 앱이었습니다. AI 덕분에 배우지 않아도 만들 수 있게 되자, 2026년 7월 교육 앱의 모바일 터미널·에디터를 살려 폰에서 AI와 개발을 이어가는 도구로 방향을 바꿨습니다.'

by('핵심 기능').bullets = [
  '터미널 — 여러 기기가 같은 PC 터미널을 보고, 재부팅해도 탭이 돌아온다',
  '원격 승인 — AI의 실행 요청을 폰에서 허용·거절한다',
  '파일·미리보기 — PC의 파일을 고치고, 개발 서버를 폰에서 연다',
  '에뮬레이터 — PC의 안드로이드·iOS 시뮬레이터를 폰에서 보고 터치한다',
  '채팅 — 터미널 대신 대화 화면으로 같은 에이전트와 이야기한다',
  '작업·오케스트레이션 — 여러 에이전트에게 나눠 맡기고 결과를 모은다',
  '이슈·자동화 — 이슈를 바로 맡기고, 정한 조건이 되면 자동으로 시작한다',
  '에이전트 PC — 가상 macOS·Linux를 에이전트가 직접 조작한다',
]

const tl = by('무엇을')
tl.body = '교육 앱 시절엔 팀으로 시작했고, 2026년 7월 방향을 바꾼 뒤로는 단독으로 개발하고 있습니다.'
tl.bullets = [
  '2025.07 ~ 2026.05 — 팀 협업. 앱 구조·로그인·백엔드·인프라 담당 (레슨 콘텐츠는 다른 담당자)',
  '2026.05 ~ 08 — 저장소를 새로 만든 뒤 단독. 방향 전환, PC 프로그램·중계 서버·모바일 앱 출시',
  '2026.09 ~ 현재 — 여러 에이전트를 맡기고 지켜보는 도구로 확장',
]

by('기술적으로').bullets = [
  '공유기 설정 없이 연결 — PC가 밖으로 연결을 거는 방식으로 바꿔, 사용자가 열어야 할 포트를 0개로 만들었다',
  '끊기던 원격 화면 — 스크린샷을 반복해 찍던 방식을 영상 스트림으로 바꿔 매끄럽게 만들고, 대기 중 데이터도 크게 줄였다',
  '가까우면 직접, 멀면 중계 — 같은 Wi-Fi → WebRTC → 서버 중계 순으로 내려가는 연결 경로로 지연을 줄였다',
  '서버도 못 보는 명령 — 암호화 API가 없는 모바일 환경까지 같은 표준 암호화 코드로 맞췄다',
  '여러 기기가 보는 한 터미널 — 화면 크기를 정하는 기기를 하나로 두어 화면 깨짐을 없앴다',
]

const ai = by('AI 활용')
delete ai.body
ai.bullets = [
  'Claude·Codex를 폰에서 이어 쓰는 실행 환경 — 세션·터미널·승인까지 원격으로',
  '에이전트가 쓰는 도구(`cpt`)를 제품 안에 만들어, 브라우저·에뮬레이터·가상 PC 조작과 작업 분배를 맡겼다',
  '개발에도 규칙 문서를 두어, AI가 지켜야 할 경계를 코드베이스에 정해 두었다',
]

by('한계').bullets = [
  '개인 사용은 무료이고 선택 후원만 받는다. 과금 기능은 만들어 뒀지만 꺼 두었다',
  'Windows 지원은 준비 중이고, 가상 PC·iOS 시뮬레이터 화면은 Apple Silicon 맥에서만 된다',
  '종단 간 암호화는 제어 명령까지다. 터미널·화면 스트림은 아직 범위 밖이다',
]

db.prepare('update projects set summary=?, metrics=?, sections=?, updated_at=? where id=?')
  .run(summary, '[]', JSON.stringify(S), Math.floor(Date.now() / 1000), p.id)
const len = (x) => JSON.stringify(x).length
console.log('codingpt trimmed; sections chars', len(JSON.parse(db.prepare("select sections from projects where slug='codingpt'").get().sections)))
