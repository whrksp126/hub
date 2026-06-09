---
name: deploy
description: >-
  hub.ghmate.com 배포. standalone 빌드(로컬/CI 권장, 약한 서버 메모리 보호) →
  Docker 이미지 → docker compose up -d --force-recreate app → Cloudflare Tunnel 확인.
argument-hint: "[build|up|status]"
---

# 배포 (Docker + Cloudflare Tunnel)

단일 컨테이너(Next standalone) + cloudflared 로 `hub.ghmate.com`을 서비스한다.
서버가 swap 압박 상태일 수 있으니 **빌드는 가급적 로컬/CI에서** 하고 이미지를 배포한다.

## 1) 빌드
- `pnpm build` (next.config: `output: 'standalone'`). 서버 직빌드가 불가피하면
  `NODE_OPTIONS=--max-old-space-size=1024` 등으로 메모리 상한을 둔다.
- Docker 이미지: standalone 산출물(`.next/standalone`, `.next/static`, `public`) + `drizzle/`(마이그레이션) 담아 경량화.
- **마이그레이션은 컨테이너 시작 시 `pnpm db:migrate`(generate→migrate, push 금지)로 적용**. SQLite는 `/app/data` 볼륨에 영속되어 데이터 보존.

## 2) 배포 반영 (★ 중요)
- `.env`(env_file) 변경은 컨테이너 **restart로 반영 안 됨**(생성 시점 env 유지).
  → 반드시 `docker compose up -d --force-recreate app`.
- 앱이 런타임에 dotenv로 파일을 읽는 게 아니면 `docker cp`도 무효.
- 시크릿은 셸 인자 평문 금지 → `.env`는 파일로 서버에 전송, `.env*` git 커밋 금지.

## 3) Cloudflare Tunnel
- `cloudflared`가 `hub.ghmate.com` → `app:3000` 으로 라우팅. 포트개방/SSL 불필요.
- 배포 후 `https://hub.ghmate.com`(외부)와 `http://localhost:3000`(내부) 양쪽 확인.

## 4) 점검 체크리스트
- [ ] `/studio` 로그인(세션 쿠키) 정상, 에이전트 API Key(`/api/v1`) 동작
- [ ] 마이그레이션 적용됨(`drizzle/` 최신), 콘텐츠 보존
- [ ] 공개 페이지 SSR HTML에 본문 인라인(PlateStatic)
- [ ] `/sitemap.xml`·`/robots.txt` 정상, AI 크롤러 허용
- [ ] 이미지(MinIO) 로드, 다크모드/모바일 반응형
- [ ] data 볼륨(SQLite) 영속 확인
