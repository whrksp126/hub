'use client'

import { Briefcase, FolderOpen, KeyRound, LayoutDashboard, LogOut, PenLine, UserRound } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SITE_NAME } from '@/lib/seo'
import { logoutAction } from '@/lib/studio-actions'

type Item = { title: string; href: string; icon: typeof LayoutDashboard; match: (p: string) => boolean }

const DASHBOARD: Item = {
  title: '대시보드',
  href: '/studio',
  icon: LayoutDashboard,
  match: (p) => p === '/studio',
}

// 편집은 대시보드 → 포트폴리오별로 들어가므로 네비는 최소화.
const USER_ITEMS: Item[] = [
  DASHBOARD,
  { title: 'API 키', href: '/studio/keys', icon: KeyRound, match: (p) => p.startsWith('/studio/keys') },
]

// 운영자: 관리는 모두 대시보드에서.
const ADMIN_ITEMS: Item[] = [DASHBOARD]

const btn = 'flex h-[46px] w-[46px] items-center justify-center rounded-full transition-colors'
const inactive = 'text-[var(--pf-fg-faint)] hover:bg-white/[0.06] hover:text-[var(--pf-fg)]'
const divider = <span className="mx-[3px] h-6 w-px bg-white/10" />

// 포트폴리오 편집(/studio/p/[id]/…) 컨텍스트에서 헤더에 노출하는 탭.
function portfolioTabs(id: string): Item[] {
  const base = `/studio/p/${id}`
  return [
    { title: '내 정보', href: base, icon: UserRound, match: (p) => p === base },
    { title: '프로젝트', href: `${base}/projects`, icon: FolderOpen, match: (p) => p.startsWith(`${base}/projects`) },
    { title: '경력', href: `${base}/experience`, icon: Briefcase, match: (p) => p.startsWith(`${base}/experience`) },
    { title: '글', href: `${base}/notes`, icon: PenLine, match: (p) => p.startsWith(`${base}/notes`) },
  ]
}

export function StudioHeader({ username, isAdmin }: { username?: string | null; isAdmin?: boolean }) {
  const pathname = usePathname() ?? ''
  const items = isAdmin ? ADMIN_ITEMS : USER_ITEMS
  const editId = pathname.match(/^\/studio\/p\/(\d+)/)?.[1] ?? null
  const tabs = editId ? portfolioTabs(editId) : []

  const renderItem = (item: Item) => {
    const Icon = item.icon
    const active = item.match(pathname)
    return (
      <Link
        key={item.href}
        href={item.href}
        title={item.title}
        aria-label={item.title}
        className={`${btn} ${active ? 'bg-[var(--pf-ac)] text-white' : inactive}`}
      >
        <Icon size={20} strokeWidth={1.8} />
      </Link>
    )
  }

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-60 flex justify-center px-4 pt-[22px]">
      <nav className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-[rgba(22,22,22,0.86)] p-[7px] shadow-[0_16px_50px_rgba(0,0,0,0.45)] backdrop-blur-[16px]">
        <Link
          href="/"
          title="사이트 보기"
          aria-label="사이트 보기"
          className="pf-mono px-3 text-[14px] font-semibold tracking-tight text-[var(--pf-fg)] transition-colors hover:text-[var(--pf-ac)]"
        >
          {SITE_NAME}
        </Link>
        {divider}
        {items.map(renderItem)}

        {tabs.length > 0 && (
          <>
            {divider}
            {tabs.map(renderItem)}
          </>
        )}

        {username && (
          <>
            {divider}
            <form action={logoutAction}>
              <button type="submit" title="로그아웃" aria-label="로그아웃" className={`${btn} ${inactive}`}>
                <LogOut size={20} strokeWidth={1.8} />
              </button>
            </form>
          </>
        )}
      </nav>
    </header>
  )
}
