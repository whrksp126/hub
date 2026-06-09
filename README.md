# hub.ghmate.com — 개발자 블로그 (GhMate)

개발 기록 중심의 셀프호스팅 블로그. **노션식 편집기 · 워드프레스식 테마 · AI 에이전트 자동 발행**.
비용 0, 단일 Docker 컨테이너. ghmate 홈서버(글로벌 nginx 리버스 프록시) 위에서 운영.

## 스택
- **Next.js 16 (App Router) + React 19 + TypeScript**
- **Drizzle ORM + SQLite(WAL, better-sqlite3)** — `drizzle-kit` 마이그레이션, 서버 시작 시 자동 적용
- **에디터: Plate(platejs)** — 슬래시 메뉴·드래그·콜아웃·표·코드 등. 편집/공개가 같은 컴포넌트(편집=결과)
- **이미지: MinIO**(objectstore.ghmate.com, path-style) via `@aws-sdk/client-s3`
- **UI: Tailwind + shadcn/ui**, 다크모드·한국어

## 환경변수 (`.env`, git 커밋 금지)
`.env.example` 복사 후 채운다.
```
DATABASE_PATH=./data/hub.db
AUTH_SECRET=<openssl rand -hex 32>
PREVIEW_SECRET=<openssl rand -hex 32>
NEXT_PUBLIC_SERVER_URL=https://hub.ghmate.com
S3_ENDPOINT=https://objectstore.ghmate.com
S3_REGION=us-east-1
S3_BUCKET=hub
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

## 로컬 실행
### A) Docker 기반 (운영과 동일, 권장)
```bash
docker compose up -d --build app     # 빌드 + 실행 → http://localhost:3002
docker compose logs -f app           # 로그(마이그레이션 자동 적용 확인)
docker compose down                  # 중지
```
- 데이터는 `./data/hub.db`(바인드 마운트)에 영속.
- 마이그레이션은 컨테이너 시작 시 `src/instrumentation.ts`가 자동 적용.

### B) 개발 서버 (핫리로드)
```bash
pnpm install
pnpm dev            # http://localhost:3002 (3000은 다른 Docker 점유)
```
스키마 변경 시: `pnpm db:generate` → `pnpm db:migrate` (push 금지).

## 관리자 / 편집
- `/studio` 접속 → 최초 1회 `/studio/setup`에서 관리자 계정 생성(이후 비활성).
- `/studio/new` 테마 갤러리에서 디자인 고르고 글 작성 → 저장/발행.
- `/studio/keys` 에서 에이전트용 **API 키** 발급.

## AI 에이전트 자동 발행 (REST)
```bash
# 1) 이미지 업로드 → MinIO
curl -X POST "$HUB_URL/api/v1/media" -H "Authorization: Bearer $KEY" \
  -F "file=@cover.png" -F "alt=커버"
# → {"id":12,"url":"https://objectstore.ghmate.com/hub/media/..."}

# 2) 글 발행 (마크다운 또는 Plate JSON)
curl -X POST "$HUB_URL/api/v1/posts" -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"제목","slug":"jemok","category":"tech","theme":"devlog","status":"published","coverId":12,"markdown":"## 본문\n\n**굵게**"}'
```
- 인증: `Authorization: Bearer <API Key>` (또는 관리자 세션).
- 본문: `content`(Plate JSON) 또는 `markdown`(서버 변환). 발행 시 즉시 공개 반영(revalidate).
- 리소스: `POST/GET /api/v1/posts`, `[id]` `GET/PATCH/DELETE`, `POST /api/v1/media`.

## 배포 (hub.ghmate.com)
형제 프로젝트(objectstore/serverstate/openday)와 동일한 **git-pull + 홈서버 빌드** 방식. 로컬에서 한 줄:
```bash
bash scripts/deploy.sh          # push → 서버 clone/pull → 서버에서 빌드+기동 → nginx 동기화 → 헬스체크
bash scripts/deploy.sh --restart  # 강제 재빌드/재기동
```
흐름: GitHub(`whrksp126/hub`, main) → 서버 `/srv/projects/hub` clone/pull → `docker compose up -d --build`(서버 빌드, 컨테이너 `hub_app_prod:3000`) → 글로벌 nginx(`/srv/nginx-proxy`)가 `hub.ghmate.com` → `hub_app_prod:3000` 프록시. Cloudflare가 HTTPS, 공유기 DDNS(ghmate.iptime.org) 경유. 포트개방/SSL 불필요.
- 서버 `.env`는 `.env.dev`(gitignore). 최초 배포 시 deploy.sh가 로컬 `.env.local` 기반으로 생성(새 `AUTH_SECRET`/`PREVIEW_SECRET`, `NEXT_PUBLIC_SERVER_URL=https://hub.ghmate.com`)해 scp. 이후 서버 파일이 단일 진실.
- 운영 보조: `scripts/status.sh`(상태), `scripts/logs.sh [-f|N]`(로그), `scripts/down.sh dev`(중지).
- 마이그레이션은 컨테이너 시작 시 `src/instrumentation.ts`가 자동 적용(데이터 보존). SQLite는 `./data` 볼륨에 영속.

## 백업
- **SQLite**: `sqlite3 data/hub.db ".backup '/backup/hub-$(date +%F).db'"` (WAL 안전).
- **MinIO**: 이미지는 이미 영속. 필요 시 `mc mirror`로 오프사이트 복제.
- `/backup` 스킬 참고.

## SEO/AEO
페이지별 메타·OG·JSON-LD(BlogPosting), 동적 `sitemap.xml`·`robots.txt`(GPTBot/ClaudeBot/PerplexityBot/Bingbot 허용), canonical `https://hub.ghmate.com`. 본문은 SSR 인라인.
