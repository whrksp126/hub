/**
 * OrderAndGo 프로젝트 상세만 비파괴적으로 갱신(metrics/sections/url).
 * 전체 시드(seed-portfolio.ts)는 프로필을 재생성하며 노트(딥다이브)까지 cascade 삭제하므로,
 * 콘텐츠 고도화 반영은 이 스크립트로 해당 프로젝트 행만 UPDATE 한다.
 *
 * 실행: pnpm tsx scripts/update-orderandgo.ts
 */
import Database from 'better-sqlite3'
import { projectRows } from './seed-portfolio'

const sqlite = new Database(process.env.DATABASE_PATH || './data/hub.db')
sqlite.pragma('foreign_keys = ON')

const USERNAME = 'geonho'
const og = projectRows.find((p) => p.slug === 'orderandgo')
if (!og) {
  console.error('orderandgo seed 데이터를 찾을 수 없습니다.')
  process.exit(1)
}

const profile = sqlite.prepare('select id from profiles where username=?').get(USERNAME) as { id: number } | undefined
if (!profile) {
  console.error(`${USERNAME} 프로필이 없습니다. 먼저 시드하세요.`)
  process.exit(1)
}

const row = sqlite.prepare('select id from projects where profile_id=? and slug=?').get(profile.id, 'orderandgo') as
  | { id: number }
  | undefined
if (!row) {
  console.error('orderandgo 프로젝트 행이 없습니다.')
  process.exit(1)
}

const res = sqlite
  .prepare('update projects set metrics=?, sections=?, stack=?, url=?, updated_at=? where id=?')
  .run(
    JSON.stringify(og.metrics),
    JSON.stringify(og.sections),
    JSON.stringify(og.stack),
    og.url || null,
    Math.floor(Date.now() / 1000),
    row.id,
  )

console.log(`[update] orderandgo(proj #${row.id}) 갱신 — metrics ${og.metrics.length} · sections ${og.sections.length}`)
console.log(`[update] changes=${res.changes}`)
sqlite.close()
