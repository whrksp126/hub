---
name: deploy
description: >-
  hub.ghmate.com 배포. 형제 프로젝트(objectstore/serverstate/openday)와 동일한
  git-pull 방식: 로컬 `bash scripts/deploy.sh` → push → 홈서버 clone/pull →
  서버에서 docker build+up → 글로벌 nginx 동기화 → 헬스/외부 검증.
argument-hint: "[deploy|status|logs]"
---

# 배포 (git-pull + 홈서버 빌드)

ghmate 홈서버(글로벌 nginx 리버스 프록시) 위에서 `hub.ghmate.com`을 서비스한다.
**Cloudflare Tunnel 아님** — Cloudflare(HTTPS, Proxied) → 공유기 DDNS(ghmate.iptime.org) → 홈서버 nginx_proxy → `hub_app_prod:3000`.

## 한 줄 배포
```bash
bash scripts/deploy.sh            # push → 서버 clone/pull → 서버빌드+기동 → nginx 동기화 → 헬스체크
bash scripts/deploy.sh --restart  # 강제 재빌드/재기동
```
- 사전조건: working tree clean + branch `main`(deploy.sh가 강제). GitHub `whrksp126/hub`(public).
- 흐름(scripts/deploy.sh 6단계): ①로컬 precheck ②`git push origin main` ③서버 `/srv/projects/hub` clone(최초) 또는 pull ④서버 `.env.dev` 보장(없으면 로컬 `.env.local` 기반 생성→scp) ⑤`scripts/up.sh dev`(=`docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`, **서버에서 직접 빌드**) + nginx conf diff 시 동기화+reload ⑥헬스(nginx 경유 200)+외부 도메인 200.

## 핵심 규칙
- **빌드는 서버에서**(openday 방식). 서버 13GB/8core. Plate 의존성이 무거워 첫 빌드는 수 분 소요.
- compose 2겹: base `docker-compose.yml`(로컬 `.env.local`·3002:3000) + override `docker-compose.prod.yml`(`hub_app_prod`·`ports: !reset []`+`expose 3000`·`env_file: !override [.env.dev]`·nginx_proxy join).
  - **함정**: env_file은 override 간 *병합*됨 → prod에 `!override` 없으면 서버에 없는 `.env.local`까지 요구해 빌드 실패.
- **마이그레이션은 컨테이너 시작 시 `src/instrumentation.ts`가 자동 적용**(generate→migrate, push 금지). SQLite는 `/srv/projects/hub/data` 볼륨에 영속(데이터 보존).
- 서버 `.env`는 `.env.dev`(gitignore, 서버가 단일 진실). 변경 시: 서버에서 직접 수정 후 `bash scripts/deploy.sh --restart`. 시크릿 셸 인자 평문 금지·`.env*` git 커밋 금지.

## 운영 보조
```bash
bash scripts/status.sh        # 컨테이너/헬스/데이터/마이그레이션 로그 요약
bash scripts/logs.sh [-f|N]   # hub_app_prod 로그
bash scripts/down.sh dev      # 중지(데이터 볼륨 보존)
```

## 점검 체크리스트
- [ ] `bash scripts/deploy.sh` 6단계 통과(헬스 200·외부 200)
- [ ] `/studio` 아이디 로그인(세션 쿠키) 정상, 에이전트 API Key(`/api/v1`) 동작
- [ ] 마이그레이션 적용됨(`[migrate] applied`), 콘텐츠 보존
- [ ] 공개 페이지 SSR HTML에 본문 인라인(PlateStatic)
- [ ] `/sitemap.xml`·`/robots.txt` 정상, AI 크롤러 허용
- [ ] 이미지(MinIO) 로드, 다크모드/모바일 반응형
- [ ] data 볼륨(SQLite) 영속 확인
