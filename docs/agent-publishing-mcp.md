# HubGmate 자율 발행 — MCP 셋업 (프로젝트 에이전트용)

각 프로젝트 담당 에이전트가 **자기 레포를 분석해 HubGmate에 자율 발행**하는 표준 경로.
HubGmate 에이전트(관리자 측)와 소통 없이 동작한다.

- 엔드포인트: `https://hub.ghmate.com/api/mcp` (Streamable HTTP MCP)
- 인증: 프로젝트별 **API Key**(Bearer). `/studio/keys`에서 발급.
- 안전장치: **모든 발행물은 draft**로 등록된다. 소유자가 `/studio`에서 검토·공개하기 전까지 비공개.

## 1) API 키 발급 (1회, 사람이)

`https://hub.ghmate.com/studio` 로그인 → **API 키** → 새 키 생성(프로젝트명으로) → **표시되는 키를 복사**(1회만 노출).

## 2) 프로젝트 레포에 MCP 등록

레포 루트에 `.mcp.json` (커밋 O — 키는 안 들어감):

```json
{
  "mcpServers": {
    "hubgmate": {
      "type": "http",
      "url": "https://hub.ghmate.com/api/mcp",
      "headers": { "Authorization": "Bearer ${HUBGMATE_API_KEY}" }
    }
  }
}
```

키는 `.env`(gitignore)에:

```bash
HUBGMATE_API_KEY=hub_xxxxxxxxxxxxxxxxxxxxxxxx
```

> Cursor/Windsurf 등 다른 MCP 클라이언트도 동일 URL+Authorization 헤더로 등록하면 된다(Claude 전용 아님).

## 3) 에이전트에게 지시

> "이 레포를 분석해서 HubGmate에 포트폴리오로 발행해줘."

에이전트가 알아서:
1. `whoami` → 프로필 상태 확인
2. `hubgmate_content_guide` 프롬프트로 품질/구조 규칙 로드
3. `ensure_profile` → 이 프로젝트 프로필 생성(draft)
4. `upload_media` → 스크린샷 올리고 id 확보
5. `upsert_project` / `upsert_experience` / `upsert_deep_dive` → 콘텐츠 발행(draft)

## 제공 툴

| 툴 | 용도 |
|---|---|
| `whoami` | 접근 가능한 프로필·상태 |
| `list_content` | 기존 프로젝트/경력/딥다이브(멱등 판단) |
| `ensure_profile` | 프로필 생성/갱신 (신규 draft) |
| `upload_media` | 이미지 저장(url 또는 base64) → media id |
| `upsert_project` | 케이스 스터디 (slug 멱등, draft) |
| `upsert_experience` | 경력 항목 |
| `upsert_deep_dive` | 기술 글 (slug 멱등, draft) |

## 공식 저작 스펙 (MCP 리소스)

에이전트가 **우리 규칙대로** 완성도 높은 콘텐츠를 만들도록, 스펙을 리소스로 배포한다. 작성 전 읽어라:

| 리소스 URI | 내용 |
|---|---|
| `hubgmate://guide/overview` | 발행 순서·원칙 |
| `hubgmate://guide/case-study` | 프로젝트 구조·섹션 kind |
| `hubgmate://guide/diagrams` | mermaid + `@accent`/`@icon` 규칙(아이콘 11종) |
| `hubgmate://guide/erd` | erDiagram(Workbench 룩) 카디널리티·KEY·TYPE |
| `hubgmate://guide/deep-dive` | NoteBlock 블록 타입·예시 |
| `hubgmate://guide/media` | 이미지/영상/썸네일/로고/아바타 연결 규칙 |
| `hubgmate://guide/style` | 디자인 토큰·톤·정직성 |

프롬프트 `hubgmate_content_guide` = 개요 + 위 리소스 안내(진입점). 다이어그램/ERD/딥다이브는 해당 리소스를 열어 정확한 문법으로 작성한다.

> 미디어 **생성**(스크린샷·영상·로고 아트)은 프로젝트 에이전트의 몫이다. MCP는 `upload_media`로 저장·연결만 한다. 다이어그램·ERD는 텍스트라 어떤 에이전트든 우리 스펙대로 바로 그릴 수 있다.

## 멱등성

같은 `slug`로 다시 `upsert`하면 **갱신**된다(중복 생성 X). `list_content`로 기존 항목을 먼저 확인.

## 검토·공개

발행물은 draft → 소유자가 `https://hub.ghmate.com/studio` 에서 프로필/항목을 검토하고 **공개**로 전환하면 라이브(`/p/<username>`)에 노출된다.
