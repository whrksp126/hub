#!/usr/bin/env bash
# 컨테이너 중지/제거 (데이터 볼륨 ./data 는 보존)
# 사용: bash scripts/down.sh [local|dev]
set -euo pipefail

ENV_NAME="${1:-local}"
ENV_FILE=".env.${ENV_NAME}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

COMPOSE_FILES="-f docker-compose.yml"
if [[ "${ENV_NAME}" != "local" ]]; then
  COMPOSE_FILES="${COMPOSE_FILES} -f docker-compose.prod.yml"
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "[down] ${ENV_FILE} 없음 → 단순 docker compose down"
  docker compose ${COMPOSE_FILES} down
  exit 0
fi

echo "[down] using ${ENV_FILE}"
docker compose ${COMPOSE_FILES} --env-file "${ENV_FILE}" down
