import Link from 'next/link'
import { SITE_NAME } from '@/lib/seo'
import { ThemeToggle } from './theme-toggle'

const nav = [
  { href: '/blog', label: '블로그' },
  { href: '/docs', label: '문서' },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_85%,transparent)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <Link href="/" className="text-lg font-bold tracking-tight">
          {SITE_NAME}
        </Link>
        <nav className="flex items-center gap-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-2 text-sm text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
            >
              {n.label}
            </Link>
          ))}
          <span className="ml-2">
            <ThemeToggle />
          </span>
        </nav>
      </div>
    </header>
  )
}
