import type { Metadata, Viewport } from 'next'
import './globals.css'
import { buildMetadata, SITE_LOCALE } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({})

// 모바일 주소창 색 — 다크 우선 브랜드 배경.
export const viewport: Viewport = {
  themeColor: '#0a0a0b',
}

// 다크모드 깜빡임 방지: 페인트 전에 .dark 적용.
const noFlashTheme = `
(function(){try{
  var t = localStorage.getItem('theme');
  var dark = t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  if (dark) document.documentElement.classList.add('dark');
}catch(e){}})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
