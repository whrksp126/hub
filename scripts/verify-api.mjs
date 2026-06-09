import 'dotenv/config'
import Database from 'better-sqlite3'
import { randomBytes, createHash } from 'node:crypto'

const db = new Database(process.env.DATABASE_PATH || './data/hub.db')
const base = 'http://localhost:3002'

// 1) API 키 발급 (lib/auth.generateApiKey와 동일 방식)
const key = 'hub_' + randomBytes(24).toString('hex')
const keyHash = createHash('sha256').update(key).digest('hex')
db.prepare('insert into api_keys (name,prefix,key_hash) values (?,?,?)').run('verify-agent', key.slice(0, 11), keyHash)
console.log('issued api key:', key.slice(0, 14) + '…')

// 2) 인증 없이 → 401 기대
const noauth = await fetch(base + '/api/v1/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
console.log('no-auth POST status:', noauth.status, '(401 기대)')

// 3) 마크다운으로 발행
const md = `## 에이전트가 쓴 글

이 글은 **마크다운**으로 REST API를 통해 자동 발행되었습니다.

- 항목 하나
- 항목 둘

> 인용구도 변환됩니다.

\`\`\`js
console.log('hello agent')
\`\`\``

const res = await fetch(base + '/api/v1/posts', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: '에이전트 자동 발행 테스트',
    slug: 'agent-test',
    category: 'tech',
    theme: 'devlog',
    status: 'published',
    markdown: md,
  }),
})
console.log('POST status:', res.status, '(201 기대)')
const post = await res.json()
console.log('created id:', post.id, 'slug:', post.slug, 'content blocks:', Array.isArray(post.content) ? post.content.length : JSON.stringify(post).slice(0, 120))

// 4) 공개 페이지 렌더 확인
const pub = await fetch(base + '/blog/' + post.slug)
console.log('public GET status:', pub.status)
const html = await pub.text()
console.log("  본문 '에이전트가 쓴 글' 포함:", html.includes('에이전트가 쓴 글'))
console.log("  '마크다운' 포함:", html.includes('마크다운'))
console.log("  '인용구도 변환' 포함:", html.includes('인용구도 변환'))
console.log("  코드 'hello agent' 포함:", html.includes('hello agent'))

// 5) 목록 API
const list = await fetch(base + '/api/v1/posts', { headers: { Authorization: 'Bearer ' + key } })
const listed = await list.json()
console.log('list count:', listed.data?.length)
