#!/usr/bin/env bash
# PostToolUse(Edit|Write) hook — 편집된 파일을 prettier/eslint로 자동 정리.
# 실패해도 비차단(작업 흐름을 막지 않음).
set -euo pipefail

# Claude Code가 stdin으로 hook 페이로드(JSON)를 전달. 편집 대상 파일 경로 추출.
payload="$(cat || true)"
file="$(printf '%s' "$payload" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"

[ -z "${file:-}" ] && exit 0
[ -f "$file" ] || exit 0

case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.json|*.css|*.md)
    npx --no-install prettier --write "$file" >/dev/null 2>&1 || true
    case "$file" in
      *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs)
        npx --no-install eslint --fix "$file" >/dev/null 2>&1 || true
        ;;
    esac
    ;;
esac

exit 0
