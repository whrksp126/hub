/**
 * 점검 보고서 결과를 딥다이브(notes) 본문에 반영한다.
 * content JSON 을 파싱해 모든 문자열 값에 대해 치환하므로 코드 블록의 줄바꿈도 안전하게 다룬다.
 * 일부 본문이 줄바꿈 방지 공백(U+00A0)을 써서, 공백은 둘 다 매칭한다.
 */
const Database = require('better-sqlite3')
const db = new Database(process.env.DATABASE_PATH || './data/hub.db')
const now = Math.floor(Date.now() / 1000)

const asPattern = (t) =>
  new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[ \u00a0]/g, '[ \\u00a0]'), 'g')

const PLAN = {
  // ══════════════════════════════════════════════ HeyVoca
  'fsrs-migration': [
    // rate 는 '깎는 비율'이 아니라 '남기는 하한'이라, 정답률이 높으면 오히려 더 깎인다
    ['최근 정답률이 높은 사용자는 실수 한 번에 급락하지 않게, 감소율을 절반으로 줄이고 **표준값과 소프트값 중 큰 쪽**을 채택한다.',
     '오답 한 번에 기억 안정도가 이전의 30%(연속 오답은 10%) 아래로 떨어지지 않도록 하한을 두고, **표준값과 하한 중 큰 쪽**을 채택한다.'],
    ['rate *= 0.5                                   # 잘하던 사용자는 덜 깎기',
     'rate *= 0.5    # 의도는 "덜 깎기"였지만 rate 는 남기는 하한이라 실제로는 더 깎인다 (수정 대상)'],
    // learning 상태는 2026-07-15 이후 생기지 않는다
    ['state            new | learning | review | relearning', 'state            new | review | relearning'],
    // 사용자 단어 상태 컬럼은 그대로지만, 학습 로그 테이블은 새로 만들었다
    ['SQL 컬럼 하나 추가하지 않고', '단어 상태 컬럼은 그대로 두고'],
    // 715건은 로컬/dev 산출물 보고서에만 있는 수치
    ['운영 중인 715건의 학습 데이터를', '이미 쌓인 학습 데이터를'],
    ['715건 완료(운영 문서 기록)', '읽을 때와 서버 기동 때 새 형식으로 자동 변환'],
  ],

  'dict-schema-split': [
    // 부팅 시 자동 동기화는 2026-09-04 에 제거됐다 (재시작만으로 사전이 통째로 바뀌는 위험)
    ['python3 /app/scripts/dict_sync.py || exit 1           # 1. 사전 자동 동기화(뒤처진 경우만)\n', ''],
    ['**런타임 자동 동기화**: 백엔드 컨테이너가 뜰 때마다 `dict_sync.py`가 허브를 확인해 자기 환경이 뒤처졌',
     '**적용 시점은 사람이 정한다**: 처음엔 컨테이너가 뜰 때마다 자동으로 맞췄지만, 재시작만으로 사전이 통째로 바뀌는 위험 때문에 관리자 화면에서 눌러야 적용되도록 되돌렸'],
    ['이제 `docker compose up --build -d`만 하면 schema 2개 자동 생성 + `dict_sync.py`가 최신 사전을 자동으로 받아온다. **수동 import 단계 자체가 사라졌다.**',
     '이제 `docker compose up --build -d`로 schema 2개가 자동 생성되고, 사전은 관리자 화면에서 최신 버전을 한 번 눌러 받는다. **덤프 파일을 주고받는 단계가 사라졌다.**'],
    ['다른 모든 환경이 다음 재시작 때 자동으로 따라잡는다', '다른 환경은 관리자 화면에서 그 버전을 골라 한 번에 따라잡는다'],
    ['local/dev/stg/prod 4환경', '당시 local/dev/stg/prod 4환경'],
  ],

  'login-session-webview': [
    // HttpOnly 인 것은 refresh_token 뿐이다
    ['실제 인증 상태(access/refresh token)는 **웹이 관리하고 백엔드와 HttpOnly 쿠키로 통신**한다',
     '실제 인증 상태는 **웹이 관리한다.** refresh token 은 HttpOnly 쿠키로 오가고, access token 은 웹이 들고 있다가 요청 헤더에 실어 보낸다'],
    // 더 중요한 한계: 로그아웃해도 기존 refresh 가 90일간 유효하다
    ['현재 슬라이딩 회전은 구현이 단순하지만 **"탈취된 refresh token도 계속 회전되며 생존"하는 트레이드오프**가 있다(이전 토큰을 명시적으로 무효화하지 않는 단순 모델).',
     '지금 refresh 는 서명과 만료만 검사한다. DB에 저장해 둔 최신 토큰과 대조하지 않아서, **탈취된 토큰은 물론 로그아웃한 뒤에 남은 토큰도 90일간 계속 회전된다.**'],
  ],

  // ══════════════════════════════════════════════ OrderAndGo
  'realtime-sync': [
    // 새 주문 알림은 모든 매장 POS 가 함께 쓰는 방으로 나간다
    ['**테넌트 격리.** 룸 이름에 store_id를 박아 A매장 주문이 B매장에 새지 않는다.',
     '**테넌트 격리.** 주방 화면은 매장별 방으로 나눴다. 다만 POS 알림은 아직 공용 방이라, 매장이 늘면 매장별 방으로 옮겨야 한다(현재 한계).'],
    ['**가짜 주문 차단.** 서명 쿠키 + 지오펜스 + (옵션)착석 게이트.',
     '**가짜 주문 차단.** 서명 쿠키 + 매장 반경 확인 + (옵션)착석 게이트. 위치 위조까지 막지는 못한다.'],
    [' (`qr-to-pos.mp4`는 손님 폰 QR 주문이 매장 POS 홀 현황에 즉시 반영되는 버전)', ''],
  ],

  multitenant: [
    ['실시간(Socket.IO)도 **룸 이름에 테넌트를 박아** 격리한다: `store_{id}_kds`, `terminal_{store_id}`, `store_history_{store_id}`.',
     '실시간(Socket.IO)도 주방·결제이력은 **매장 id가 들어간 방**을 쓴다: `store_{id}_kds`, `terminal_{store_id}`, `store_history_{store_id}`. 다만 방에 들어갈 때 매장 검증과, POS 공용 방 분리는 아직 남은 과제다.'],
    ['실제로 일부 읽기 엔드포인트는 클라이언트가 준 부모 id(예: `main_category_id`)를 재검증 없이 신뢰한다.',
     '실제로 일부 API는 로그인·소유권 확인이 아예 빠져 있다 — 읽기뿐 아니라 쓰기도 그렇다.'],
  ],

  'canvas-editor': [
    // 드래그 중 dataset 을 덮어써서 '되돌림'이 실제로는 동작하지 않는다
    ['겹치면 **직전 위치로 되돌리고 흔들어서**(shake) 알린다. 밀어내기(reflow)를 안 쓴 건, 그게 훨씬 단순하고 결과가 결정적이기 때문이다.',
     '겹치면 **직전 위치로 되돌리고 흔들어서**(0.3초) 알리도록 설계했다. 밀어내기(reflow)를 안 쓴 건 그게 훨씬 단순하고 결과가 결정적이기 때문이다. — **다만 지금은 동작하지 않는다.** 드래그 중 좌표를 실시간으로 갱신하는 최적화를 넣으면서 "직전 위치"로 읽는 값까지 같이 덮어써 버렸다. 크기 조절 쪽은 시작 크기를 따로 보관해 정상 동작한다.'],
    ['겹치면 직전 위치로 되돌아간다.', '겹치면 빨간 테두리로 알린다.'],
    ['셀 스냅·겹침 되돌림·자동저장·터치 지원까지', '셀 스냅·자동저장·크기 조절·터치 지원까지'],
    // 같은 페이지가 SortableJS 를 CDN 으로 불러 구역 순서 모달에 쓴다
    ['마우스·터치 통합, 스냅·겹침 되돌림·크기조절·탭스왑·자동저장까지 **라이브러리 0개**로 구현. 번들 없음, 빌드 스텝 없음.',
     '마우스·터치 통합, 스냅·크기조절·탭스왑·자동저장까지 **캔버스 드래그는 라이브러리 없이** 구현. 번들 없음, 빌드 스텝 없음.'],
    ['격자 배경도 CSS `background-size` 타일 하나로 그린다(캔버스는 `position:relative`, 카드는 `position:absolute`).',
     '(캔버스는 `position:relative`, 카드는 `position:absolute`.)'],
    ['편집한 배치가 **POS 뷰에 픽셀 단위로 똑같이** 재현.', '편집한 배치가 **POS 뷰에 같은 비율로 똑같이** 재현.'],
    ['편집 결과가 POS 뷰에 **픽셀 단위로 동일 재현**(같은 좌표 계약).', '편집 결과가 POS 뷰에 **같은 비율로 동일 재현**(같은 좌표 계약).'],
    ['서버는 그냥 4개 격자 컬럼을 row별로 upsert한다.', '서버는 그냥 4개 격자 컬럼을 row별로 update한다.'],
  ],

  'payment-polling': [
    ['# 진행 중 결제 (payment_id -> 상태). 단말기 토큰으로만 접근 가능.', '# 진행 중 결제 (payment_id -> 상태)'],
  ],

  // ══════════════════════════════════════════════ CodingPT
  'codingpt-byo-agent-approval': [
    // 실제 경로는 헤드리스 -p + MCP 가 아니라 대화형 TUI + PermissionRequest 훅이다
    ['2단계 — 승인 중계: MCP 도구 하나로 질문을 가로챈다', '2단계 — 승인 중계: 공식 PermissionRequest 훅으로 질문을 가로챈다'],
    ['CLI에는 "권한을 물어볼 때 이 도구를 호출해라"는 옵션이 있다. 그래서 **stdio MCP 서버**를 하나 동봉하고 그걸 지정했다. 이 서버가 하는 일은 단 하나 — 질문을 받아 데몬에게 넘기고, 데몬의 대답을 돌려주는 것.',
     'CLI에는 권한을 물을 때 외부 명령을 부르는 **훅**이 있다. 데몬은 PC 터미널에서 사용자의 CLI를 평소처럼 대화형으로 띄우고, 실행 인자로 이 훅만 얹는다. 훅이 하는 일은 단 하나 — 질문을 받아 데몬에게 넘기고, 데몬의 대답을 돌려주는 것. (초기 설계는 헤드리스 실행 + 중계 MCP였고, 그 경로는 레거시로만 남아 있다.)'],
    ['승인 질문만 중계 MCP → 데몬 → 릴레이 → 폰 카드로 이동하고, 결정이 같은 경로로 돌아간다.',
     '승인 질문만 훅 → 데몬 → 릴레이 → 폰 카드로 이동하고, 결정이 같은 경로로 돌아간다.'],
    // 훅 경로는 실패 시 아무것도 출력하지 않아 PC TUI 질문으로 되돌아간다
    ['**실패는 조용하면 안 된다.** 승인 채널이 죽었을 때 "그냥 통과"는 최악이다. 반드시 **거절 쪽으로 닫힌다.**',
     '**실패는 조용히 통과시키지 않는다.** 승인 채널이 죽으면 자동 허용 없이 **PC 터미널의 원래 질문으로 되돌아간다.**'],
  ],

  'codingpt-daemon-sidecar': [
    ['앱이 스스로 업데이트를 확인하고, 사용자가 누르면 적용된다. 데몬은 앱과 같은 세대로 유지된다.',
     '업데이트는 미리 받아 두고 아무도 쓰지 않는 순간에 자동 적용된다. 쓰는 중이면 묻고, 폰에서도 적용할 수 있다. 데몬은 앱과 같은 세대로 유지된다.'],
    ['(작성 시점 0.1.262)', '(2026-09 기준 0.1.367)'],
  ],

  'codingpt-outbound-relay': [
    // 릴레이에 흐름 제어가 없다
    ['백프레셔까지 공짜로 얻었다', '채널끼리 서로 막지 않는 구조를 얻었다'],
    ['파일 RPC는 자기 소켓에서 평온하게', '파일 RPC는 제어 채널에서 평온하게'],
    // 지금 온보딩에는 연동 코드 입력 화면이 없다
    ['앱 설치 → 연동 코드 입력 → 끝', 'PC 앱 설치 → 브라우저 로그인 → 끝'],
  ],

  'codingpt-pivot-gating': [
    ['환경변수 하나로 부활', '클라우드 러너·과금은 환경변수 하나로, 웹 바이브코딩은 커밋 하나를 되돌리면 부활'],
    ['지금은 판매만 닫는다', '지금은 사용량 과금만 닫는다'],
  ],

  // ══════════════════════════════════════════════ GHC
  'ghc-selfhost-seven-containers': [
    ['컨테이너 7개', '컨테이너 8개'],
    ['7개 컨테이너', '8개 컨테이너'],
    ['비트레이트를 2.0 Mbps로 낮출 이유도', '회선에 맞춰 동시 방송 수를 제한할 이유도'],
    ['coturn은 40000부터 위로 할당하므로 40100까지 도달하는 일이 사실상 없어',
     'coturn은 40000~40099로 범위를 잘라 40100을 LiveKit 전용으로 비워 뒀고'],
    ['기기 P2P 프리뷰의 NAT 통과', '기기 P2P 프리뷰와 방 연결의 NAT 우회'],
  ],
  'ghc-home-server-capacity': [
    ['7개 컨테이너', '8개 컨테이너'],
    ['업링크 실측 87Mbps', '업링크 실측 87Mbps(2026-08 측정, 재측정 시 71~79Mbps)'],
  ],
  'ghc-p2p-preview-vs-sfu': [
    ['7개 컨테이너', '8개 컨테이너'],
    ['coturn은 SFU 경로를 위해 있는 게 아니라 오직 이 P2P 프리뷰를 위해 존재하는 컨테이너다',
     'coturn은 기기 P2P 프리뷰를 위해 들였고, 이후 UDP가 막힌 망에서 방 연결의 우회로도 맡게 됐다'],
  ],
  'ghc-native-capture-bridge': [
    ['LIVE 클릭 → 시청자 첫 프레임 1.99 s', 'LIVE 클릭 → 시청자 첫 프레임 1.99 s (2026-08-14 측정, HLS 버퍼 도입 전)'],
    ['LIVE를 누른 뒤 1.99초 만에 타일이 뜬다', 'LIVE를 누르면 시청자 방에 타일이 뜬다'],
    ['1.99초 뒤 시청자 방에 타일이 뜬다', 'LIVE를 누르면 시청자 방에 타일이 뜬다'],
    ['10 Mbps', '4.5 Mbps'],
    ['헬퍼 창 1600×980', '헬퍼 창 폭 1600'],
    ['툴바 높이(40 pt)', '주소창·탭 높이'],
    ['컬러스페이스(BT.601/709) 태그', '색공간(BT.709) 변환'],
    ['웹 UI 재사용률 100%', '데스크탑 전용 화면 없음'],
    ['382 MB', '약 400MB'],
    ['macOS 쪽은 98 MB', 'macOS 쪽은 약 99MB'],
    ['macOS GHC.dmg 93 MB', 'macOS GHC.dmg 약 99MB'],
    ['Windows GHC-Setup.exe 194 MB', 'Windows GHC-Setup.exe 약 400MB'],
    ['macOS 0.1.4 ', 'macOS 0.1.33 '],
    ['Windows 0.1.1 (구 피드에만 존재)', 'Windows 0.1.4'],
  ],
  'ghc-mediasoup-to-livekit': [
    ['지금 백엔드가 미디어에 대해 하는 일은 토큰 한 장 발급이 전부다',
     '미디어 시그널링 이벤트는 전부 사라졌고, 백엔드에 남은 건 입장 토큰 발급과 방송 입력(Ingress) 관리뿐이다'],
    ['남은 건 토큰 발급 함수 하나', '남은 건 토큰 발급과 방송 입력 관리'],
  ],

  // ══════════════════════════════════════════════ Lambent
  'lambent-dsp-retune': [
    ['그리고 테스트 116개가 전부 통과했다', '그리고 테스트는 하나도 실패하지 않았다'],
    ['테스트 116개', '당시 테스트 116개(지금은 147개)'],
  ],
  'lambent-system-audio-capture': [
    ['Lambent 자신도 소리를 낼 수 있습니다(온보딩의 테스트 톤)',
     '탭은 자기 앱이 낸 소리까지 같이 듣는다(설계 단계에서 확인한 조건)'],
    ['권한은 온보딩에서 한 번, 자체 테스트 톤으로 확인한다',
     '권한은 첫 캡처 때 macOS가 묻고, 온보딩은 무엇을 왜 듣는지 설명한다'],
    ['온보딩의 테스트 톤은 같은 탭으로 권한을 1회 확인한다', '온보딩은 무엇을 왜 듣는지 설명만 한다'],
    ['권한 감시 상태기계 폐기 → 온보딩 1회 확인으로 대체', '권한 감시 상태기계 폐기(대체 확인 절차는 미구현)'],
    ['100~500배', '약 90~500배'],
    ['레이트 매칭 코드 0줄', '레이트 변환 코드 0줄'],
  ],
  'lambent-spike-gate': [
    ['온보딩 1회 확인으로 대체', '감시자 폐기(대체 확인 절차는 미구현)'],
  ],
  'lambent-sealed-premium': [
    ['licenses 테이블에는 license_key 당 활성 행 1개라는 유니크 제약이 있습니다',
     'activations 테이블의 license_key 유니크 인덱스가 "기기 1대" 규칙 자체입니다'],
  ],

  // ══════════════════════════════════════════════ OpenDay
  'openday-json-module-editor': [
    ['20개 기능', '20여 종 섹션'],
    ['20개 이상의 선택 기능', '20여 종의 섹션'],
    ['유연한 저장 형식 위에 TypeScript union, 기본값, 런타임 검증을 함께 두어야 한다.',
     '지금은 TypeScript 타입과 기본값으로 계약을 지키고 있고, 모듈별 서버 검증은 다음 과제다.'],
  ],
  'openday-publish-share-engagement': [
    ['공개 입력과 소유자 조회의 권한 경계도 분리했고',
     '참석 응답은 누구나 남기되 조회는 주최자만 가능하도록 나눴고(방명록 조회 보호는 남은 과제)'],
  ],
}

