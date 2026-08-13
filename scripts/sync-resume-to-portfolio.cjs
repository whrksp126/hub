/**
 * 이력서(최종 확정본) → 포트폴리오 동기화.
 *
 * 기준: ~/Downloads/조건호 이력서.html (2026.08 최종 점검 완료)
 * 대상: profiles(geonho) · experiences · projects
 *
 * 실행:
 *   로컬  node scripts/sync-resume-to-portfolio.cjs
 *   프로덕션 docker cp → docker exec hub_app_prod node /app/sync-resume-to-portfolio.cjs
 *
 * 멱등(idempotent): 같은 값을 다시 써도 결과가 같다.
 */
const Database = require('better-sqlite3')

const DB = process.env.DATABASE_PATH || './data/hub.db'
const db = new Database(DB)
const USERNAME = 'geonho'

const profile = db.prepare('select id from profiles where username = ?').get(USERNAME)
if (!profile) throw new Error(`프로필 없음: ${USERNAME}`)
const PID = profile.id
const changes = []

// ─────────────────────────────────────────────────────────────
// 1) 프로필 — 수상 9건 / 통계 / AI 워크플로 스택 / 소개문 / 학력
// ─────────────────────────────────────────────────────────────
const awards = [
  { title: '모두의 창업 1기 합격', kind: '2026.06 · 정부 창업 프로그램' },
  { title: '예비창업패키지 합격', kind: '2025.05 · 중소벤처기업부' },
  { title: '부산 예비창업패키지 합격', kind: '2025.05 · 부산기술창업투자원' },
  { title: '청년 창업 리빙랩 프로그램 최우수상 (구청장상)', kind: '2024.12 · 부산 해운대구' },
  { title: '정보처리기사', kind: '2024.12 · 한국산업인력공단' },
  { title: '블록체인 경진대회 ESG 해커톤 장려상', kind: '2024.08 · 과학기술정보통신부 / KISA' },
  { title: '올해의 히어로 사내 수상', kind: '2022.12 · (주)히어로웍스' },
  { title: '특성화 창업아이디어 공모전 장려상', kind: '2018.12 · 경남정보대학교' },
  { title: '기계설계산업기사', kind: '2018.11 · 한국산업인력공단' },
]

const stats = [
  { value: '+04', label: 'YEARS BUILDING' },
  { value: '+08', label: 'PRODUCTS LAUNCHED' },
  { value: '+05', label: 'STUDY GROUP LED · 3Y' },
  { value: '+09', label: 'AWARDS & CERTS' },
]

const skills = [
  { area: 'FRONTEND', items: ['React', 'React Native', 'Next.js', 'Vite', 'TypeScript', 'Tailwind CSS', 'Vanilla JS/CSS/HTML'] },
  { area: 'BACKEND', items: ['Python · Flask', 'FastAPI', 'Node.js · Express', 'Socket.IO', 'SQLAlchemy', 'Sequelize'] },
  { area: 'DATA', items: ['MySQL', 'Redis', 'MinIO (S3)', 'Alembic'] },
  { area: 'INFRA / DEVOPS', items: ['Docker', 'Nginx', 'Cloudflare', 'Linux', '자체 홈서버'] },
  { area: 'APP / NATIVE', items: ['React Native', 'Electron', 'Swift', 'Rust', 'C++ / WinRT', 'C# / .NET8'] },
  { area: 'REALTIME / MEDIA', items: ['WebRTC', 'LiveKit SFU', 'RTMP', 'FFmpeg', 'coturn'] },
  { area: 'AI WORKFLOW', items: ['Claude Code', 'Codex CLI', 'MCP 서버', '에이전트 자동화'] },
  { area: 'AI / INTEGRATION', items: ['OpenAI API', 'Firebase FCM', 'ML Kit OCR', 'Google OAuth', 'Sentry'] },
]

