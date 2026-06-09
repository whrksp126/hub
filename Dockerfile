# hub.ghmate.com — Next standalone + better-sqlite3(네이티브) + drizzle 마이그레이션
# glibc(slim) 사용 → better-sqlite3 prebuilt 바이너리 호환.

FROM node:22-bookworm-slim AS base

# ── 의존성 ───────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
# playwright(devDep)가 브라우저를 받지 않도록(이미지에 불필요)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
# better-sqlite3 prebuild 실패 시 소스 빌드 대비 (deps 스테이지에서만)
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN corepack enable && pnpm install --frozen-lockfile

# ── 빌드 ─────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 정적 생성이 DB를 조회하므로 빌드 전 빈 DB(테이블만) 준비 + WAL 설정. (런타임 DB는 별도 볼륨)
RUN corepack enable && mkdir -p data && pnpm exec drizzle-kit migrate \
  && node -e "const D=require('better-sqlite3');const d=new D('./data/hub.db');d.pragma('journal_mode=WAL');d.close()" \
  && pnpm build

# ── 실행(런타임) ─────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# 마이그레이션 폴더 + 네이티브 모듈(standalone 트레이스 누락 대비)
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
RUN mkdir -p /app/data
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
# 시작 시 instrumentation이 자동 마이그레이션 → 서버 기동
CMD ["node", "server.js"]
