import 'server-only'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

// dev HMR에서 매번 새 연결이 생기지 않도록 전역 싱글톤.
const globalForDb = globalThis as unknown as {
  __sqlite?: Database.Database
}

const sqlite =
  globalForDb.__sqlite ??
  (() => {
    const conn = new Database(process.env.DATABASE_PATH || './data/hub.db')
    // 빌드 시 여러 워커가 동시에 열어 SQLITE_BUSY 나는 것 방지(잠금 대기, 느린 FS 대비 길게).
    conn.pragma('busy_timeout = 15000')
    conn.pragma('journal_mode = WAL')
    conn.pragma('foreign_keys = ON')
    return conn
  })()

if (process.env.NODE_ENV !== 'production') globalForDb.__sqlite = sqlite

export const db = drizzle(sqlite, { schema })
export { schema }
