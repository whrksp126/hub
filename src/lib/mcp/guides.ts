// HubGmate 공식 저작 스펙 — MCP resources로 배포되어 프로젝트 에이전트가 참고한다.
// 여기 규칙은 실제 렌더러(mermaid-diagram.tsx / erd-diagram.tsx / note-blocks / project-section-block)와
// 스키마(ProjectSection / NoteBlock / Profile)를 그대로 반영한다. 렌더 규칙이 바뀌면 여기도 갱신.

export type Guide = { slug: string; uri: string; title: string; body: string }

const OVERVIEW = `# HubGmate 저작 개요

당신은 이 저장소를 담당하는 에이전트다. 레포를 분석해 HubGmate에 포트폴리오를 **자율 발행**한다.
품질 높은 결과를 위해 **작성 전에 아래 스펙 리소스를 읽어라**:

- hubgmate://guide/case-study — 프로젝트(케이스 스터디) 구조·섹션 kind
- hubgmate://guide/diagrams — 아키텍처/흐름 다이어그램(mermaid) 규칙
- hubgmate://guide/erd — 데이터 모델 ERD 규칙
- hubgmate://guide/deep-dive — 기술 글 블록 규칙
- hubgmate://guide/media — 이미지/영상/썸네일/로고 규칙
- hubgmate://guide/style — 디자인 토큰·톤·정직성

## 발행 순서
1. whoami → 프로필 상태 확인
2. list_content → 기존 항목 확인(멱등)
3. ensure_profile → 프로필(신규 draft)
4. upload_media → 이미지/영상 올려 id 확보 (픽셀 생성은 당신 몫)
5. upsert_project / upsert_experience / upsert_deep_dive → 발행(draft)

## 원칙
- 모든 발행물은 **draft**. 소유자가 /studio에서 검토·공개한다.
- **정직성 최우선**: 실제 코드/커밋/README에서 확인되는 것만. 역할·성과·스택 추정/과장 금지.
- 멱등: 같은 slug로 다시 upsert하면 갱신. 중복 생성하지 마라.
- 텍스트로 표현 가능한 시각화(다이어그램·ERD)는 **적극 사용** — 완성도를 크게 높인다.`

const CASE_STUDY = `# 케이스 스터디(upsert_project) 스펙

프로젝트 상세 = "문제 → 해결 → 결과" 서사. 필드:
- title / titleKr, tag(분류 예 "SaaS · 주문/결제"), year(예 "2023 — 운영 중"), role(실제 역할만), url(라이브)
- summary(2~3문장), stack(실제 기술만), metrics([{value:"40%", label:"응답시간 단축"}] — 근거 있을 때만)
- coverId(상단 배너 겸 목록 썸네일), logoId(제목 옆 브랜드 로고), featured(홈 노출)
- sections[]: 각 { heading, body?, bullets?, kind?, media? }

## 섹션 kind (시각 유형 — 같은 데이터를 종류별로 다르게 렌더)
| kind | 용도 | 입력 |
|---|---|---|
| lead | 도입/개요 | 큰 문단(body) |
| default | 일반 텍스트 섹션 | body + bullets |
| features | 핵심 기능 | bullets 위주 |
| challenge | 문제/제약/난관 | body + bullets |
| steps / timeline | 진행 흐름/단계 | bullets 순서 |
| diagram | 아키텍처·흐름도 | body=mermaid (→ guide/diagrams) |
| erd | 데이터 모델 | body=erDiagram (→ guide/erd) |
| gallery | 스크린샷/영상 | media[] |
| specs | 스펙 태그 | bullets |

## media (섹션/갤러리 첨부)
SectionMedia = { kind:'image'|'video'|'embed', mediaId?, url?, caption?, poster? }
- image/video: upload_media가 준 mediaId
- embed: 외부 URL(YouTube/Vimeo) → url

## 권장
- 최소 lead(개요) → challenge(문제) → 해결 흐름(diagram/steps) → features → (erd/gallery/specs).
- 아키텍처가 있으면 diagram, DB가 있으면 erd를 **꼭** 넣어라 — 텍스트라 비용 0, 완성도 최고.
- 데이터 모델은 erd(시각) + features/specs(텍스트) 병행 → 크롤러/AEO에도 유리.`

