// 기존 profiles.notes(JSON 메타) → notes 테이블로 이관. 테이블이 비어있는 프로필만.
import Database from 'better-sqlite3'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { notes, profiles, type ProfileNote } from '../src/db/schema'

const sqlite = new Database('./data/hub.db')
const db = drizzle(sqlite)

function slugify(s: string): string {
  return (
    s
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w가-힣-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'note'
  )
}

const rows = await db.select().from(profiles)
for (const p of rows) {
  const legacy = (p.notes as ProfileNote[] | null) ?? []
  if (!legacy.length) continue
  const existing = await db.select({ id: notes.id }).from(notes).where(eq(notes.profileId, p.id))
  if (existing.length) {
    console.log(`skip ${p.username}: notes table not empty`)
    continue
  }
  let i = 0
  for (const n of legacy) {
    const base = slugify(n.title)
    await db.insert(notes).values({
      profileId: p.id,
      slug: `${base}-${i + 1}`,
      category: n.category || null,
      date: n.date || null,
      readTime: n.readTime || null,
      title: n.title || '제목 없음',
      excerpt: n.excerpt || null,
      content: [],
      status: 'published',
      order: i,
      publishedAt: new Date(),
    })
    i++
  }
  console.log(`migrated ${i} notes for ${p.username}`)
}
console.log('done')
process.exit(0)
