/**
 * 포트폴리오 샘플 시드 — 조건호 프로필 + 프로젝트 6 + 경력 4.
 * 데이터 출처: 사용자가 Claude Design으로 직접 작성한 "Geonho Portfolio".
 *
 * 실행: pnpm tsx scripts/seed-portfolio.ts
 * (db/index.ts는 'server-only'라 스크립트에서 못 쓰므로 여기서 직접 연결한다.)
 */
import Database from 'better-sqlite3'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '../src/db/schema'

const sqlite = new Database(process.env.DATABASE_PATH || './data/hub.db')
sqlite.pragma('foreign_keys = ON')
const db = drizzle(sqlite, { schema })

const USERNAME = 'geonho'

const profile = {
  username: USERNAME,
  name: '조건호',
  nameEn: 'GEONHO JO',
  title: '풀스택 개발자 · 예비창업가',
  headline: 'FULL-STACK\nDEVELOPER',
  tagline: '기획부터 런칭까지, 혼자서 끝까지.',
  bio: '기획부터 런칭까지, 프론트엔드·백엔드·앱·인프라를 모두 다루는 풀스택 개발자.',
  intro:
    '프론트엔드에서 백엔드·앱·인프라까지, 아이디어 발굴부터 사업화까지. 여러 실서비스를 설계하고 런칭해 운영해 왔습니다.',
  email: 'whrksp126@gmail.com',
  github: 'whrksp126',
  phone: '010-2085-2374',
  education: '기계설계학과 졸업',
  business: '슬기로운 사업',
  accent: '#F1531B',
  theme: 'editorial-dark',
  status: 'published' as const,
  stats: [
    { value: '+04', label: 'YEARS BUILDING' },
    { value: '+08', label: 'PRODUCTS LAUNCHED' },
    { value: '+05', label: 'PLATFORMS SHIPPED' },
  ],
  skills: [
    { area: 'FRONTEND', items: ['React', 'React Native', 'Next.js', 'TypeScript', 'Vanilla JS/CSS'] },
    { area: 'BACKEND', items: ['Python · Flask', 'FastAPI', 'Node.js · Express', 'Socket.IO', 'SQLAlchemy'] },
    { area: 'DATA', items: ['MySQL', 'Redis', 'MinIO (S3)', 'Alembic'] },
    { area: 'INFRA / DEVOPS', items: ['Docker', 'Nginx', 'Cloudflare', 'Linux', '자체 홈서버'] },
    { area: 'APP / NATIVE', items: ['Swift', 'C++ / WinRT', 'C# / .NET8', 'Electron'] },
    { area: 'REALTIME / MEDIA', items: ['WebRTC', 'LiveKit SFU', 'RTMP', 'FFmpeg', 'coturn'] },
  ],
  awards: [
    { title: '리빙랩 창업 공모전 최우수상 (구청장상)', kind: '창업 공모전' },
    { title: '블록체인 해커톤 수상', kind: '해커톤' },
    { title: '올해의 히어로 사내 수상', kind: '(주)히어로웍스' },
    { title: '예비창업패키지 합격 (부산)', kind: '중소벤처기업부' },
    { title: '모두의 창업 1기 1라운드 진출', kind: '정부 창업' },
    { title: '정보처리기사', kind: '한국산업인력공단' },
    { title: '기계설계산업기사', kind: '한국산업인력공단' },
  ],
  social: [{ kind: 'github', label: 'GitHub', url: 'https://github.com/whrksp126' }],
  notes: [
    {
      category: '아키텍처',
      date: '2026.04',
      readTime: '8분',
      title: '토스 결제 단말기에서 WebSocket 없이 실시간을 만든 방법',
      excerpt: '결제 단말기 WebView의 제약을 HTTP 폴링 기반 분산 상태머신으로 풀어낸 OrderAndGo 설계 기록.',
    },
    {
      category: '알고리즘',
      date: '2025.11',
      readTime: '11분',
      title: 'FSRS-5 간격 반복 알고리즘을 직접 구현하며 배운 것',
      excerpt: '라이브러리 없이 안정성·회수율 모델을 다시 쓰고 soft lapse 보정을 더한 HeyVoca 개발기.',
    },
    {
      category: '인프라',
      date: '2026.05',
      readTime: '9분',
      title: '홈서버 한 대로 SFU·TURN·Ingress까지: 클라우드 비용 0원 미디어 스택',
      excerpt: 'LiveKit을 자가호스팅하며 실시간 미디어 스택을 외부 비용 없이 운영한 GHC 운영기.',
    },
    {
      category: '회고',
      date: '2025.08',
      readTime: '7분',
      title: '혼자서 iOS·Android·웹을 동시에 운영한다는 것',
      excerpt: '1인 풀스택으로 멀티플랫폼을 유지하기 위한 코드 공유 전략과 현실적인 트레이드오프.',
    },
  ],
}

