// 2026-11 최신화: codingpt 담당 에이전트 refresh-2026-11/CHANGES.md + MANIFEST §3 반영
// 실행: node scripts/refresh-2026-11-codingpt.cjs <ids 파일(key=mediaId 줄)>
const fs = require('node:fs')
const Database = require('better-sqlite3')
const db = new Database(process.env.DATABASE_PATH || './data/hub.db')
const id = Object.fromEntries(fs.readFileSync(process.argv[2], 'utf8').trim().split('\n').map((l) => l.split('=')).map(([k, v]) => [k, Number(v)]))
const poster = (k) => `https://objectstore.ghmate.com/hub/media/cpt-r11-${k}.poster.jpg`
const p = db.prepare("select id, summary, metrics, stack, sections from projects where slug='codingpt'").get()
const metrics = JSON.parse(p.metrics), S = JSON.parse(p.sections)

const summary = p.summary.trim().replace(/돌아갑니다\.$/, '돌아가고, 여러 에이전트에게 나눠 맡긴 일도 폰에서 지켜보고 거들 수 있습니다.')
for (const m of metrics) if (!m.label.includes('1회 측정')) m.label += ' (1회 측정)'
const stack = ['React Native (iOS · Android)', 'Tauri (Rust) · macOS 서명/공증', 'Node.js 데몬 · tmux control mode', 'Express · WebSocket 릴레이',
  'WebRTC · H.264 (VideoToolbox)', 'Apple Virtualization (Lume) — 에이전트용 macOS·Linux VM', 'PostgreSQL', 'Next.js App Router (SSR)',
  'Tiptap (PC·앱 공용 편집기)', 'X25519 · Ed25519 (제어 명령 종단 간 암호화)']

S[1].body = S[1].body.trim() + ' PC에서 연 미리보기나 파일은 폰에도 바로 나타나고, 폰에서 닫으면 PC에서도 닫힙니다.'
S[1].media = [
  { kind: 'video', mediaId: id.phone_to_pc_2, caption: '폰에서 명령을 보내면 PC에서 실행되고, 바뀐 결과가 PC 미리보기와 폰 미리보기에 함께 반영된다', poster: poster('phone-to-pc-2') },
  { kind: 'image', mediaId: id.mobile_terminal_3, caption: 'PC 터미널을 그대로 비추는 화면 — 테스트 결과와 빌드 로그가 흐른다' },
  { kind: 'image', mediaId: id.mobile_preview_3, caption: 'PC에서 돌고 있는 개발 서버를 폰에서 그대로 연다' },
  { kind: 'image', mediaId: id.pc_terminal_ide_2, caption: 'PC 앱 — 터미널 옆에 파일 트리와 파일을 열어 두고 쓴다' },
]
S[2].media = [{ kind: 'video', mediaId: id.remote_approval_2, caption: 'PC의 AI가 승인을 요구하면 폰에 카드가 도착하고, 허용하는 순간 PC에서 작업이 이어진다', poster: poster('remote-approval-2') }]
S[3].media = [{ kind: 'image', mediaId: id.pc_agent_select_2, caption: 'PC에 설치된 AI 도구를 찾아 연동 수준과 함께 보여 준다' }]
const g4 = {
  kind: 'gallery', heading: '④ 여러 에이전트에게 나눠 맡기고, 폰에서 지켜봅니다',
  body: '한 번에 한 가지씩 시키고 기다릴 필요가 없습니다. 할 일을 적어 두면 에이전트가 각자 작업 폴더(브랜치)에서 일하고, 끝나면 바뀐 내용을 보고 합치거나 버립니다. 에이전트가 직접 다른 에이전트를 띄워 일을 나누기도 합니다. 모든 작업자는 PC와 폰 사이드바에 줄로 나타나 지켜보고, 질문에 답하고, 멈출 수 있습니다.',
  media: [
    { kind: 'video', mediaId: id.orchestration, caption: '코디네이터가 작업자를 띄워 일을 나누고, 폰에서 결정 요청에 답하면 결과가 모여 미리보기에 반영된다 (실제 약 6분을 세 구간으로 편집)', poster: poster('orchestration') },
    { kind: 'image', mediaId: id.pc_orch_sidebar, caption: '에이전트가 작업자를 띄워 일을 나눈다 — 사이드바에 묶음과 작업자가 줄로 보인다' },
    { kind: 'image', mediaId: id.mobile_orch_decision, caption: '작업자가 막히면 폰에서 바로 결정해 준다' },
    { kind: 'image', mediaId: id.mobile_tasks_board, caption: '자체 이슈를 상태별로 한 곳에서 보고 바로 맡긴다' },
  ],
}
const g5 = {
  kind: 'gallery', heading: '⑤ AI가 직접 보고 누르는 화면',
  body: '에이전트에게 "화면에서 확인해 봐"라고 하면, 에이전트가 미리보기 브라우저·폰 에뮬레이터·가상 PC를 직접 열어 클릭하고 결과를 읽습니다. 사람은 같은 화면을 폰에서 지켜보다가, 로그인처럼 사람이 해야 할 단계가 오면 이어받아 누릅니다.',
  media: [
    { kind: 'image', mediaId: id.pc_browser_control, caption: '에이전트가 미리보기 브라우저를 직접 클릭하고 콘솔을 읽는다' },
    { kind: 'image', mediaId: id.tablet_agent_pc, caption: '맥 안의 가상 macOS를 에이전트가 조작하고, 태블릿에서 지켜본다' },
    { kind: 'image', mediaId: id.mobile_chat, caption: '터미널 대신 대화 화면으로 같은 에이전트와 이야기한다' },
  ],
}