let totalHit = 0, totalMiss = 0
for (const [slug, pairs] of Object.entries(PLAN)) {
  const row = db.prepare('select id, title, content from notes where slug=?').get(slug)
  if (!row) { console.log(`[skip] ${slug} 없음`); continue }

  let doc = JSON.parse(row.content)
  let title = row.title
  const hitSet = new Set()

  const walk = (node) => {
    if (Array.isArray(node)) return node.map(walk)
    if (node && typeof node === 'object') {
      const out = {}
      for (const [k, v] of Object.entries(node)) out[k] = walk(v)
      return out
    }
    if (typeof node === 'string') {
      let s = node
      for (const [oldS, newS] of pairs) {
        const re = asPattern(oldS)
        if (re.test(s)) { re.lastIndex = 0; s = s.replace(re, () => newS); hitSet.add(oldS) }
      }
      return s
    }
    return node
  }
  doc = walk(doc)

  // 제목에도 같은 치환을 적용한다
  for (const [oldS, newS] of pairs) {
    const re = asPattern(oldS)
    if (re.test(title)) { re.lastIndex = 0; title = title.replace(re, () => newS); hitSet.add(oldS) }
  }

  db.prepare('update notes set content=?, title=?, updated_at=? where id=?')
    .run(JSON.stringify(doc), title, now, row.id)

  const miss = pairs.filter(([o]) => !hitSet.has(o)).map(([o]) => o.slice(0, 34))
  totalHit += hitSet.size; totalMiss += miss.length
  console.log(`[${slug}] ${hitSet.size}/${pairs.length}` + (miss.length ? `\n   └ 못 찾음: ${miss.join(' / ')}` : ''))
}
console.log(`\n[done] 치환 ${totalHit}건 · 미적용 ${totalMiss}건`)
db.close()
