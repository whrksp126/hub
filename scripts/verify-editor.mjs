import 'dotenv/config'
import { chromium } from 'playwright'
import { SignJWT } from 'jose'

const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
const token = await new SignJWT({ uid: 1, email: 'ghmate', role: 'admin' })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('1d')
  .sign(secret)

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1280, height: 920 } })
await ctx.addCookies([{ name: 'hub_session', value: token, domain: 'localhost', path: '/' }])
const page = await ctx.newPage()

const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text().slice(0, 160))
})
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e).slice(0, 160)))

await page.goto('http://localhost:3002/studio/posts/3', { waitUntil: 'domcontentloaded', timeout: 90000 })
await page.waitForSelector('[data-slate-editor="true"]', { timeout: 90000 })
await page.waitForTimeout(2000)

const editor = await page.$('[data-slate-editor="true"]')

async function insertViaSlash(query, label) {
  await editor.click()
  await page.keyboard.press('End')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(400)
  await page.keyboard.type('/' + query, { delay: 40 })
  await page.waitForTimeout(1200)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(1500)
  console.log(`inserted: ${label} (errors so far: ${errors.length})`)
}

await insertViaSlash('excalidraw', 'Excalidraw')
await page.screenshot({ path: '/tmp/v-excalidraw.png' })

await insertViaSlash('date', 'Date')
await page.waitForTimeout(500)
await page.screenshot({ path: '/tmp/v-date.png' })

await insertViaSlash('equation', 'Equation')
await page.screenshot({ path: '/tmp/v-equation.png' })

await page.screenshot({ path: '/tmp/v-final.png', fullPage: true })
await browser.close()
console.log('TOTAL CONSOLE ERRORS:', errors.length)
errors.slice(0, 20).forEach((e) => console.log('  -', e))