export const projectRows = [
  {
    slug: 'orderandgo',
    title: 'OrderAndGo',
    titleKr: '오더앤고',
    tag: 'SaaS · 주문·결제 · 멀티테넌트',
    year: '2023.05 — 운영 중',
    role: '1인 풀스택',
    url: 'order.ghmate.com',
    featured: true,
    summary:
      'QR 셀프 주문 · 주방 KDS · 토스 단말기 결제까지 하나로 묶은 레스토랑 통합 주문·결제 SaaS. 외부 PG·키오스크 하드웨어 없이, 토스 단말기 WebView의 WebSocket 불가 제약을 폴링 기반 분산 상태머신으로 돌파해 한 사람이 풀스택으로 완성·운영한다.',
    metrics: [
      { value: '504', label: '커밋 · 3년 · 1인 풀스택' },
      { value: '3', label: '클라이언트 QR·POS/KDS·단말기' },
      { value: '120s', label: '결제 승인취소 윈도우' },
    ],
    stack: [
      'Python 3.11', 'Flask', 'SQLAlchemy 2.0', 'MySQL 8.0', 'Flask-SocketIO', 'eventlet', 'gunicorn',
      'Flask-Login', 'Bcrypt', 'Alembic', 'Vanilla JS', 'Jinja2', 'Socket.IO', 'boto3 · MinIO(S3)',
      'TossFrontSDK', 'Docker Compose', 'nginx', 'Cloudflare',
    ],
    sections: [
      {
        kind: 'lead',
        heading: '개요 · OVERVIEW',
        body: '식당 사장님이 메뉴·테이블을 직접 배치하고, 손님은 QR로 폰에서 주문하며, 주방은 화면(KDS)으로 받고, 토스 단말기로 결제까지 처리하는 레스토랑 통합 주문·결제 SaaS.',
        bullets: [
          '고객 셀프 주문(QR) · POS · 주방 디스플레이(KDS) · 결제 · 영수증/주방 프린터 · 직원호출을 하나의 멀티테넌트 웹으로 통합',
          '별도 키오스크 하드웨어 없이 손님 휴대폰(QR) + 매장 단말기만으로 주문~결제 흐름을 완성',
          '토스플레이스 결제 단말기에 자체 플러그인을 올려 외부 PG 연동 없이 카드/현금/현금영수증을 직접 처리',
          '다점포(멀티테넌트) 지원 구조 — 자체 홈서버에 dev·stg·prod 3환경 운영',
        ],
      },
      {
        kind: 'gallery',
        heading: '화면 · SCREENS',
        body: 'POS · 주방 KDS · 손님 QR 주문 · 캔버스 배치 에디터 · 토스 단말기 결제 · 결제내역 · 매장관리 — 실제 화면/데모 영상을 추가하세요. (미디어가 없으면 공개 페이지에선 숨겨집니다)',
        media: [],
      },
      {
        kind: 'timeline',
        heading: '역할 · ROLE',
        body: '기획·DB설계·백엔드·프론트엔드·인프라·배포·토스 단말기 플러그인까지 전 영역을 직접 수행한 1인 풀스택.',
        bullets: [
          '2023.05~2024.06 1차 집중 개발 → 약 21개월 공백 → 2026.03~2026.05 2차 고도화',
          '2차 고도화 범위: 토스 단말기 연동 · KDS · 프린터 · 결제내역 — 2026년에만 약 173 커밋',
        ],
      },
      {
        kind: 'diagram',
        heading: '시스템 아키텍처',
        body: `graph TD
  classDef client fill:#0f1f33,stroke:#5b9bf0,stroke-width:1.5px,color:#d6e6ff
  classDef edge fill:#2b2113,stroke:#e0a052,stroke-width:1.5px,color:#f4dcbb
  classDef app fill:#2c1710,stroke:@accent,stroke-width:2px,color:#ffd9c9
  classDef rt fill:#10211a,stroke:#5fbf8a,stroke-width:1.5px,color:#cdeede
  classDef data fill:#1b1530,stroke:#9183dd,stroke-width:1.5px,color:#ddd6f6
  classDef crit fill:#3a1209,stroke:#ff6a3d,stroke-width:2.5px,color:#ffd0c2
  classDef ext fill:#181818,stroke:#6f6f6f,stroke-width:1.3px,color:#bcbcbc

  subgraph C["클라이언트"]
    QR["@icon:smartphone <b>손님 휴대폰</b><br/><span style='font-size:11px;opacity:.62'>QR 셀프주문</span>"]:::client
    POS["@icon:monitor <b>매장 POS</b><br/><span style='font-size:11px;opacity:.62'>주방 KDS</span>"]:::client
    TERM["@icon:card <b>토스 결제 단말기</b><br/><span style='font-size:11px;opacity:.62'>프론트 플러그인</span>"]:::client
  end
  subgraph E["엣지"]
    CF{{"@icon:cloud <b>Cloudflare</b><br/><span style='font-size:11px;opacity:.62'>SSL · DNS</span>"}}:::edge
    NG["@icon:shield <b>nginx</b><br/><span style='font-size:11px;opacity:.62'>리버스 프록시</span>"]:::edge
  end
  subgraph S["홈서버 · Docker Compose"]
    FL["@icon:server <b>Flask</b><br/><span style='font-size:11px;opacity:.62'>gunicorn · eventlet · Blueprint×8</span>"]:::app
    SIO(["@icon:radio <b>Socket.IO</b><br/><span style='font-size:11px;opacity:.62'>room 격리</span>"]):::rt
    PEND(["@icon:zap <b>결제 상태머신</b><br/><span style='font-size:11px;opacity:.62'>in-memory</span>"]):::crit
    DB[("@icon:database <b>MySQL 8.0</b>")]:::data
  end
  OBJ[("@icon:box <b>MinIO</b><br/><span style='font-size:11px;opacity:.62'>S3 호환</span>")]:::data
  NHN["@icon:globe <b>NHN SMS</b><br/><span style='font-size:11px;opacity:.62'>OTP 인증</span>"]:::ext
  SDK["@icon:card <b>TossFrontSDK</b><br/><span style='font-size:11px;opacity:.62'>결제 · 취소</span>"]:::ext

  QR -->|HTTPS · WS| CF
  POS -->|HTTPS · WS| CF
  TERM -->|HTTP 1초 폴링| CF
  CF --> NG --> FL
  FL --> DB
  FL --> OBJ
  FL --> NHN
  FL -. room emit .-> SIO
  FL --- PEND
  SIO -. 실시간 .-> POS
  SIO -. 실시간 .-> QR
  TERM <-->|폴링 · 상태머신| PEND
  TERM -. 결제 실행 .-> SDK`,
        bullets: [
          'Flask Blueprint 8개로 도메인 분리 — auth · store · pos · order · table_order · kds · payment · adm',
          '실시간은 Socket.IO room(pos_group / store_{id}_kds / table_{id}) 단위로 멀티테넌트 격리',
          '토스 단말기만 예외적으로 HTTP 1초 폴링 + in-memory 결제 상태머신으로 분리',
          '데이터는 MySQL 8.0, 이미지는 자체 MinIO(S3 호환) ObjectStore',
        ],
      },
      {
        kind: 'features',
        heading: '핵심 기능',
        bullets: [
          '토스 단말기 결제 연동 — 카드/현금/현금영수증, 결제 후 120초 승인취소, 분할(더치)결제, 결제내역 사후 취소',
          '실시간 주문 파이프라인 — 손님 주문 → POS + 주방 KDS 동시 반영, 조리완료 시 POS 테이블 색 역동기화',
          '주방 디스플레이(KDS) — 스테이션별 메뉴 라우팅, 초 단위 주문 묶음(batch) 그룹핑, 경과시간 색상 경고',
          '고객 QR 셀프 주문 — 메뉴 이미지 캐러셀 + 옵션(필수/선택/다중/수량) + 장바구니 + 주문이력 + 직원호출',
          '캔버스 드래그앤드롭 배치 에디터 — 20×12 그리드에서 테이블/메뉴 드래그·리사이즈·스왑·자동배치',
          '멀티테넌트 매장 관리 — 메뉴 3단 계층 CRUD, 테이블·카테고리, 직원호출, 단말기, KDS 스테이션, 프린터',
          '프린터 연동 — USB serial(vendor/product id, baud rate), 한글 EUC-KR, receiptline 영수증 포맷',
          '인증 — 관리자/매장 이중 로그인, NHN SMS OTP 회원가입·비밀번호 찾기, bcrypt 해시',
        ],
      },
      {
        kind: 'challenge',
        heading: '기술적 도전 — 토스 단말기 결제',
        body: '실시간성이 중요한 결제 단말기 통신에 SocketIO를 쓰려 했으나, 단말기 WebView가 동적 스크립트 로딩과 ws:// mixed content를 차단해 동작 불가.',
        bullets: [
          '해결: 단말기 통신만 HTTP 1초 폴링으로 전환, 서버에 in-memory 상태머신(_pending / _completed / _cash_receipt_cancels) 구현',
          'pending → payment_type_status → approval_status 단계별 폴링 — 단말기가 가져가는 즉시 processing으로 전환해 중복 폴링 방지',
          'order_version 증가로 주문 변경 시 재렌더, POS heartbeat TTL·TerminalToken.last_polled_at로 온라인 판정',
          '승인 직후 120초 승인취소 윈도우(_completed_payments=pending_confirmation → cancel_requested)',
          '결과: 단말기 제약 안에서 카드/현금/취소 전 흐름이 안정 동작 (토스 공식 권장 방식과 일치)',
        ],
      },
      {
        kind: 'diagram',
        heading: '결제 시퀀스 — 토스 단말기 폴링',
        body: `sequenceDiagram
  autonumber
  participant POS as POS 웹
  participant API as Flask
  participant MEM as 결제 상태머신
  participant TERM as 토스 단말기
  participant SDK as TossFrontSDK
  POS->>API: POST /pos/toss/pending (금액·주문)
  API->>MEM: payment_id 생성 · status=pending
  loop 1초 폴링
    TERM->>API: GET /pos/toss/pending
    API->>MEM: 대기 결제 조회 (store_id)
  end
  API-->>TERM: pending · order · payment_id
  Note over MEM: status=processing (중복 폴링 방지)
  TERM->>SDK: requestPayment()
  SDK-->>TERM: 결제 결과
  TERM->>API: POST /pos/toss/result
  API-->>POS: emit toss_payment_result
  Note over POS,TERM: 승인 후 120초 취소 윈도우`,
        bullets: [
          'POS가 결제 생성 → 단말기가 1초 폴링으로 대기 결제 감지 → SDK로 결제 실행',
          '가져가는 즉시 processing 전환으로 중복 폴링 방지, 승인 후 120초 취소 윈도우',
        ],
      },
      {
        kind: 'challenge',
        heading: '기술적 도전 — 정합성 · 부분 실패 복구',
        body: '폴링은 상태를 잡아당기는 방식이라 중복 처리·유실 위험이 있고, 사후 취소 시 DB와 소켓 한쪽만 성공하는 부분 실패가 발생한다.',
        bullets: [
          'DB 저장을 try/except로 감싸 실패해도 소켓 emit은 항상 수행 — 서버 낙관적 emit → 클라 2차 저장 검증 패턴',
          '동일 테이블 중복 접속: in-memory CONNECTED_TABLES로 기존 sid를 force_logout 후 교체(마지막 1대만 활성)',
          '결과: 부분 실패·중복 접속 상황에서도 화면 일관성 유지',
        ],
      },
      {
        kind: 'challenge',
        heading: '캔버스 배치 에디터 (프레임워크 없이)',
        body: '사장님이 실제 매장 배치 그대로 테이블/메뉴를 자유 배치할 수 있어야 해서, 라이브러리 없이 PointerEvent로 드래그앤드롭 에디터를 직접 구현.',
        bullets: [
          '20×12 그리드, PointerEvent 드래그(5px 임계 후 판정), 그리드 스냅 + navigator.vibrate 햅틱',
          '충돌 검사, 코너 핸들 리사이즈(MIN 2×2), 2카드 선택 스왑, 미배치 시 자동 5×4 레이아웃',
          '500ms 디바운스 자동저장(PATCH /store/update_table_layout)',
        ],
      },
      {
        kind: 'features',
        heading: '데이터 모델 설계',
        body: '멀티테넌트(Store 루트) + 메뉴 3단 계층 + 분할결제 + 캔버스 grid 좌표 + KDS 라우팅을 포함한 약 25개 테이블.',
        bullets: [
          '멀티테넌트: 거의 모든 테이블이 store_id 보유, 조회 시 사용자 기준 필터 — ORM 전용으로 SQLi 차단',
          '메뉴 3단 계층(MainCategory → SubCategory → Menu) + 옵션(OptionGroup → Option)',
          '결제: 체크(TablePaymentList) 1건에 분할결제(Payment) N건',
          '이력 보존: TablePaymentList.table_name으로 테이블 삭제 후에도 결제내역 유지',
          'KDS 라우팅: KdsStationMenu(메뉴 M:N), KdsStationStaffCall(직원호출 M:N)',
        ],
      },
      {
        kind: 'erd',
        heading: '데이터 모델 · ERD',
        body: `erDiagram
  User ||--o{ Store : owns
  Store ||--o{ MainCategory : has
  MainCategory ||--o{ SubCategory : has
  SubCategory ||--o{ Menu : contains
  Menu ||--o{ MenuOptionGroup : has
  Store ||--o{ TableCategory : has
  TableCategory ||--o{ Table : has
  Table ||--o{ Order : receives
  Menu ||--o{ Order : "ordered as"
  TableOrderList ||--o{ Order : groups
  Store ||--o{ TablePaymentList : has
  TablePaymentList ||--o{ Payment : "split into"
  Store ||--o{ TerminalToken : issues
  Store ||--o{ KdsStation : has
  KdsStation ||--o{ KdsStationMenu : routes
  Menu ||--o{ KdsStationMenu : "to station"

  User {
    INT(11) id PK
    VARCHAR(45) tel UK
    VARCHAR(100) password
    DATETIME last_logged_at
  }
  Store {
    INT(11) id PK
    INT(11) user_id FK
    VARCHAR(45) store_id UK
    VARCHAR(45) name UK
    BIGINT toss_merchant_id
    VARCHAR(45) terminal_serial
    TEXT receipt_header
  }
  MainCategory {
    INT(11) id PK
    INT(11) store_id FK
    VARCHAR(45) name
  }
  SubCategory {
    INT(11) id PK
    INT(11) main_category_id FK
    VARCHAR(45) name
  }
  Menu {
    INT(11) id PK
    INT(11) store_id FK
    INT(11) menu_category_id FK
    VARCHAR(45) name
    INT(11) price
    TINYINT(1) is_soldout
    INT(11) page
    INT(11) position
  }
  MenuOptionGroup {
    INT(11) id PK
    INT(11) menu_id FK
    VARCHAR(45) option_type
    TINYINT(1) show_price
  }
  TableCategory {
    INT(11) id PK
    INT(11) store_id FK
    VARCHAR(45) name
  }
  Table {
    INT(11) id PK
    INT(11) table_category_id FK
    VARCHAR(45) name
    INT(11) grid_x
    INT(11) grid_y
    INT(11) grid_w
    INT(11) grid_h
  }
  TableOrderList {
    INT(11) id PK
    INT(11) store_id FK
    INT(11) table_id FK
    DATETIME checkingin_at
    DATETIME checkingout_at
  }
  Order {
    INT(11) id PK
    INT(11) order_status_id FK
    INT(11) menu_id FK
    INT(11) table_id FK
    INT(11) order_list_id FK
    TEXT menu_options
    TINYINT(1) is_pos
    DATETIME ordered_at
  }
  TablePaymentList {
    INT(11) id PK
    INT(11) store_id FK
    INT(11) table_id FK
    VARCHAR(45) table_name
    DATETIME first_order_time
    INT(11) discount
    TEXT payment_history
  }
  Payment {
    INT(11) id PK
    INT(11) table_payment_list_id FK
    INT(11) payment_method_id FK
    INT(11) payment_status
    INT(11) payment_amount
    TEXT payment_info
  }
  TerminalToken {
    INT(11) id PK
    VARCHAR(45) token UK
    INT(11) store_id FK
    DATETIME last_polled_at
  }
  KdsStation {
    INT(11) id PK
    INT(11) store_id FK
    VARCHAR(45) name
    TINYINT(1) show_all
  }
  KdsStationMenu {
    INT(11) id PK
    INT(11) kds_station_id FK
    INT(11) menu_id FK
  }`,
        bullets: ['멀티테넌트(Store 루트) · 메뉴 3단 계층 · 분할결제(Payment N) · KDS 라우팅(M:N)'],
      },
      {
        kind: 'steps',
        heading: '배포 · 인프라',
        body: '자체 홈서버 한 대에 dev·stg·prod 3환경을 Docker Compose project 단위로 격리 운영.',
        bullets: [
          'git push → deploy.sh가 SSH로 git pull + docker compose up --build (Docker Hub 불필요, 서버 직접 빌드)',
          '공용 nginx(external network)가 도메인별 분기 + Cloudflare origin 인증서 + WebSocket 업그레이드 프록시',
          'entrypoint가 alembic_version 유무로 신규/기존 DB 판별 → 자동 마이그레이션 + order_status 시드',
          'prod는 gunicorn eventlet 워커, dev는 코드 볼륨 마운트 hot reload',
        ],
      },
      {
        kind: 'default',
        heading: '회고 · 다시 만든다면',
        bullets: [
          'in-memory 결제 상태(_pending_payments)는 단일 워커에 강결합 → Redis 등 외부 스토어로 분리해 수평확장·재시작 내성 확보',
          '65KB 단일 JS(payment.js)를 컴포넌트 기반으로 분할',
          '관측성(구조적 로깅·지표·알림)과 자동화 테스트 도입',
          'config.py의 시크릿 기본값 폴백 제거(env 강제)',
        ],
      },
    ],
  },
  {
    slug: 'heyvoca',
    title: 'HeyVoca',
    titleKr: '헤이보카',
    tag: '앱·웹 · 학습',
    year: '2025 — 진행 중',
    role: '1인 풀스택',
    url: 'heyvoca.ghmate.com',
    featured: true,
    summary: 'FSRS-5 간격 반복 기반의 개인화 영어 단어 학습. iOS·Android·웹 동시 운영, 약 63,600줄 규모.',
    metrics: [
      { value: '601', label: '커밋' },
      { value: '63.6K', label: '라인 오브 코드' },
      { value: '1,000', label: 'DAU 수용 설계' },
    ],
    stack: ['React', 'React Native', 'Python', 'Flask', 'MySQL', 'Redis', 'MinIO', 'Docker', 'Firebase', 'Astro'],
    sections: [
      { heading: '알고리즘', body: 'FSRS-5 간격 반복 알고리즘을 외부 라이브러리 없이 구현하고, 난이도·안정성·회수율 모델에 soft lapse 보정을 더했습니다.' },
      { heading: 'OCR', body: '온디바이스 ML Kit OCR로 사진 한 장에서 단어장을 자동 생성합니다. 서버 비용이 들지 않고 오프라인에서도 동작합니다.' },
      { heading: '풀스택', body: 'React Native(iOS/Android) + React 웹 + Astro 랜딩 + Flask 백엔드 + 어드민까지 전 스택을 맡았습니다.' },
      { heading: 'DB 설계', body: '사용자·사전을 2-schema로 분리하고, cross-schema FK 없이 viewonly relationship 패턴을 적용했습니다.' },
      { heading: '운영', body: 'Sentry 에러 트래킹, APScheduler 기반 FCM 푸시, Edge TTS 캐싱 아키텍처를 구축했습니다.' },
    ],
  },
  {
    slug: 'ghc',
    title: 'GHC',
    titleKr: '멀티카메라 라이브',
    tag: '실시간 · 미디어',
    year: '2026 — 운영 중',
    role: '풀스택 + 네이티브',
    url: 'longdcam-front.ghmate.com',
    featured: true,
    summary: '여러 기기를 독립 카메라로 등록해 멀티앵글로 송출하는 셀프호스팅 화상회의·라이브 서비스.',
    metrics: [
      { value: '3', label: 'OS 네이티브 Mac/Win/Web' },
      { value: '0', label: '외부 클라우드 비용' },
      { value: 'SFU', label: '자가호스팅 미디어' },
    ],
    stack: ['TypeScript', 'React', 'Node.js', 'Express', 'Socket.IO', 'LiveKit', 'WebRTC', 'Electron', 'Swift', 'C++', 'Docker'],
    sections: [
      { heading: '미디어 스택', body: 'LiveKit SFU 자가호스팅 + coturn TURN + RTMP Ingress까지 실시간 미디어 스택 전체를 운영합니다.' },
      { heading: '네이티브 캡처', body: 'Mac(Swift/ScreenCaptureKit/CoreAudio)과 Windows(C++/WinRT WGC + C#/.NET8 WebView2) 캡처 모듈을 함께 개발했습니다.' },
      { heading: '단일 코어', body: '하나의 React PWA와 공통 네이티브 브리지(window.longdcamNative)로 웹·Mac·Windows를 운영합니다.' },
      { heading: '자가호스팅', body: 'SFU·TURN·Ingress·DB·오브젝트 스토리지를 외부 클라우드 비용 없이 홈서버에 호스팅합니다.' },
    ],
  },
  {
    slug: 'openday',
    title: 'Openday',
    titleKr: '오픈데이',
    tag: '웹 · 팀 리드',
    year: '2023 — 2024',
    role: '팀장 · 2인',
    url: '',
    featured: false,
    summary: '2인 팀을 이끌어 기획부터 런칭까지 맡은 모바일 청첩장 서비스.',
    metrics: [
      { value: '2', label: '팀 규모' },
      { value: '풀사이클', label: '기획→런칭 리드' },
    ],
    stack: ['React', 'Node.js', 'MySQL'],
    sections: [{ heading: '역할', body: '기획·개발·런칭까지 팀장으로 리드하며 작은 팀이 빠르게 제품을 출시하는 흐름을 만들었습니다.' }],
  },
  {
    slug: 'skyswarm',
    title: 'SkySwarm',
    titleKr: '스카이스웜',
    tag: 'SaaS · 그래픽',
    year: '2024 — 운영 중',
    role: '팀 프로젝트',
    url: '',
    featured: false,
    summary: '스크립트 한 줄로 임베드하는 드론쇼 스타일 도트 그래픽 SaaS.',
    metrics: [
      { value: '1-tag', label: '임베드 방식' },
      { value: '운영 중', label: '서비스 상태' },
    ],
    stack: ['JavaScript', 'Canvas', 'Node.js'],
    sections: [{ heading: '개념', body: '스크립트 한 줄을 삽입하면 어떤 페이지에서도 드론쇼 스타일 도트 그래픽을 띄울 수 있습니다.' }],
  },
  {
    slug: 'codingpt',
    title: 'CodingPT',
    titleKr: '코딩피티',
    tag: '교육 · 앱',
    year: '2024 — 2025',
    role: '팀 프로젝트',
    url: '',
    featured: false,
    summary: '레슨용 캐싱 코드 실행 엔진을 갖춘 모바일 코딩 교육. 예비창업패키지 합격.',
    metrics: [
      { value: '합격', label: '예비창업패키지' },
      { value: '모바일', label: '레슨 코드 실행' },
    ],
    stack: ['React Native', 'Node.js', 'Docker'],
    sections: [{ heading: '핵심', body: '레슨 단위로 코드 실행 결과를 캐싱해 모바일에서도 빠르게 동작하는 코딩 교육 경험을 설계했습니다.' }],
  },
]