const DIAGRAMS = `# 다이어그램 스펙 — 섹션 kind \`diagram\`

body에 **mermaid** \`graph\`/\`flowchart\`/\`sequenceDiagram\`을 쓴다. 다크 테마가 자동 적용된다.
bullets[]는 다이어그램 하단 캡션으로 렌더된다.

## 확장 토큰 (HubGmate 전용)
- \`@accent\` → 프로필 강조색(hex)으로 치환. classDef의 stroke 등에 써서 테마와 통일.
- \`@icon:<name>\` → 노드 라벨 안에 인라인 lucide 라인 아이콘(SVG). **이모지 금지, 아이콘만.**
  - 사용 가능 name(11): smartphone monitor card cloud server database radio box shield zap globe
  - 속성값은 작은따옴표(mermaid 라벨 호환).

## 예 (아키텍처)
\`\`\`
graph TD
  classDef app fill:#2c1710,stroke:@accent,stroke-width:2px,color:#ffd9c9
  QR["@icon:smartphone 손님 휴대폰"] --> NGINX["@icon:shield nginx"]
  NGINX --> FLASK["@icon:server Flask"]:::app
  FLASK --> DB[("@icon:database MySQL")]
\`\`\`

시퀀스는 \`sequenceDiagram ...\` 그대로 쓰면 다크 테마가 자동 적용된다.

## 차트/그래프 (mermaid 11)
데이터 비교/추세는 별도 이미지 없이 mermaid 차트로 — 같은 \`diagram\` kind, 다크 테마 자동.
- 비율: \`pie\`
\`\`\`
pie title 트래픽 소스
  "직접" : 45
  "검색" : 30
  "추천" : 25
\`\`\`
- 추세/막대: \`xychart-beta\`
\`\`\`
xychart-beta
  title "월별 MAU"
  x-axis [1월, 2월, 3월, 4월]
  y-axis "명" 0 --> 1000
  bar [120, 340, 610, 920]
\`\`\`

## 규칙
- 이모지를 노드/라벨/관계 어디에도 쓰지 마라. 아이콘은 @icon:만.
- 노드 라벨은 한국어 OK. 흐름은 좌→우 또는 위→아래로 읽히게.
- 편집 미리보기와 공개 렌더가 동일 텍스트로 그려진다(편집=결과).`

const ERD = `# ERD 스펙 — 섹션 kind \`erd\`

body에 mermaid \`erDiagram\` 문법을 쓰면 **MySQL Workbench 룩**(헤더바+테이블 아이콘, 컬럼별 키
아이콘, Indexes 풋터, crow's-foot 관계선)으로 렌더된다(React Flow, dagre 자동 배치, 팬/줌).

## 문법
- 관계: \`EntityA <card>--<card> EntityB : label\`
  - 카디널리티 토큰: \`||\`(정확히 1) · \`|o\`/\`o|\`(0 또는 1) · \`}o\`/\`o{\`(0 이상) · \`}|\`/\`|{\`(1 이상)
- 엔티티 컬럼: \`Entity { ... }\` 블록 안에 한 줄당 \`TYPE name [KEY]\`
  - KEY ∈ PK(금색 키) · FK(빨강 다이아) · UK(파랑 다이아) · 생략(일반)
  - TYPE은 **Workbench식 표기 권장**: INT(11), VARCHAR(45), BIGINT, DATETIME, TEXT, TINYINT(1) …
    타입 토큰에 공백 금지 — VARCHAR(45) O, VARCHAR (45) X

## 예
\`\`\`
erDiagram
  User ||--o{ Post : writes
  Post ||--o{ Comment : has
  User {
    INT(11) id PK
    VARCHAR(45) email UK
    VARCHAR(100) password
    DATETIME created_at
  }
  Post {
    INT(11) id PK
    INT(11) user_id FK
    VARCHAR(200) title
    TEXT body
  }
\`\`\`

## 규칙
- ERD는 클라이언트 canvas 렌더라 크롤러가 못 읽는다 → 데이터 모델 설명을 features/specs 섹션에
  **텍스트로도 병행**하라(AEO).
- 이모지 금지.`

