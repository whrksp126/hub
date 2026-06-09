#!/usr/bin/env bash
# 컨테이너 기동(+빌드). hub는 Next 앱이라 호스트에서 직접 빌드한다.
# 사용:
#   bash scripts/up.sh          # 로컬(.env.local, docker-compose.yml)
#   bash scripts/up.sh dev      # 홈서버(prod override + .env.dev)
set -euo pipefail

ENV_NAME="${1:-local}"
ENV_FILE=".env.${ENV_NAME}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "[up] ${ENV_FILE} 파일이 없습니다."
  echo "    예) cp .env.example ${ENV_FILE} 후 값 채우기"
  exit 1
fi

COMPOSE_FILES="-f docker-compose.yml"
if [[ "${ENV_NAME}" != "local" ]]; then
  # 홈서버: prod override (nginx_proxy 네트워크, 컨테이너 네이밍, 호스트 포트 제거)
  COMPOSE_FILES="${COMPOSE_FILES} -f docker-compose.prod.yml"
fi

echo "[up] using ${ENV_FILE} (build on host)"
docker compose ${COMPOSE_FILES} --env-file "${ENV_FILE}" config >/dev/null
docker compose ${COMPOSE_FILES} --env-file "${ENV_FILE}" up -d --build
docker compose ${COMPOSE_FILES} --env-file "${ENV_FILE}" ps
