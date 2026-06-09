import Link from 'next/link'
import { logoutAction } from '@/lib/studio-actions'

export function StudioHeader({ email }: { email?: string | null }) {
  return (
    <header className="border-b border-[var(--line)]">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-5">
        <Link href="/studio" className="font-bold tracking-tight">
          Studio
        </Link>
        <div className="flex items-center gap-3 text-sm text-[var(--fg-muted)]">
          <Link href="/studio/keys" className="hover:text-[var(--fg)]">
            API 키
          </Link>
          <Link href="/" className="hover:text-[var(--fg)]">
            사이트 보기
          </Link>
          {email && (
            <>
              <span className="hidden sm:inline">{email}</span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-lg border border-[var(--line)] px-3 py-1.5 transition-colors hover:text-[var(--fg)]"
                >
                  로그아웃
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