// 이력서 00 소개 문단과 동일한 흐름(범위 → 결과 → 방향)
const intro =
  '아이디어 발굴부터 사업화까지, 프론트엔드에서 백엔드·앱·인프라까지 직접 만들어 왔습니다. ' +
  '서버를 직접 구축해 운영하며, 만든 프로젝트들은 실서비스로 돌아가고 있습니다. ' +
  '지금은 풀스택을 기반으로 팀 리드와 PM을 맡고 있으며, 기술 전체를 책임지는 CTO를 목표로 합니다.'

const bio = '풀스택으로 만들고 팀을 이끌며, 기술 전체를 책임지는 CTO를 목표로 합니다.'

// 첫 줄 = 학교/기간/지역, 둘째 줄부터 = 전환 서사 (렌더러가 줄 단위로 분리)
const education =
  '경남정보대학 기계설계과 졸업 · 2014.03 – 2019.02 · 부산\n' +
  '전공으로 CAD·Inventor를, 취미로 영상 편집 프로그램을 다루다 “이런 프로그램은 어떻게 만드는 걸까”가 궁금해 ' +
  '개발을 독학으로 시작했습니다. 프론트엔드로 출발했지만 한 분야에 갇히지 않으려고 백엔드·앱·인프라까지 아키텍처 전반을 함께 익혀 왔습니다.'

db.prepare(
  `update profiles set awards=?, stats=?, skills=?, intro=?, bio=?, education=?, updated_at=unixepoch() where id=?`,
).run(JSON.stringify(awards), JSON.stringify(stats), JSON.stringify(skills), intro, bio, education, PID)
changes.push('프로필: 수상 9건 · 통계 +09 · AI WORKFLOW 스택 · 소개문(CTO) · 학력 서사')

// ─────────────────────────────────────────────────────────────
// 2) 경력
// ─────────────────────────────────────────────────────────────
const EXPERIENCES = [
  {
    company: '슬기로운 사업',
    role: '대표 / 개인사업자',
    context: '1인 사업체 — 예비창업패키지(중기부·부산) · 모두의 창업 1기 선정',
    points: [
      '재직 중 지원한 예비창업패키지에 선정되면서 지원 요건에 따라 사업자를 등록 — 본업은 회사였고, 사업자 등록으로 그동안 사이드로 만들던 서비스를 실서비스 수준으로 고도화',
      '퇴사 후에는 전업으로 아이디어 발굴부터 개발·운영까지 직접 맡아 CodingPT를 개발·운영',
      'OrderAndGo · HeyVoca · GHC · Lambent 등 실서비스를 동시에 설계·개발·운영',
      '기술과 비즈니스를 함께 보며 제품을 끝까지 책임',
    ],
    stack: ['풀스택', '제품 기획', '팀 리드', '사업화'],
  },
  {
    company: '프라이머스 (주)',
    role: '개발팀장(개발 2~3인) / 창립 멤버',
    context: '에듀테크 스타트업 — PDF 특징점 기반 자동채점 학습 플랫폼 EveryStudy',
    points: [
      'Android·iOS 웹뷰 기반 학습 앱을 직접 개발하고, 웹과 앱이 같은 기능을 쓰도록 JS Bridge 공통 인터페이스 설계',
      'PDF 필기 반응 속도 개선 — 입력마다 획 전체를 다시 그리던 방식을 프레임 단위 처리로 바꿔 3초 획 기준 55ms → 12ms(약 4.6배), 지우개 판정도 재구현',
      '기기 안 로컬 HTTP 서버 도입 — 웹뷰로 PDF를 넘기는 방식이 OS 정책·기기 메모리 한계에 막혀 300MB 이하 교재만 열리던 것을 용량 제한 없이 열리도록 재설계',
      '수백 쪽 PDF 학습 화면을 가상 스크롤로 전환 — 빠르게 스크롤할 때 0.3초 걸리던 페이지 표시를 즉각 표시로 개선',
      'PDF 특징점 기반 자동채점 시스템 프론트엔드 개발·고도화 및 팀원 작업 조율',
    ],
    stack: ['React', 'TypeScript', 'Swift', 'Python', 'FastAPI', 'MySQL', 'AWS Lambda', 'S3', 'CloudFront'],
  },
  {
    company: '(주)히어로웍스',
    role: '프론트엔드 개발자',
    context: '숙박업 OTA 가격 최적화 SaaS DatAmenity — 사내 ‘올해의 히어로’ 수상',
    points: [
      '인수인계 없이 레거시 SSR 코드베이스를 분석해 CSR로 점진적 전환 수행',
      '외부 라이브러리 의존 없이 Vanilla HTML/CSS/JS로 프론트엔드 유지보수 및 기능 개발',
      'AI 기반 OTA 리뷰 자동 분석·댓글 서비스 프론트엔드 개발 참여',
    ],
    stack: ['HTML', 'CSS', 'JavaScript', 'Linux', 'Python', 'jQuery'],
  },
]

