'use client'

import { Briefcase, FolderOpen, Home, Mail, PenLine } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { pfPath } from '@/lib/seo'

type NavItem = {
  key: string
  title: string
  href: string
  icon: typeof Home
  match: (path: string, base: string) => boolean
}

// 디자인의 플로팅 아이콘 nav. 활성 상태는 현재 경로로 판단.
const ITEMS: NavItem[] = [
  { key: 'home', title: '홈', href: '', icon: Home, match: (p, b) => p === b },
  {
    key: 'projects',
    title: '프로젝트',
    href: '/projects',
    icon: FolderOpen,
    match: (p, b) => p.startsWith(`${b}/projects`),
  },
  {
    key: 'experience',
    title: '경력',
    href: '/experience',
    icon: Briefcase,
    match: (p, b) => p.startsWith(`${b}/experience`),
  },
  {
    key: 'notes',
    title: '글',
    href: '/deep-dives',
    icon: PenLine,
    match: (p, b) => p.startsWith(`${b}/deep-dives`),
  },
  {
    key: 'contact',
    title: '연락하기',
    href: '/contact',
    icon: Mail,
    match: (p, b) => p.startsWith(`${b}/contact`),
  },
]

export function PortfolioNav({ username }: { username: string }) {
  const pathname = usePathname() ?? ''
  const base = pfPath(username)

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-60 flex justify-center px-4 pt-[22px]">
      <nav className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-[rgba(20,20,20,0.96)] p-[7px] shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
        {ITEMS.map((item) => {
          const href = `${base}${item.href}`
          const active = item.match(pathname, base)
          const Icon = item.icon
          return (
            <div key={item.key} className="flex items-center">
              {item.key === 'contact' && <span className="mx-[3px] h-6 w-px bg-white/10" />}
              <Link
                href={href}
                title={item.title}
                aria-label={item.title}
                className={[
                  'flex h-[46px] w-[46px] items-center justify-center rounded-full transition-colors',
                  active
                    ? 'bg-[var(--pf-ac)] text-white'
                    : 'text-[var(--pf-fg-faint)] hover:bg-white/[0.06] hover:text-[var(--pf-fg)]',
                ].join(' ')}
              >
                <Icon size={20} strokeWidth={1.8} />
              </Link>
            </div>
          )
        })}
      </nav>
    </header>
  )
}