const experienceRows = [
  {
    company: '슬기로운 사업',
    role: '대표 / 개인사업자',
    period: '2026.06 —',
    length: '진행 중',
    current: true,
    context: '개인 프로젝트와 사업화 — 발굴부터 채용·개발·사업화까지',
    points: [
      'OrderAndGo·HeyVoca·GHC 등 실서비스를 설계·개발·운영',
      '사이드 프로젝트 팀을 꾸려 복수의 서비스를 런칭',
      '기술과 비즈니스를 함께 보며 제품을 끝까지 책임',
    ],
    stack: ['풀스택', '제품 기획', '팀 리드', '사업화'],
  },
  {
    company: '프라이머스 (주)',
    role: '개발팀장 / 초기멤버',
    period: '2023.06 — 2026.02',
    length: '2년 9개월',
    current: false,
    context: '에듀테크 스타트업 · PDF 자동채점 학습 플랫폼 EveryStudy',
    points: [
      '프론트엔드·모바일 개발 방향 결정 및 팀원 작업 조율',
      '웹 프론트엔드(React+TypeScript) 전면 리라이트 주도 — 레거시 jQuery 멀티페이지를 컴포넌트 기반 SPA로 전환 (커밋 1,603)',
      'iOS 네이티브 학습 모듈(SwiftUI) 신규 개발, JS Bridge 기반 웹·앱 공통 인터페이스 구현',
      'PDF 특징점 기반 자동채점 시스템 프론트엔드 개발·고도화',
      'WebView 하이브리드 구조 설계 — 로컬 HTTP 서버로 오프라인 PDF 학습 구현',
    ],
    stack: ['React', 'TypeScript', 'Swift', 'Python', 'FastAPI', 'AWS Lambda', 'MySQL', 'S3', 'CloudFront'],
  },
  {
    company: '(주)히어로웍스',
    role: '프론트엔드 개발자',
    period: '2022.04 — 2023.06',
    length: '1년 2개월',
    current: false,
    context: '숙박 OTA 가격 최적화 SaaS DatAmenity · 올해의 히어로 수상',
    points: [
      '인수인계 없이 레거시 SSR 코드베이스를 분석해 CSR로 점진적 전환',
      '외부 라이브러리 없이 Vanilla HTML/CSS/JS로 유지보수·기능 개발',
      'AI 기반 OTA 리뷰 자동 분석·댓글 서비스 프론트엔드 참여',
    ],
    stack: ['HTML', 'CSS', 'JavaScript', 'jQuery', 'Linux', 'Python'],
  },
]

