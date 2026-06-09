---
name: publish-content
description: >-
  hub.ghmate.com에 글(포트폴리오/블로그/문서/공지)과 이미지를 자체 REST API(/api/v1)로
  발행/수정한다. 이미지는 먼저 /api/v1/media로 올려 MinIO에 저장하고, 반환된 id를 본문/
  커버에 연결한 뒤 해당 리소스에 글을 생성한다. 에이전트 자동 발행의 표준 경로.
argument-hint: "[resource] [content-file]"
---

# 콘텐츠 발행 워크플로 (에이전트 자동 발행의 표준 경로)

이 프로젝트의 최종 비전(에이전트가 조사→작성→이미지→발행)을 구현하는 핵심 스킬이다.
모든 쓰기는 자체 REST API `/api/v1/*`로 한다.

## 전제
- 베이스 URL: 로컬 `http://localhost:3002`, 운영 `https://hub.ghmate.com`.
- 인증: **API Key(Bearer)**. `Authorization: Bearer <KEY>`. (apiKeys 테이블에서 검증. 시크릿은 셸 인자에 평문 노출 금지 — 환경변수/파일로 주입.)
- 이미지는 절대 본문에 외부 URL로 박지 말고, `media`에 업로드 후 id(relation)로 연결.
- 본문은 **Plate JSON**. 마크다운만 있으면 `src/lib/markdown-to-plate.ts` 변환을 거치거나, API의 `?format=markdown` 옵션(있으면)으로 보낸다.

## 절차
1. **이미지 업로드** (있으면): 각 이미지를 `POST /api/v1/media` (multipart, `file` 필드 + `alt`)로 올린다. 응답의 `id`(와 공개 `url`)를 기록.
2. **본문 구성**: Plate JSON 본문에서 이미지 블록은 1번의 media id/url로 연결. 포트폴리오/블로그는 `thumbnailId`/`coverId`도 media id로 지정. 룩앤필은 `theme` 필드로 선택.
3. **글 생성**: 대상 리소스에 `POST /api/v1/<resource>` (JSON). 리소스: `posts`, `portfolio`, `docs`, `services`, `announcements`. 필수 필드(title, slug, content, status 등)를 채운다. 수정은 `PATCH /api/v1/<resource>/<id>`.
4. **발행 확인**: `status: "published"` 인지 확인하고, 공개 페이지·`/sitemap.xml`에 반영됐는지 점검(쓰기 시 자동 revalidate).

## 예시 (curl, 키는 환경변수로)
```bash
# 1) 이미지 업로드
curl -s -X POST "$HUB_URL/api/v1/media" \
  -H "Authorization: Bearer $HUB_API_KEY" \
  -F "file=@./cover.png" -F "alt=커버 이미지"
# → {"id": <MEDIA_ID>, "url":"https://objectstore.ghmate.com/hub/media/<file>"}

# 2) 블로그 글 발행
curl -s -X POST "$HUB_URL/api/v1/posts" \
  -H "Authorization: Bearer $HUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"제목","slug":"jemok","category":"tech","theme":"devlog","coverId":<MEDIA_ID>,"status":"published","content":[/* Plate JSON */]}'
```

## 주의
- 슬러그 중복 충돌 시 PATCH로 갱신할지 새 슬러그로 만들지 결정.
- 발행 후 즉시반영은 API 라우트의 `revalidatePath`/`revalidateTag`가 처리한다(재빌드 불필요).
- 추후 이 REST 흐름을 얇게 감싸는 MCP 서버를 `scripts/`(또는 `src/mcp`)에 둔다.
