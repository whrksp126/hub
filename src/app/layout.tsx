import type { Metadata, Viewport } from 'next'
import './globals.css'
import { buildMetadata, SITE_LOCALE } from '@/lib/seo'

export const metadata: Metadata = {
  ...buildMetadata({}),
  // 하위 페이지의 문자열 title에 자동으로 ' — HubGmate' 접미(브랜딩 일관).
  // title.absolute를 쓰는 페이지(랜딩 등)는 접미가 붙지 않는다.
  title: { default: 'HubGmate', template: '%s — HubGmate' },
}

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