async function main() {
  // 기존 동일 username 프로필 제거(프로젝트·경력은 cascade).
  const existing = await db
    .select({ id: schema.profiles.id })
    .from(schema.profiles)
    .where(eq(schema.profiles.username, USERNAME))
  for (const row of existing) {
    await db.delete(schema.profiles).where(eq(schema.profiles.id, row.id))
  }

  const [inserted] = await db.insert(schema.profiles).values(profile).returning({ id: schema.profiles.id })
  const profileId = inserted.id
  console.log(`[seed] profile #${profileId} (${USERNAME}) 생성`)

  await db.insert(schema.projects).values(
    projectRows.map((p, i) => ({
      profileId,
      slug: p.slug,
      title: p.title,
      titleKr: p.titleKr,
      tag: p.tag,
      year: p.year,
      role: p.role,
      url: p.url || null,
      summary: p.summary,
      metrics: p.metrics,
      sections: p.sections,
      stack: p.stack,
      featured: p.featured,
      order: i,
      status: 'published' as const,
      publishedAt: new Date(),
    })),
  )
  console.log(`[seed] projects ${projectRows.length}건 생성`)

  await db.insert(schema.experiences).values(
    experienceRows.map((e, i) => ({
      profileId,
      company: e.company,
      role: e.role,
      period: e.period,
      length: e.length,
      current: e.current,
      context: e.context,
      points: e.points,
      stack: e.stack,
      order: i,
    })),
  )
  console.log(`[seed] experiences ${experienceRows.length}건 생성`)
  console.log(`[seed] 완료 → /${USERNAME}`)
  sqlite.close()
}

// 직접 실행할 때만 시드(파괴적: 프로필 재생성). import 시에는 데이터(projectRows)만 노출.
if (process.argv[1] && /seed-portfolio\.ts$/.test(process.argv[1])) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