const DEEP_DIVE = `# 딥다이브(upsert_deep_dive) 스펙

기술 글. content = **NoteBlock 배열**. "문제 정의 → 접근 → 트레이드오프 → 결과" 흐름을 권장.
필드: slug, title, category(예 "아키텍처"), date(표시용 "2026.04"), readTime("8분"), excerpt, coverId.

## 블록 타입 (NoteBlock)
- { type:"h2"|"h3"|"p"|"quote"|"callout", text }
- { type:"code", text, lang? }        // 코드 블록
- { type:"list", items:[...], ordered? }
- { type:"table", header?:[...], rows:[[...],...] }
- { type:"image", mediaId, caption? } // upload_media의 id
- { type:"video", mediaId?|url?, caption?, poster? }
- { type:"divider" }

## 예
\`\`\`json
[
  { "type":"h2", "text":"문제" },
  { "type":"p", "text":"동시 주문이 몰리면 재고가 음수가 됐다." },
  { "type":"callout", "text":"핵심: 낙관적 락으로는 부족했다." },
  { "type":"code", "lang":"sql", "text":"SELECT ... FOR UPDATE;" },
  { "type":"list", "items":["원인 A","원인 B"] }
]
\`\`\`

## 규칙
- 코드/다이어그램/표를 적극 사용해 밀도를 높여라.
- 이미지는 upload_media 후 mediaId 참조. 모든 image에 caption 권장.
- 프로젝트와 연결하려면 프로젝트의 relatedNoteIds에 이 글 id를 넣어라.`

const MEDIA = `# 미디어 스펙

MCP는 미디어를 **저장·연결**한다. 픽셀(스크린샷/영상/로고 아트) **생성은 당신(에이전트)의 몫**이다.

## upload_media
- 입력: url(가져오기) 또는 dataBase64(로컬 파일 base64). filename(확장자 추론), alt(**필수 권장**, SEO/접근성).
- 반환: { id, url }. 이 id를 coverId/logoId/avatarId/섹션 media/블록 image에 연결.

## 무엇을 어디에
- **커버/썸네일**: 프로젝트 coverId (상단 배너 + 목록 썸네일 겸용). 16:9 권장.
- **로고**: 프로젝트 logoId / 회사 경력 logoId. 정사각 투명 PNG 권장.
- **아바타**: 프로필 avatarId. 인물/프로젝트 대표 이미지.
- **갤러리/본문 이미지**: 섹션 media[] 또는 딥다이브 image 블록.
- **영상**: 화면 녹화가 있으면 upload_media(파일) 또는, 없으면 embed(YouTube URL)로 섹션 media에 kind:'embed'.

## 규칙
- 스크린샷은 **실제 화면**을 담아라(가짜 목업 금지). 앱을 띄워 캡처할 수 있으면 그렇게 하라.
- 모든 이미지에 alt(설명) — 크롤러/AI가 읽는다.
- 큰 영상 파일을 base64로 올리지 마라(무겁다) — embed 우선.`

const STYLE = `# 스타일·톤·정직성

## 디자인 토큰 (테마: editorial-dark)
- 강조색 accent: 기본 #F1531B(오렌지). 프로필별로 ensure_profile에서 지정 가능. 다이어그램의 @accent가 이 값.
- 배경 다크(#0e0e0e), 텍스트 밝은 그레이. 라임 서브 강조 #C6F24E.
- 헤드라인=대문자 그로테스크(영문), 본문=한글 고딕. 한국어는 word-break: keep-all(어절 단위 줄바꿈).

## 톤
- 과장 없는 담백한 개발자 문체. 문제→해결→결과. 수치는 근거 있을 때만.
- 영문 대문자 헤드라인(headline)은 짧고 강하게(예: "FULL-STACK / DEVELOPER").

## 정직성 (최우선 · 위반 금지)
- 실제 저장소에서 확인 가능한 사실만. 담당하지 않은 역할, 검증 안 된 성과·기술을 넣지 마라.
- 확실치 않으면 생략한다. 추정으로 채우지 않는다.
- 팀 프로젝트면 본인 기여 범위를 정확히 표기.`

export const GUIDES: Guide[] = [
  { slug: 'overview', uri: 'hubgmate://guide/overview', title: '저작 개요·발행 순서', body: OVERVIEW },
  { slug: 'case-study', uri: 'hubgmate://guide/case-study', title: '케이스 스터디 구조·섹션 kind', body: CASE_STUDY },
  { slug: 'diagrams', uri: 'hubgmate://guide/diagrams', title: '다이어그램(mermaid) 규칙', body: DIAGRAMS },
  { slug: 'erd', uri: 'hubgmate://guide/erd', title: 'ERD(erDiagram) 규칙', body: ERD },
  { slug: 'deep-dive', uri: 'hubgmate://guide/deep-dive', title: '딥다이브 블록 규칙', body: DEEP_DIVE },
  { slug: 'media', uri: 'hubgmate://guide/media', title: '미디어(이미지/영상/로고) 규칙', body: MEDIA },
  { slug: 'style', uri: 'hubgmate://guide/style', title: '디자인 토큰·톤·정직성', body: STYLE },
]

// prompt로 내려줄 통합 가이드(개요 + 리소스 안내).
export const CONTENT_GUIDE = OVERVIEW
