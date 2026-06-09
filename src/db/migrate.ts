import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

// 컨테이너/서버 시작 시 1회 실행. drizzle가 __drizzle_migrations로 멱등 처리.
export function runMigrations() {
  const path = process.env.DATABASE_PATH || './data/hub.db'
  const conn = new Database(path)
  conn.pragma('journal_mode = WAL')
  migrate(drizzle(conn), { migrationsFolder: './drizzle' })
  conn.close()
}