const upExp = db.prepare(
  `update experiences set role=?, context=?, points=?, stack=?, updated_at=unixepoch() where profile_id=? and company=?`,
)
for (const e of EXPERIENCES) {
  const r = upExp.run(e.role, e.context, JSON.stringify(e.points), JSON.stringify(e.stack), PID, e.company)
  if (r.changes === 0) throw new Error(`경력 없음: ${e.company}`)
  changes.push(`경력: ${e.company}`)
}

// ─────────────────────────────────────────────────────────────
// 3) 프로젝트 — 계기 문장 · 실측 지표 · 문제해결 수치 · AI 활용 섹션
// ─────────────────────────────────────────────────────────────
const AI_HEADING = 'AI 활용 · AI IN THIS PROJECT'
const SOLVED = '기술적으로 풀어낸 문제들'

const PROJECTS = {
  codingpt: {
    tag: 'AI 원격 개발 도구 · 앱 · 데스크톱',
    // 이력서 계기 문장을 요약 맨 앞에 둔다.
    lead:
      'PC에서 하던 바이브 코딩 환경을 모바일에서도 똑같이 쓰고 싶어서 만들었습니다. ' +
      'IDE·터미널·웹·시뮬레이터에 AI 에이전트 실행까지 한 앱에서 해결하는 올인원 원격 개발 환경입니다.',
    metrics: [
      { value: '3.4 → 25 fps', label: '실기기·에뮬레이터 화면 전송 (하드웨어 영상 스트림 전환)' },
      { value: '310~420 → 96~109 ms', label: '화면 반응 지연 (3단 경로 설계)' },
      { value: '55 → 6 KB/s', label: '대기 상태 데이터 사용량' },
    ],
    solved: [
      '공유기를 만지게 하면 제품이 죽는다 — PC가 밖으로 연결만 맺는 아웃바운드 전용 제어 채널과 스트림별 dial-back으로 NAT을 넘었습니다. 사용자가 열어야 하는 인바운드 포트 0개',
      '화면이 슬라이드쇼처럼 끊긴다 — 스크린샷 반복 촬영을 하드웨어 영상 스트림으로 교체해 3.4fps → 25fps, 대기 상태 데이터 사용량은 55KB/s → 6KB/s',
      '지연이 손끝에서 느껴진다 — 같은 Wi-Fi면 기기끼리 직접, 밖이면 WebRTC로 서버를 우회하는 3단 경로 설계로 310~420ms → 96~109ms',
      '남의 AI를 대신 돌리지 않는다 — 사용자 PC의 사용자 CLI를 그대로 쓰되, 터미널 안에서만 뜨던 승인 질문을 폰으로 옮겼습니다',
      '서버도 읽을 수 없게 한다 — 터미널·화면 데이터를 외부 암호 라이브러리 없이 종단간 암호화로 직접 구현하고, 구현체 간 호환을 테스트로 고정',
      'Node도 tmux도 없는 맥에 데몬을 배달한다 — 런타임까지 사이드카로 번들해 .dmg 하나로, 서명·공증·자동 업데이트까지 이었습니다',
      '피벗하면서 코드를 지우지 않는다 — 무엇을 삭제하고 무엇을 얼릴지 가르는 기준과, 서버·데몬·클라이언트 capability 교집합으로만 기능을 켜는 협상',
    ],
    ai: {
      body:
        '제품 자체가 AI 코딩 에이전트를 실행하는 하네스입니다. 우리 서버가 대신 AI를 호출하지 않고, ' +
        '사용자 PC에서 사용자의 CLI를 그대로 실행합니다.',
      bullets: [
        'Claude Code · Codex CLI를 폰에서 그대로 이어 쓰는 실행 하네스 — 세션·터미널·승인 흐름까지 원격으로 연결',
        '터미널 안에서만 뜨던 위험 명령 승인 질문을 폰으로 옮겨, 자리를 비운 사이에도 에이전트 작업이 멈추지 않게 설계',
        '우리 서버가 대신 부르는 AI 호출 0건 — 사용자 키·사용자 요금제로 사용자 PC에서 실행',
        '개발에도 규칙 문서(CLAUDE.md · AGENTS.md)와 DB 마이그레이션 규칙을 정의해, 에이전트가 지켜야 할 경계를 코드베이스에 고정',
      ],
    },
  },

  heyvoca: {
    lead:
      '학습할 단어를 손쉽게 등록하고, 오늘 복습할 단어는 알아서 골라주도록 만든 단어 학습 서비스. ' +
      '웹으로 만들어 iOS·Android 앱까지 한 벌로 제공합니다.',
    metrics: [
      { value: '113개', label: 'FSRS-5 자체 구현 전용 테스트' },
      { value: '3 → 16', label: '서버 동시 처리 (응답 밀림 해소)' },
      { value: '5만여 단어', label: '사용자 DB와 분리 배포되는 사전 DB' },
    ],
    solved: [
      'SM2를 버리고 FSRS-5를 직접 구현 — 서버 환경이 구버전 Python이라 기존 라이브러리를 쓸 수 없었고, 한 번 틀렸다고 복습 간격이 급락해 학습자가 이탈하는 문제를 막는 보정이 필요해 자체 설계(전용 테스트 113개). 스키마 변경 없이 무중단 교체',
      '하나였던 DB를 사용자 DB와 사전 DB로 분리 — 5만여 단어 사전을 검증된 배포 파일로 만들어 서버가 뜨면 자동으로 맞추도록 구성',
      '응답이 밀리던 문제 — 서버 동시 처리 능력을 3 → 16으로 늘리고 DB 연결 관리를 재설정해 해소',
      '사진으로 단어장 만들기를 기기 안에서 처리(ML Kit 온디바이스 OCR) — 사진이 서버로 전송되지 않아 클라우드 OCR 비용·이미지 보관이 없음',
      '유료 TTS를 provider 추상화 + object key 캐싱으로 — 무료 엔진으로 무중단 전환',
      '하이브리드 WebView에서 앱을 껐다 켜도 로그인 유지 — 쿠키 영속화 + 90일 슬라이딩 세션',
    ],
    ai: {
      body:
        '사전 데이터 구축과 앱 기능 양쪽에 AI를 넣되, 비용이 드는 호출은 마지막 수단으로 밀어냈습니다.',
      bullets: [
        '관리자 도구에 단어장 자동 생성(gpt-4o-mini) — 카테고리·상황 조건을 프롬프트로 조립하고 JSON 스키마를 강제해 파싱 실패와 중복을 걸러냄',
        '예문 강조 태깅 3단 폴백 — spaCy(영어)·Kiwi(한국어) 형태소 분석으로 활용형까지 무료로 처리하고, 실패분만 regex, 그래도 남은 잔여분만 GPT 배치로 호출해 비용 최소화',
        '5만여 단어 사전에 예문 26,737개를 생성하고, 어형 변화로 강조 위치가 틀어지는 문제를 검증 스크립트가 잡아 오류 0으로 마감',
        '사진으로 단어장 만들기는 온디바이스(ML Kit) — 사진이 서버로 나가지 않아 클라우드 비용·보관 이슈 없음',
        '개발은 역할별 서브에이전트 4종(앱·백엔드·프론트엔드·랜딩)과 배포·릴리스 스킬로 나눠 진행',
      ],
    },
  },

  orderandgo: {
    url: 'order.ghmate.com',
    lead:
      '실서비스 수준의 제품을 팀으로 만들자는 목표와 WebSocket 실시간 통신을 익히려는 동기로 시작해, ' +
      '매장에서 쓰는 POS·테이블오더·주방 관리·모바일 주문을 모두 담는 걸 목표로 했습니다.',
    metrics: [
      { value: '50대 / 중복 0', label: '동시 결제 요청 500회 시험, 성공은 항상 한 대' },
      { value: '238ms → 즉시', label: 'POS 화면 전환 (캐시 우선 렌더)' },
      { value: '10초', label: '최근 통신 기록 기준 실제 연결 상태 판정' },
    ],
    solved: [
      '결제 단말기 화면이 보안 정책으로 실시간 연결(WebSocket)을 막아 결제 요청이 전달되지 않던 문제 — 1초 주기 통신 + 서버 상태관리로 재설계. 단말기 50대가 동시에 요청해도 결제는 한 대만(500회 시험, 중복 0)',
      '꺼진 단말기도 ‘온라인’으로 보이던 상태 표시 — 최근 10초 통신 기록 기준으로 바꿔 실제 연결 상태를 보여주도록 개선',
      'POS 화면 전환 때마다 서버 응답 238ms를 기다리고 전환 애니메이션 150ms가 더 붙던 것 — 캐시 우선 렌더로 바꿔 누르자마자 표시되도록 개선',
      '좌석 배치가 저장 버튼을 눌러야 반영되던 방식 — 드래그 후 0.5초 자동 저장으로 바꾸고, 겹치면 되돌리는 판정을 외부 라이브러리 없이 직접 구현',
      '손님 QR·테이블오더 주문을 POS·주방에 실시간 동기화 — 부분 실패에도 화면이 어긋나지 않게',
    ],
    ai: {
      body:
        '제품 기능보다 운영 쪽에 AI를 썼습니다. 데모 매장을 실제 매장처럼 보이게 만드는 데 필요한 이미지 자산을 직접 생성했습니다.',
      bullets: [
        '데모 매장 메뉴 이미지 28장(메뉴 7종 × 히어로·탑다운·클로즈업·상황컷)을 생성형 AI로 제작',
        '모든 프롬프트 앞에 공통 STYLE 규칙을 붙여 조명·구도·질감을 통일 — ‘AI 티’가 나지 않는 실사 사진 톤으로 고정',
        '순차 생성 마스터 프롬프트를 만들어 한 번에 한 장씩·번호 순서대로 생성하고 저장 파일명까지 지정받는 방식으로 자산을 관리',
      ],
    },
  },

  ghc: {
    // 담당 에이전트 사실 검증(portfolio_assets/FACT-CHECK.md, 2026-08-13) 반영:
    //  · "1:1은 P2P"는 사실이 아님 — P2P는 기기 카메라 미리보기 경로 전용
    //  · 90Mbps는 추정치였음 → 업링크 실측 87.1Mbps로 교체
    //  · 3.5→2.0Mbps는 데스크탑 카메라 트랙 한정
    lead:
      '여러 각도를 찍으려면 장비가 각도만큼 늘고, 송출하려면 OBS를 따로 깔아야 했습니다. ' +
      '갖고 있는 기기를 그대로 카메라로 쓰고, 송출도 앱 안에서 끝내고 싶어 만들었습니다.',
    stack: [
      'TypeScript', 'React PWA · Vite', 'Zustand · Tailwind', 'Node.js · Express', 'Socket.IO',
      'LiveKit SFU', 'coturn (TURN)', 'RTMP Ingress', 'WebRTC',
      'MySQL 8 · Sequelize', 'Redis', 'MinIO (S3)',
      'Electron', 'Swift · ScreenCaptureKit', 'C++ / WinRT (WGC)', 'C# / .NET8', 'Docker',
    ],
    metrics: [
      { value: '140~250 vs 87 Mbps', label: '45방 기준 필요 대역폭 vs 홈서버 업링크 실측' },
      { value: '1.87초', label: '참여하기 → 폰 2대 포함 3앵글 완성 (실측)' },
      { value: 'CPU 1.58% · 336 MiB', label: '홈서버 컨테이너 7개 유휴 합계 · 9일 재시작 0회' },
    ],
    solved: [
      '화질·끊김 문제로 직접 운영하던 영상 서버(mediasoup)를 LiveKit으로 전면 교체 — 폰은 단일 화질, PC는 3단계 화질로 분리해 업로드가 나뉘어 고화질이 굶주리던 문제 해결(SFU 서버에 직접 질의해 폰 layers=1 · PC layers=3 확인)',
      '홈서버 회선이 버틸 수 있는 한계를 먼저 계산 — 45방 기준 필요 140~250Mbps에 업링크 실측은 87Mbps였다. 데스크탑 송출을 3.5 → 2.0Mbps로, 화면 공유를 3.0 → 2.0Mbps로 낮추고 동시 라이브 8개·사용자당 카메라 3대 상한을 두어 회선 포화를 사전 차단',
      '외부 클라우드 없이 영상 서버·중계 서버·방송 입력·DB를 홈서버 컨테이너 7개로 직접 운영 — 유휴 시 7개 합계 CPU 1.58% · 336MiB, 배포 후 9일 연속 재시작 0회',
      '기기 카메라 미리보기만 SFU를 거치지 않고 기기 간 직접 연결(P2P)로 붙였다 — 방 통화는 참가자 수와 무관하게 SFU를 지나고, 희소한 홈서버 업링크는 미리보기 트래픽에 쓰지 않는다',
      '한 계정의 여러 기기를 각각 독립 카메라로 등록해 멀티앵글로 송출하는 구조 설계 — 사용자:기기 식별자로 참가자를 나눠 기기마다 원격 제어도 가능(제어 이벤트 6종)',
      '실측 체감 — 방 진입에서 내 카메라 첫 프레임까지 154ms, 참여부터 폰 2대 포함 3앵글이 붙기까지 1.87초, 앵글 전환 210ms',
    ],
    ai: {
      body:
        '실시간 미디어처럼 영역마다 판단 기준이 다른 코드베이스라, 도메인별 전담 에이전트를 정의해 개발했습니다.',
      bullets: [
        '역할별 서브에이전트 6종 정의 — WebRTC·미디어 파이프라인, 백엔드, DB, 데브옵스, 프론트엔드, 코드 리뷰',
        '각 에이전트에 담당 파일 경로와 판단 범위를 명시해, 시그널링·SFU 설정처럼 민감한 영역을 무관한 변경으로부터 분리',
        '미디어 서버 교체(mediasoup → LiveKit)처럼 넓은 변경도 담당 에이전트 단위로 쪼개 진행',
      ],
    },
  },

  lambent: {
    lead:
      '음악 시각화가 창을 하나 더 띄워 작업을 가리는 게 싫어, 창 없이 화면 가장자리만 빛으로 물들이게 만든 macOS 앱입니다.',
    metrics: [
      { value: '0.25 → 0.95배', label: '실제 음원 기준 비트 감지율 (재보정 후)' },
      { value: '93.75회/초', label: '오디오 분석 주기 (화면 60프레임과 분리)' },
      { value: '100~500배', label: '자기 소리 되먹임 분리 (실측)' },
    ],
    solved: [
      '합성 신호로 맞춘 DSP가 실제 음악에서 무너졌다 — 화면을 보며 만지는 대신 실제 음원으로 훑어 기준을 재설정, 비트 감지율 0.25배 → 0.95배까지 회복시키고 회귀 테스트로 고정',
      '소리를 다루는 스레드가 멈추면 음이 끊긴다 — 3스레드 대기 없는 구조로 분석 93.75회/초와 화면 60프레임을 분리하고, 분석 단위를 오디오 장치 단위와 1:1로 맞춤',
      '자기 소리를 다시 듣는다 — 가상 사운드 드라이버 설치 없이 시스템 출력을 캡처하되, 자기 소리만 100~500배 차이로 분리(실측)',
      '뒤에 뭐가 있는지 모른 채 그려야 한다 — 배경을 읽지 않고, 빛을 더하는 합성 하나로 흰 배경과 검은 배경을 동시에 만족시켰습니다',
      '유료 기능을 어떻게 잠그나 — 켜고 끄는 값이 아니라 라이선스 서명에서 파생한 키로 셰이더 자체를 암호 봉인. 배포 파일을 뜯어봐도 평문이 나오지 않고, 활성화 뒤에는 서버 없이 오프라인으로 검증',
      '착수 전에 무엇이 틀렸는지 안다 — 스파이크 넷으로 가정 아홉 개를 먼저 깨고 시작했습니다',
    ],
  },
}

