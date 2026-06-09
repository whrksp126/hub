// Next.js 서버 부팅 시 1회 실행 → 마이그레이션 자동 적용(데이터 보존).
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { runMigrations } = await import('@/db/migrate')
      runMigrations()
      console.log('[migrate] applied')
    } catch (e) {
      console.error('[migrate] failed:', e)
    }
  }
}
