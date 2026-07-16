# hub.ghmate.com — 개발자 통합 사이트

개발자 포트폴리오/블로그 중심 통합 사이트. 셀프호스팅, 비용 0.

## 비전 (★ 1순위 판단 기준)
최종 목표는 **AI 에이전트가 조사→작성→이미지 첨부→발행까지 프로그램적으로
(REST/SDK/CLI/MCP) 끝내는 것**. 모든 설계 결정은 "에이전트 자동 발행이 쉬운가"를
1순위로 저울질한다.

핵심 사용자 요구 3가지(설계 우선순위):
1. **노션 수준의 편집 경험** — 결과 화면과 동일한 모습에서 직접 편집(WYSIWYG/인라인), 슬래시 메뉴·다양한 블록.
2. **워드프레스식 디자인 테마 선택** — 포폴/블로그 각 5+종의 완성된 룩앤필을 갤러리에서 골라 시작.
3. **AI 에이전트 자동 발행** — REST/SDK/CLI/MCP로 프로그램 발행.

## 스택 (그린필드, Payload 없음)
- **Next.js 16 (App Router) + React 19 + TypeScript** — 단일 Node 앱/단일 Docker 컨테이너. CMS 프레임워크 미사용.
- **DB: Drizzle ORM + SQLite(WAL, better-sqlite3)** — 가벼움 우선. `drizzle-kit` 마이그레이션(**generate→migrate, push 금지**)으로 데이터 보존.
- **에디터: Plate (platejs.org)** — 전부 MIT. shadcn/Tailwind 컴포넌트를 레포에 복사 → 다크테마 정확 일치 + **편집/공개 단일 렌더러**(편집=결과).
- **이미지/업로드: 기존 MinIO** (`@aws-sdk/client-s3`), `forcePathStyle: true`,
  endpoint `https://objectstore.ghmate.com`, 버킷 `hub`, 공개 URL `https://objectstore.ghmate.com/hub/media/<파일>`.
- **UI: Tailwind + shadcn/ui** — 다크모드·반응형·한국어 타이포.
- **인증: 경량 세션**(jose 서명 httpOnly 쿠키, 단일 관리자). 에이전트는 **API Key(Bearer)**.
- **배포: 단일 Docker 컨테이너 + ghmate 홈서버 글로벌 nginx 리버스 프록시** (`hub.ghmate.com`). 형제 프로젝트(objectstore/serverstate/openday)와 동일한 git-pull+서버빌드 방식 — `bash scripts/deploy.sh`. Cloudflare가 HTTPS, 공유기 DDNS(ghmate.iptime.org) 경유. 포트개방/SSL 불필요.

## 명령어
```bash
pnpm dev                                   # 개발 서버 (localhost:3002 — 3000은 Docker 점유)
pnpm db:generate                           # 스키마 변경 → 마이그레이션 생성
pnpm db:migrate                            # 마이그레이션 적용(데이터 보존)
pnpm build                                 # 프로덕션 빌드 (output: 'standalone')
pnpm start                                 # 프로덕션 실행
docker compose up -d --force-recreate app  # 배포 반영 (restart로는 env 반영 안 됨)
```

## 아키텍처 컨벤션
- `src/db/schema.ts` = 콘텐츠 모델(Drizzle 테이블). 모델 추가/수정은 여기서. 변경 시 `pnpm db:generate`로 마이그레이션 생성.
- `src/app/(site)/*` = 공개 사이트(SSR/ISR). `src/app/(studio)/*` = 관리자 편집(인증). `src/app/api/v1/*` = 자체 REST(에이전트/내부).
- `src/editor/*` = Plate 에디터(편집기 + PlateStatic 공개 렌더 + 블록 컴포넌트). 블록 1종 = 컴포넌트 1개를 편집/뷰 공용.
- `src/themes/*` = 워드프레스식 테마(타입별 layout + meta + sample). `registry.ts`로 조회. 콘텐츠의 `theme` 필드가 룩앤필 결정.
- `src/lib/*` = `auth.ts`·`s3.ts`(MinIO)·`seo.ts`·`jsonld.ts`·`revalidate.ts`·`markdown-to-plate.ts`.
- 모든 본문 = **Plate JSON**. 모든 이미지 = `media` 테이블 relation(직접 URL 박지 말 것).

## 즉시반영 규칙 (재빌드 금지)
- "수정 즉시 반영"은 SSG 재빌드가 아니라 **on-demand revalidation**으로 처리한다.
- 콘텐츠 쓰기(관리자 UI·API)가 끝나면 영향받는 경로를 `revalidatePath`/`revalidateTag`로 무효화한다(`src/lib/revalidate.ts` 헬퍼 재사용).

## SEO / AEO
- 모든 공개 페이지에 `generateMetadata`(메타/OG/Twitter) + 적절한 JSON-LD.
  메인=Person, 블로그=BlogPosting/Article, 포트폴리오=CreativeWork.
- `src/app/(site)/sitemap.ts`·`robots.ts` 동적 생성(robots는 **GPTBot/ClaudeBot/PerplexityBot/Bingbot 허용**). canonical=`https://hub.ghmate.com`.
- 콘텐츠는 반드시 SSR/ISR로 HTML에 인라인(크롤러·AI가 직접 읽게). 본문은 **PlateStatic**으로 서버 렌더.

## 시크릿 / env 규칙
- `.env*`는 **절대 git commit 금지**. 시크릿 값을 셸 명령줄 인자로 평문 타이핑하지 않는다.
- `.env`(env_file) 변경은 컨테이너 restart로 반영 안 됨 → `docker compose up -d --force-recreate app`.
- 노출 이력 있는 시크릿은 작업 후 로테이션.

## 에이전트 자동 발행 규약
- 인증: 관리자는 세션 쿠키(`/studio`), 에이전트는 **API Key 헤더**(`Authorization: Bearer <key>`).
- **MCP 서버(주력): `POST /api/mcp`** (`src/app/api/mcp/route.ts`, Streamable HTTP, `mcp-handler`). 각 프로젝트 담당 에이전트가 자기 레포를 분석해 **자율 발행**한다(HubGmate 에이전트와 소통 없이). 툴: `whoami`·`list_content`·`ensure_profile`·`upload_media`·`upsert_project`·`upsert_experience`·`upsert_deep_dive` + 프롬프트 `hubgmate_content_guide`. **모든 발행물은 draft** → 프로필 status 게이트로 검토 전까지 비공개. 프로젝트=별도 프로필(username). 셋업은 `docs/agent-publishing-mcp.md`.
- REST(폴백/원시): `POST /api/v1/media`(MinIO 저장) → id를 본문/cover에 연결. 본문은 Plate/NoteBlock JSON, 또는 `src/lib/markdown-to-plate.ts`.
- 관리자 반복 워크플로는 `/publish-content` 스킬.

## 운영 메모
- dev 포트 **3002**(3000은 Docker 점유). 사용자는 cmux에서 작업 — 로그는 `cmux capture-pane`으로 가져온다.
- 진행 상황/함정은 메모리 `hub-progress`·`hub-gotchas` 참조.