const rows = db.prepare('select id, slug, summary, sections, metrics, stack from projects where profile_id = ?').all(PID)
const upProj = db.prepare(
  'update projects set tag=coalesce(?,tag), url=coalesce(?,url), summary=?, metrics=?, sections=?, stack=?, updated_at=unixepoch() where id=?',
)

for (const row of rows) {
  const spec = PROJECTS[row.slug]
  if (!spec) continue

  // ① 요약: 계기 문장을 맨 앞에 (이미 붙어 있으면 중복 추가하지 않음)
  let summary = row.summary || ''
  if (!summary.startsWith(spec.lead)) {
    // 이전 실행에서 붙인 다른 버전의 lead가 있으면 제거하고 다시 붙인다.
    const known = Object.values(PROJECTS).map((p) => p.lead)
    for (const k of known) if (summary.startsWith(k)) summary = summary.slice(k.length).trim()
    summary = `${spec.lead} ${summary}`.trim()
  }

  // ② 지표: 실측값으로 교체
  const metrics = spec.metrics ? JSON.stringify(spec.metrics) : row.metrics

  // ③ 섹션: 문제해결 불릿 교체 + AI 활용 섹션 삽입
  const sections = JSON.parse(row.sections || '[]')
  if (spec.solved) {
    const i = sections.findIndex((s) => (s.heading || '').startsWith(SOLVED))
    if (i >= 0) {
      sections[i] = { ...sections[i], bullets: spec.solved }
    } else {
      // GHC처럼 해당 섹션이 없던 프로젝트는 새로 만든다.
      sections.push({
        heading: `${SOLVED} · CHALLENGES`,
        kind: 'challenge',
        body: '쉬운 길이 막힌 지점들을 직접 설계로 돌파했습니다. 개선 전후는 실제로 측정한 값입니다.',
        bullets: spec.solved,
      })
    }
  }
  if (spec.ai) {
    // kind:'challenge'는 '도전' 배지가 붙으므로 AI 섹션은 default(제목 좌측 정렬) 레이아웃을 쓴다.
    const ai = { heading: AI_HEADING, kind: 'default', body: spec.ai.body, bullets: spec.ai.bullets }
    const j = sections.findIndex((s) => (s.heading || '') === AI_HEADING)
    if (j >= 0) sections[j] = ai
    else {
      // 문제해결 섹션 바로 뒤에 놓는다(없으면 맨 뒤).
      const k = sections.findIndex((s) => (s.heading || '').startsWith(SOLVED))
      if (k >= 0) sections.splice(k + 1, 0, ai)
      else sections.push(ai)
    }
  }

  const stack = spec.stack ? JSON.stringify(spec.stack) : row.stack
  upProj.run(spec.tag ?? null, spec.url ?? null, summary, metrics, JSON.stringify(sections), stack, row.id)
  changes.push(`프로젝트: ${row.slug}${spec.ai ? ' (+AI 활용)' : ''}`)
}

// ④ 정렬: 주력 5개를 앞으로, 이력서에서 뺀 2개는 뒤로
const ORDER = ['codingpt', 'heyvoca', 'ghc', 'orderandgo', 'lambent', 'openday', 'skyswarm']
const upOrder = db.prepare('update projects set "order"=? where profile_id=? and slug=?')
ORDER.forEach((slug, i) => upOrder.run(i, PID, slug))
changes.push(`정렬: ${ORDER.join(' → ')}`)

console.log(`[sync] ${DB}`)
for (const c of changes) console.log('  ·', c)
