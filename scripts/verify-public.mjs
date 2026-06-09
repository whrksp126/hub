import 'dotenv/config'
import Database from 'better-sqlite3'
import { chromium } from 'playwright'
import { SignJWT } from 'jose'

// 1) 글을 발행 상태로 세팅 (magazine 테마)
const db = new Database(process.env.DATABASE_PATH || './data/hub.db')
const content = JSON.stringify([
  { type: 'h2', children: [{ text: '들어가며' }] },
  { type: 'p', children: [{ text: '이 글은 공개 페이지 렌더링을 검증하는 예시입니다. 편집기에서 쓴 내용이 그대로 공개 페이지에 나타납니다.' }] },
  { type: 'h2', children: [{ text: '핵심' }] },
  { type: 'p', children: [{ text: '본문은 ' }, { text: 'PlateStatic', bold: true }, { text: ' 으로 서버 렌더되어 크롤러와 AI가 직접 읽습니다.' }] },
  { type: 'blockquote', children: [{ text: '편집 화면과 동일한 컴포넌트로 렌더 → 편집=결과.' }] },
])
const row = db.prepare('select id, slug from posts limit 1').get()
db.prepare("update posts set status='published', theme='magazine', category='tech', excerpt=?, content=?, published_at=unixepoch() where id=?")
  .run('공개 렌더링 + 테마 검증 예시', content, row.id)
console.log('published post slug=' + row.slug)

// 2) 세션 쿠키
const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
const token = await new SignJWT({ uid: 1, email: 'ghmate', role: 'admin' })
  .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1d').sign(secret)

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } })
await ctx.addCookies([{ name: 'hub_session', value: token, domain: 'localhost', path: '/' }])
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 140)))
page.on('pageerror', (e) => errors.push('PAGEERR: ' + String(e).slice(0, 140)))

await page.goto(`http://localhost:3002/blog/${row.slug}`, { waitUntil: 'networkidle', timeout: 90000 })
await page.waitForTimeout(1500)
await page.screenshot({ path: '/tmp/pub-blog.png', fullPage: true })
console.log('blog detail captured; h1=', await page.locator('h1').first().textContent())

await page.goto('http://localhost:3002/blog', { waitUntil: 'networkidle', timeout: 60000 })
await page.screenshot({ path: '/tmp/pub-bloglist.png' })

await page.goto('http://localhost:3002/studio/new', { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(800)
await page.screenshot({ path: '/tmp/pub-gallery.png', fullPage: true })

await browser.close()
console.log('CONSOLE ERRORS:', errors.length)
errors.slice(0, 12).forEach((e) => console.log('  -', e))
