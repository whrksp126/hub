import { type Browser, chromium } from 'playwright-core'

// 서버사이드 PDF 렌더링 — 실제 브라우저(Chromium)로 포트폴리오를 지정 폭에서 그대로 렌더 → PDF.
// screen 미디어를 유지한 채 뷰포트=설정 폭으로 렌더하므로 반응형/vw가 실제 화면과 100% 동일하게 동작한다.
// (브라우저 인쇄는 미디어쿼리를 무너뜨려 재현 불가 → 서버 렌더로 픽셀 퍼펙트 확보.)

// 로컬(macOS)·프로덕션(Debian) 모두 대응. 시스템 chromium 경로를 env로 우선 지정.
function executablePath(): string | undefined {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH
  // 프로덕션(Docker Debian)은 apt chromium
  return '/usr/bin/chromium'
}

// 컨테이너 내부에서 자기 서버로 로프백. PORT는 prod=3000.
function baseUrl(): string {
  return process.env.PDF_BASE_URL || `http://127.0.0.1:${process.env.PORT || 3000}`
}

let browserPromise: Promise<Browser> | null = null

async function getBrowser(): Promise<Browser> {
  if (browserPromise) {
    const existing = await browserPromise.catch(() => null)
    if (existing?.isConnected()) return existing
    browserPromise = null
  }
  browserPromise = chromium.launch({
    executablePath: executablePath(),
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--font-render-hinting=none'],
  })
  return browserPromise
}

// path = 내부 print 라우트 경로(?raw=1 포함). width = 렌더 뷰포트 폭.
export async function renderPortfolioPdf(path: string, width: number): Promise<Uint8Array> {
  const browser = await getBrowser()
  const context = await browser.newContext({ viewport: { width, height: 1200 } })
  try {
    const page = await context.newPage()
    await page.emulateMedia({ media: 'screen' }) // 인쇄 미디어로 바뀌면 미디어쿼리가 무너지므로 screen 유지
    await page.goto(baseUrl() + path, { waitUntil: 'networkidle', timeout: 45000 })
    // 웹폰트(CDN) + mermaid/react-flow(클라이언트 렌더) + 이미지 안정화 대기
    try {
      await page.evaluate(() => (document as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready)
    } catch {}
    await page.waitForTimeout(1500)
    const pageHeight = Math.round(width * 1.4142) // A4 비율 페이지로 세로 분할
    const pdf = await page.pdf({
      printBackground: true,
      width: `${width}px`,
      height: `${pageHeight}px`,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    })
    return pdf
  } finally {
    await context.close()
  }
}
