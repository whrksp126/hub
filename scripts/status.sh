#!/usr/bin/env bash
# 홈서버 hub 상태 한눈에 보기
# 사용: bash scripts/status.sh
set -euo pipefail

SSH="ssh -i ${HOME}/.ssh/ghmate_server -p 222 ghmate@ghmate.iptime.org"

${SSH} bash -se <<'REMOTE'
set -e
echo "=== 컨테이너 상태 ==="
docker ps --filter "name=hub_app_prod" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

echo ""
echo "=== 헬스 (nginx 경유) ==="
# runner 이미지(node-slim)에 curl이 없어 호스트에서 nginx_proxy 경유로 확인
echo -n "  hub.ghmate.com  "
curl -fs -o /dev/null -w '%{http_code}\n' -H "Host: hub.ghmate.com" http://localhost/ 2>/dev/null || echo FAIL

echo ""
echo "=== SQLite 데이터 ==="
ls -la /srv/projects/hub/data 2>/dev/null | sed 's/^/  /' || echo "  (없음)"

echo ""
echo "=== 최근 마이그레이션 로그 ==="
docker logs --tail 20 hub_app_prod 2>&1 | grep -iE 'migrate|error|listening|ready' | tail -5 | sed 's/^/  /' || true
REMOTE
