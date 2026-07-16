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

프롬프트 `hubgmate_content_guide` = 케이스 스터디 구조·섹션 kind·딥다이브 포맷·정직성 규칙. 발행 전 필독.

## 멱등성

같은 `slug`로 다시 `upsert`하면 **갱신**된다(중복 생성 X). `list_content`로 기존 항목을 먼저 확인.

## 검토·공개

발행물은 draft → 소유자가 `https://hub.ghmate.com/studio` 에서 프로필/항목을 검토하고 **공개**로 전환하면 라이브(`/p/<username>`)에 노출된다.
