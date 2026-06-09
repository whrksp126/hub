#!/usr/bin/env bash
# hub 배포: 로컬에서 한 번 실행하면 push → 홈서버 clone/pull → 서버 빌드+기동 → nginx 동기화 → 헬스체크
# 형제 프로젝트(objectstore/serverstate) 패턴 + Next 앱이라 서버에서 직접 빌드(openday 방식).
# 사용:
#   bash scripts/deploy.sh           # 표준 배포 (변경 없으면 빌드/기동 생략)
#   bash scripts/deploy.sh --restart # 강제 재빌드/재기동
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

HOST="ghmate@ghmate.iptime.org"
KEY="${HOME}/.ssh/ghmate_server"
REMOTE_DIR="/srv/projects/hub"
REPO_URL="https://github.com/whrksp126/hub.git"
SSHO=(-i "${KEY}" -p 222 -o StrictHostKeyChecking=accept-new)
SCPO=(-i "${KEY}" -P 222 -o StrictHostKeyChecking=accept-new)

FORCE_RESTART=0
[[ "${1:-}" == "--restart" ]] && FORCE_RESTART=1

# ---------- 1) 로컬 사전 체크 ----------
echo "[deploy] 1/6 로컬 사전 체크"
if [[ -n "$(git status --porcelain)" ]]; then
  echo "  ✗ uncommitted 변경 있음. 먼저 커밋하세요:"
  git status --short
  exit 1
fi
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "${CURRENT_BRANCH}" != "main" ]]; then
  echo "  ✗ 현재 브랜치가 main이 아닙니다 (${CURRENT_BRANCH}). main에서만 배포 가능."
  exit 1
fi
echo "  ✓ clean / branch=main"

# ---------- 2) push ----------
echo "[deploy] 2/6 git push origin main"
git push origin main 2>&1 | tail -2

# ---------- 3) 원격: clone(최초) 또는 pull ----------
echo "[deploy] 3/6 홈서버 clone/pull"
ssh "${SSHO[@]}" "${HOST}" env REMOTE_DIR="${REMOTE_DIR}" REPO_URL="${REPO_URL}" bash -se <<'REMOTE'
set -euo pipefail
if [[ ! -d "${REMOTE_DIR}/.git" ]]; then
  echo "  최초 배포 → git clone"
  git clone --quiet "${REPO_URL}" "${REMOTE_DIR}"
  echo "  ✓ cloned"
else
  cd "${REMOTE_DIR}"
  BEFORE=$(git rev-parse HEAD)
  git pull --quiet
  AFTER=$(git rev-parse HEAD)
  if [[ "${BEFORE}" == "${AFTER}" ]]; then
    echo "  pull: 변경 없음 (HEAD ${BEFORE:0:7})"
  else
    echo "  pull: ${BEFORE:0:7} → ${AFTER:0:7}"
    git diff --name-only "${BEFORE}" "${AFTER}" | sed 's/^/    /'
  fi
fi
REMOTE

# ---------- 4) 서버 .env.dev 보장(없으면 로컬 기반 생성 후 scp; 시크릿 CLI 평문 금지) ----------
echo "[deploy] 4/6 서버 .env.dev 확인"
if ssh "${SSHO[@]}" "${HOST}" "test -f ${REMOTE_DIR}/.env.dev"; then
  echo "  ✓ 서버 .env.dev 존재 (유지)"
else
  echo "  · 서버 .env.dev 없음 → 로컬 .env.local 기반 생성 후 전송"
  [[ -f .env.local ]] || { echo "  ✗ 로컬 .env.local 이 없습니다. 먼저 만들어 주세요."; exit 1; }
  tmp="$(mktemp)"
  # 로컬값에서 prod 부적합 키(시크릿/공개URL) 제거, 나머지(S3·DB·ADMIN)는 유지
  grep -vE '^(AUTH_SECRET|PREVIEW_SECRET|NEXT_PUBLIC_SERVER_URL)=' .env.local > "${tmp}"
  {
    echo "NEXT_PUBLIC_SERVER_URL=https://hub.ghmate.com"
    echo "AUTH_SECRET=$(openssl rand -hex 32)"
    echo "PREVIEW_SECRET=$(openssl rand -hex 32)"
  } >> "${tmp}"
  scp "${SCPO[@]}" "${tmp}" "${HOST}:${REMOTE_DIR}/.env.dev"
  rm -f "${tmp}"
  echo "  ✓ .env.dev 전송(새 AUTH_SECRET/PREVIEW_SECRET, prod URL)"
fi

# ---------- 5) 서버 빌드+기동 + nginx 동기화 ----------
echo "[deploy] 5/6 서버 빌드+기동 + nginx"
ssh "${SSHO[@]}" "${HOST}" env REMOTE_DIR="${REMOTE_DIR}" FORCE_RESTART="${FORCE_RESTART}" bash -se <<'REMOTE'
set -euo pipefail
cd "${REMOTE_DIR}"
echo "  컨테이너 빌드+기동 (시간 소요)..."
bash scripts/up.sh dev > /tmp/hub_up.log 2>&1 || { tail -40 /tmp/hub_up.log; exit 1; }
echo "  ✓ up done"

# nginx conf 변경 감지 → 동기화 + reload
if ! diff -q deploy/hub.conf /srv/nginx-proxy/conf.d/hub.conf >/dev/null 2>&1; then
  echo "  nginx conf 갱신..."
  cp deploy/hub.conf /srv/nginx-proxy/conf.d/hub.conf
  docker exec nginx_proxy nginx -t >/dev/null 2>&1
  docker exec nginx_proxy nginx -s reload
  echo "  ✓ nginx reload"
else
  echo "  nginx conf 변경 없음"
fi
REMOTE

# ---------- 6) 헬스체크 + 외부 도메인 검증 ----------
echo "[deploy] 6/6 헬스체크"
# 컨테이너 기동 직후 부팅(마이그레이션) 여유
sleep 3
ssh "${SSHO[@]}" "${HOST}" bash -se <<'REMOTE'
set -e
echo -n "  local(nginx 경유) "
code=$(curl -fs -o /dev/null -w '%{http_code}' -H "Host: hub.ghmate.com" --max-time 15 http://localhost/ 2>/dev/null || echo "000")
echo "${code}"
[[ "${code}" =~ ^(200|30.|307|308)$ ]] || { echo "  ✗ 컨테이너/nginx 라우팅 실패"; docker logs --tail 30 hub_app_prod; exit 1; }
REMOTE

echo "  외부 도메인:"
ok=1
curl -fsSL -o /dev/null -w "    https://hub.ghmate.com/ → %{http_code}\n" --max-time 15 https://hub.ghmate.com/ || ok=0

if [[ "${ok}" == "1" ]]; then
  echo "[deploy] ✅ 완료 → https://hub.ghmate.com  (최초 1회 /studio/setup 에서 관리자 생성)"
else
  echo "[deploy] ⚠️ 외부 접근 실패. Cloudflare DNS(hub CNAME→ghmate.iptime.org) / 공유기 포트포워딩 확인 필요."
fi