const F = S[5].bullets
F[0] = '터미널 — PC 터미널을 여러 기기가 함께 본다. 크기는 지금 쓰는 기기에 맞추고, 앱을 껐다 켜도·PC를 재부팅해도 탭이 그대로 돌아온다'
F[2] = '파일 — PC의 파일 트리를 폰에서 열고 고친다. git 변경 표시·여러 개 선택·휴지통 삭제까지'
F[3] = '미리보기 브라우저 — PC의 개발 서버를 폰에서 진짜 localhost로 연다. 에이전트도 같은 브라우저를 클릭·검사한다'
F.push('채팅 — 터미널 대신 대화 화면으로 같은 에이전트와 이야기하고, 언제든 터미널로 이어받는다',
  '에이전트 작업 — 할 일 하나를 브랜치 여러 개에 나눠 맡기고, 바뀐 내용을 보고 PR·머지까지',
  '오케스트레이션 — 에이전트가 다른 에이전트를 띄워 일을 나누고 결과를 모은다. 작업자는 전부 화면에 보인다',
  '이슈와 자동화 — 자체 이슈와 GitHub 이슈를 한 목록에서 보고 바로 에이전트에게 맡긴다. "매일 아침", "새 이슈가 오면" 같은 조건으로 자동 시작',
  '에이전트 PC — 맥 안의 가상 macOS·Linux를 에이전트가 직접 조작한다. 내 화면과 마우스는 그대로 두고',
  '외부 연동 — 다른 서비스가 API 키로 이 PC의 에이전트를 부른다. AI API 키 없이 내 구독으로')

const T = S[6].bullets
T[2] = '2026.07 ~ 08 — 방향 전환 후 단독. PC 프로그램·중계 서버·모바일 앱·원격 승인·암호화·스토어 출시'
T.push('2026.09 ~ 현재 — 여러 에이전트로 확장. 터미널 구조 재설계, 에이전트 PC(가상 macOS·Linux), 작업·오케스트레이션·이슈·자동화, 외부 연동 API, 7개 언어')

S[7].bullets.push('여러 기기가 한 터미널을 보면 화면이 깨졌다 — 크기를 정하는 기기를 한 대로 정하고 나머지는 그 화면을 축소해 보게 바꿨다. 터미널 정본은 데몬이 tmux에 붙여 둔 제어 클라이언트 하나에 두었다',
  '에이전트가 에이전트를 부리면 "조용함"을 끝으로 착각한다 — 침묵·타임아웃은 종료의 증거로 쓰지 않고, 멈춤·정리는 종료가 확인된 뒤에만 하도록 규칙을 박았다')

const A = S[8].bullets
A[0] = 'Claude · Codex를 폰에서 그대로 이어 쓰는 실행 환경 — 세션·터미널·승인까지 원격으로. Gemini·Cursor·OpenCode는 실행만 연결한다(연동 등급을 화면에 그대로 표시)'
A.push('에이전트가 쓰는 도구를 제품 안에 만들었다 — `cpt` 명령으로 미리보기·브라우저·에뮬레이터·가상 PC를 조작하고, 다른 에이전트를 띄워 일을 나눈다. 세션이 시작될 때 기능 안내 목차를 넣어 에이전트가 숨은 도구 대신 이걸 쓰게 했다')

S[9].bullets.push('에이전트 PC(가상 머신)와 iOS 시뮬레이터 화면은 Apple Silicon 맥에서만 된다',
  '종단 간 암호화는 원격 조작 명령·파일 요청까지다. 터미널·화면 영상 스트림은 아직 그 범위 밖이다')

S.splice(4, 0, g4, g5)
db.prepare('update projects set summary=?, metrics=?, stack=?, sections=?, updated_at=? where id=?')
  .run(summary, JSON.stringify(metrics), JSON.stringify(stack), JSON.stringify(S), Math.floor(Date.now() / 1000), p.id)
console.log('codingpt updated')
