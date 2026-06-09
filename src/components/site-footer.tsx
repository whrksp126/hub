import { SITE_AUTHOR, SITE_BUSINESS, SITE_NAME } from '@/lib/seo'

export function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-[var(--line)] py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-1 px-5 text-sm text-[var(--fg-muted)]">
        <p className="font-medium text-[var(--fg)]">{SITE_NAME}</p>
        <p>
          {SITE_BUSINESS} · {SITE_AUTHOR}가 만든 것들
        </p>
        <p>© {year} {SITE_NAME}. All rights reserved.</p>
      </div>
    </footer>
  )
}
