/**
 * 본문 텍스트의 " — "(em dash 구분자)가 줄 맨 앞으로 떨어지지 않게 한다.
 *
 * 앞 공백을 non-breaking space로 바꾸면 대시가 앞 단어에 붙어 다니므로,
 * 줄바꿈은 항상 대시 "뒤"에서만 일어난다. (CSS로는 표현할 수 없어 데이터에서 처리)
 *
 * 실행: pnpm exec tsx scripts/fix-emdash-nbsp.ts
 */
import fs from 'node:fs'
import Database from 'better-sqlite3'

for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const db = new Database(process.env.DATABASE_PATH || './data/hub.db')

const NB = ' ' // non-breaking space
const TARGETS: { table: string; columns: string[] }[] = [
  { table: 'profiles', columns: ['title', 'headline', 'tagline', 'intro', 'bio', 'stats', 'skills', 'awards', 'cards', 'ctaText'] },
  { table: 'projects', columns: ['summary', 'role', 'metrics', 'sections'] },
  { table: 'experiences', columns: ['summary', 'sections'] },
  { table: 'notes', columns: ['excerpt', 'content'] },
]

let total = 0
for (const { table, columns } of TARGETS) {
  const cols = new Set(
    (db.prepare(`select name from pragma_table_info('${table}')`).all() as { name: string }[]).map((r) => r.name),
  )
  for (const camel of columns) {
    // 스키마는 snake_case 로 저장돼 있다
    const col = camel.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
    if (!cols.has(col)) continue
    const before = db.prepare(`select count(*) c from ${table} where ${col} like '% — %'`).get() as { c: number }
    if (!before.c) continue
    db.prepare(`update ${table} set ${col} = replace(${col}, ' — ', '${NB}— ') where ${col} like '% — %'`).run()
    console.log(`${table}.${col}: ${before.c}행 처리`)
    total += before.c
  }
}
console.log(total ? `\n총 ${total}개 컬럼값에서 " — " → "${'\\u00A0'}— " 치환 완료` : '치환 대상 없음')
db.close()
