import { getProfileByUsername } from '@/db/queries'
import { renderPortfolioPdf } from '@/lib/pdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// 포트폴리오 PDF — 서버가 실제 브라우저로 지정 폭에서 렌더해 픽셀 퍼펙트 PDF를 반환.
// 에이전트/프로그램도 이 URL로 PDF를 바로 받을 수 있다(자동발행 비전).
export async function GET(req: Request) {
  const url = new URL(req.url)
  const u = url.searchParams.get('u')
  if (!u) return new Response('missing username', { status: 400 })

  const profile = await getProfileByUsername(u)
  if (!profile) return new Response('not found', { status: 404 })

  const w = Math.min(2400, Math.max(600, Math.round(Number(url.searchParams.get('w')) || 1080)))

  // 내부 print 라우트(raw 모드)로 넘길 선택 파라미터 구성.
  const pass = new URLSearchParams({ raw: '1' })
  for (const k of ['home', 'pd', 'nd', 'exp']) {
    const v = url.searchParams.get(k)
    if (v != null) pass.set(k, v)
  }
  const path = `/p/${encodeURIComponent(u)}/print?${pass.toString()}`

  try {
    const pdf = await renderPortfolioPdf(path, w)
    const filename = encodeURIComponent(`${profile.name}-portfolio.pdf`)
    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename*=UTF-8''${filename}`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('[portfolio-pdf] render failed:', e)
    return new Response('pdf render failed', { status: 500 })
  }
}
