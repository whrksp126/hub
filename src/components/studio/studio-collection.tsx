'use client'

import { ArrowUpRight, ChevronDown, ChevronUp, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { useRef, useState } from 'react'
import { Thumb } from '@/components/portfolio/pieces'
import { PortfolioColumns } from '@/components/portfolio/portfolio-columns'
import { ExperienceCardView } from '@/components/portfolio/sections/experience-card-view'
import type { Profile } from '@/db/schema'

type Kind = 'project' | 'experience' | 'note'

export type CollItem = {
  id: number
  published?: boolean
  featured?: boolean
  // project
  title?: string
  titleKr?: string | null
  summary?: string | null
  tag?: string | null
  year?: string | null
  coverUrl?: string | null
  // experience
  company?: string
  role?: string | null
  period?: string | null
  length?: string | null
  context?: string | null
  current?: boolean
  points?: string[]
  stack?: string[]
  logoUrl?: string | null
  // note
  category?: string | null
  date?: string | null
  readTime?: string | null
  excerpt?: string | null
}

const KICKERS: Record<Kind, (n: number) => string> = {
  project: (n) => `선택된 작업 · ${String(n).padStart(2, '0')}`,
  experience: () => '경력 · CAREER',
  note: () => '기록 · WRITING',
}
const TITLES: Record<Kind, [string, string]> = {
  project: ['RECENT', 'PROJECTS'],
  experience: ['WORK', 'EXPERIENCE'],
  note: ['DEEP', 'DIVES'],
}
const LISTCLS: Record<Kind, string> = { project: 'flex flex-col gap-3.5', experience: 'flex flex-col gap-4', note: 'flex flex-col gap-3.5' }

// 스튜디오 목록 = 공개 목록 디자인(PortfolioColumns 셸 + 공용 렌더러) + 인라인 관리.
export function StudioCollection({
  kind,
  items: initial,
  profile,
  avatarUrl,
  addAction,
  addLabel,
  actions,
}: {
  kind: Kind
  items: CollItem[]
  profile: Profile
  avatarUrl: string | null
  addAction: (formData: FormData) => void
  addLabel: string
  actions: {
    setFeatured?: (id: number, featured: boolean) => Promise<{ ok: boolean; error?: string }>
    reorder: (profileId: number, orderedIds: number[]) => Promise<{ ok: boolean; error?: string }>
    remove: (id: number) => Promise<{ ok: boolean; error?: string }>
  }
}) {
  const profileId = profile.id
  const [items, setItems] = useState<CollItem[]>(initial)
  const reorderTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editHref = (it: CollItem) => `/studio/p/${profileId}/${kind === 'project' ? 'projects' : kind === 'experience' ? 'experience' : 'notes'}/${it.id}`

  const toggle = (it: CollItem) => {
    const v = !it.featured
    setItems((a) => a.map((x) => (x.id === it.id ? { ...x, featured: v } : x)))
    void actions.setFeatured?.(it.id, v)
  }
  const move = (i: number, d: -1 | 1) => {
    const j = i + d
    if (j < 0 || j >= items.length) return
    const n = [...items]
    ;[n[i], n[j]] = [n[j], n[i]]
    setItems(n)
    if (reorderTimer.current) clearTimeout(reorderTimer.current)
    const ids = n.map((x) => x.id)
    reorderTimer.current = setTimeout(() => void actions.reorder(profileId, ids), 400)
  }
  const del = (it: CollItem) => {
    if (!window.confirm(`“${it.title ?? it.company}”을(를) 삭제할까요? 되돌릴 수 없습니다.`)) return
    setItems((a) => a.filter((x) => x.id !== it.id))
    void actions.remove(it.id)
  }

  return (
    <div className="pf pb-24" style={{ '--pf-ac': profile.accent } as CSSProperties}>
      <PortfolioColumns profile={profile} avatarUrl={avatarUrl}>
        <div className="pf-reveal mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--pf-fg-faint)]">
          {KICKERS[kind](items.length)}
        </div>
        <h1 className="pf-reveal pf-display m-0 mb-[clamp(32px,5vw,56px)] text-[clamp(44px,9vw,120px)]">
          <span className="block text-[var(--pf-fg)]">{TITLES[kind][0]}</span>
          <span className="block text-[var(--pf-headline-dim)]">{TITLES[kind][1]}</span>
        </h1>

        {items.length > 0 && (
          <div className={LISTCLS[kind]}>
            {items.map((item, i) => (
              <div key={item.id} className="group relative rounded-[20px] text-left">
                <Body kind={kind} item={item} href={editHref(item)} />
                <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5 opacity-0 transition group-hover:opacity-100">
                  {item.published === false && <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-[var(--pf-fg-faint)] backdrop-blur">초안</span>}
                  {actions.setFeatured && (
                    <button
                      type="button"
                      onClick={() => toggle(item)}
                      className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${item.featured ? 'bg-[var(--pf-ac)] text-white' : 'bg-black/50 text-[var(--pf-fg-dim)] backdrop-blur'}`}
                      title={item.featured ? '홈에서 숨기기' : '홈에 표시'}
                    >
                      {item.featured ? <Eye size={12} /> : <EyeOff size={12} />} 홈
                    </button>
                  )}
                  <div className="flex flex-col rounded-lg bg-black/50 backdrop-blur">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="px-1 text-[var(--pf-fg-dim)] hover:text-[var(--pf-fg)] disabled:opacity-25" aria-label="위로"><ChevronUp size={14} /></button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="px-1 text-[var(--pf-fg-dim)] hover:text-[var(--pf-fg)] disabled:opacity-25" aria-label="아래로"><ChevronDown size={14} /></button>
                  </div>
                  <Link href={editHref(item)} className="rounded-lg bg-black/50 p-1.5 text-[var(--pf-fg-dim)] backdrop-blur hover:text-[var(--pf-ac)]" title="편집"><Pencil size={14} /></Link>
                  <button type="button" onClick={() => del(item)} className="rounded-lg bg-black/50 p-1.5 text-[var(--pf-fg-dim)] backdrop-blur hover:text-red-400" title="삭제"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <form action={addAction} className="mt-4">
          <input type="hidden" name="profileId" value={profileId} />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 py-3 text-sm font-semibold text-[var(--pf-fg-muted)] transition-colors hover:border-[var(--pf-ac)] hover:text-[var(--pf-fg)]"
          >
            <Plus size={15} /> {addLabel}
          </button>
        </form>
      </PortfolioColumns>
    </div>
  )
}

// 공개 목록과 동일한 본문 (kind별). 전체가 편집 화면으로의 링크.
function Body({ kind, item, href }: { kind: Kind; item: CollItem; href: string }) {
  if (kind === 'project') {
    return (
      <Link href={href} className="grid grid-cols-[92px_minmax(0,1fr)_24px] items-start gap-[clamp(16px,2.5vw,28px)] rounded-[18px] p-[18px] transition-colors hover:bg-[var(--pf-surface)] sm:grid-cols-[112px_minmax(0,1fr)_24px]">
        <Thumb url={item.logoUrl} alt={item.title ?? ''} className="h-[92px] w-[92px] overflow-hidden rounded-[16px] sm:h-[112px] sm:w-[112px]" />
        <span className="flex min-w-0 flex-col gap-2 pt-0.5">
          <span className="flex flex-wrap items-baseline gap-3">
            <span className="text-[clamp(20px,2.4vw,28px)] font-bold tracking-[-0.01em] text-[var(--pf-fg)]">{item.title}</span>
            {item.titleKr && <span className="text-[13px] text-[var(--pf-fg-faint)]">{item.titleKr}</span>}
          </span>
          {item.summary && <span className="max-w-[520px] text-[14px] leading-[1.55] text-[var(--pf-fg-muted)]">{item.summary}</span>}
          <span className="mt-0.5 flex gap-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--pf-fg-faint)]">
            {item.tag && <span>{item.tag}</span>}
            {item.year && <span>{item.year}</span>}
          </span>
        </span>
        <ArrowUpRight size={22} strokeWidth={1.9} className="mt-1 text-[var(--pf-ac)]" />
      </Link>
    )
  }
  if (kind === 'experience') {
    return (
      <Link href={href} className="block transition-colors hover:[&>div]:border-[var(--pf-ac)]/40">
        <ExperienceCardView
          data={{
            company: item.company ?? '',
            role: item.role ?? null,
            period: item.period ?? null,
            length: item.length ?? null,
            context: item.context ?? null,
            current: !!item.current,
            points: item.points ?? [],
            stack: item.stack ?? [],
            media: [],
            mediaUrls: {},
            logoUrl: item.logoUrl ?? null,
            coverUrl: item.coverUrl ?? null,
          }}
        />
      </Link>
    )
  }
  // note
  return (
    <Link href={href} className="grid grid-cols-[minmax(0,1fr)_24px] items-start gap-[clamp(20px,4vw,40px)] border-b border-white/[0.06] py-[clamp(22px,3vw,30px)] transition-colors hover:opacity-80">
      <div>
        <div className="mb-3.5 flex gap-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--pf-fg-faint)]">
          {item.category && <span className="text-[var(--pf-ac)]">{item.category}</span>}
          {item.date && <span>{item.date}</span>}
          {item.readTime && <span>{item.readTime}</span>}
        </div>
        <h2 className="m-0 mb-3 text-[clamp(20px,2.5vw,30px)] font-bold leading-[1.25] tracking-[-0.015em] text-[var(--pf-fg)]">{item.title}</h2>
        {item.excerpt && <p className="m-0 max-w-[680px] text-[15px] leading-[1.6] text-[var(--pf-fg-muted)]">{item.excerpt}</p>}
      </div>
      <ArrowUpRight size={22} strokeWidth={1.9} className="mt-1 text-[var(--pf-ac)]" />
    </Link>
  )
}
