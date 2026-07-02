import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { StackHeadline, Thumb } from '@/components/portfolio/pieces'

export type HomeProjectItem = {
  id: number
  title: string
  titleKr: string | null
  summary: string | null
  slug: string
  logoUrl: string | null
}
export type HomeExperienceItem = {
  id: number
  company: string
  role: string | null
  context: string | null
  period: string | null
  length: string | null
}
export type HomeNoteItem = {
  id: number
  slug: string
  category: string | null
  readTime: string | null
  title: string
  excerpt: string | null
}

// ── 공용 행/카드 렌더러 (홈 + 편집기 프리뷰 단일 소스) ───────────────────
export function HomeProjectRow({ item, href }: { item: HomeProjectItem; href: string }) {
  return (
    <Link
      href={href}
      className="pf-reveal grid grid-cols-[92px_minmax(0,1fr)_24px] items-start gap-[clamp(16px,2.5vw,28px)] rounded-[18px] p-[18px] text-left transition-colors hover:bg-[var(--pf-surface)]"
    >
      <Thumb url={item.logoUrl} alt={item.title} className="h-[92px] w-[92px] overflow-hidden rounded-[16px]" />
      <span className="flex min-w-0 flex-col gap-2 pt-0.5">
        <span className="flex flex-wrap items-baseline gap-3">
          <span className="text-[clamp(20px,2.4vw,28px)] font-bold tracking-[-0.01em] text-[var(--pf-fg)]">{item.title}</span>
          {item.titleKr && <span className="text-[13px] text-[var(--pf-fg-faint)]">{item.titleKr}</span>}
        </span>
        {item.summary && (
          <span className="max-w-[520px] text-[14px] leading-[1.55] text-[var(--pf-fg-muted)]">{item.summary}</span>
        )}
      </span>
      <ArrowUpRight size={22} strokeWidth={1.9} className="mt-1 text-[var(--pf-ac)]" />
    </Link>
  )
}

export function HomeExperienceRow({ item, href }: { item: HomeExperienceItem; href: string }) {
  return (
    <Link
      href={href}
      className="pf-reveal grid grid-cols-[minmax(0,1fr)_24px] items-start gap-[clamp(16px,2.5vw,28px)] rounded-[18px] p-[18px] text-left transition-colors hover:bg-[var(--pf-surface)]"
    >
      <span className="flex min-w-0 flex-col gap-2 pt-0.5">
        <span className="flex flex-wrap items-baseline gap-3">
          <span className="text-[clamp(18px,2.2vw,24px)] font-bold tracking-[-0.01em] text-[var(--pf-fg)]">{item.company}</span>
          {item.role && <span className="text-[13px] text-[var(--pf-fg-faint)]">{item.role}</span>}
        </span>
        {item.context && (
          <span className="max-w-[640px] text-[14px] leading-[1.55] text-[var(--pf-fg-muted)]">{item.context}</span>
        )}
        {item.period && (
          <span className="mt-1 text-[12.5px] text-[var(--pf-fg-faint)]">
            {item.period}
            {item.length ? ` · ${item.length}` : ''}
          </span>
        )}
      </span>
      <ArrowUpRight size={22} strokeWidth={1.9} className="mt-1 text-[var(--pf-ac)]" />
    </Link>
  )
}

export function HomeNoteCard({ item, href }: { item: HomeNoteItem; href: string }) {
  return (
    <Link
      href={href}
      className="pf-reveal flex min-h-[200px] flex-col gap-4 rounded-[22px] border border-white/[0.07] bg-[var(--pf-surface)] p-7 text-left transition-colors hover:bg-[#1B1B1B]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--pf-fg-faint)]">
          {item.category && <span className="text-[var(--pf-ac)]">{item.category}</span>}
          {item.readTime && <span>{item.readTime}</span>}
        </div>
        <ArrowUpRight size={20} strokeWidth={1.9} className="text-[var(--pf-ac)]" />
      </div>
      <h3 className="mt-auto mb-0 text-[clamp(19px,2vw,24px)] font-bold leading-[1.25] tracking-[-0.01em] text-[var(--pf-fg)]">{item.title}</h3>
      {item.excerpt && <p className="m-0 text-[14px] leading-[1.6] text-[var(--pf-fg-muted)]">{item.excerpt}</p>}
    </Link>
  )
}

// ── 섹션 헤딩 행 (공개 홈: 큰 헤드라인 + 전체보기) ──────────────────────
function SectionHead({ top, bottom, moreHref, moreLabel }: { top: string; bottom: string; moreHref: string; moreLabel: string }) {
  return (
    <div className="pf-reveal mb-[clamp(28px,4vw,48px)] flex flex-col items-center gap-5 text-center min-[1080px]:flex-row min-[1080px]:items-end min-[1080px]:justify-between min-[1080px]:text-left">
      <StackHeadline top={top} bottom={bottom} className="text-[clamp(40px,7vw,104px)]" />
      <Link
        href={moreHref}
        className="flex items-center gap-2.5 rounded-full border border-white/[0.16] px-5 py-2.5 text-[13px] font-semibold text-[var(--pf-fg-dim)] hover:border-[var(--pf-fg)] hover:text-[var(--pf-fg)]"
      >
        {moreLabel}
        <ArrowUpRight size={15} strokeWidth={2} className="text-[var(--pf-ac)]" />
      </Link>
    </div>
  )
}

// ── 공개 홈 섹션 (큐레이션 프리뷰) ─────────────────────────────────────
export function ProjectListSection({ items, base }: { items: HomeProjectItem[]; base: string }) {
  if (items.length === 0) return null
  return (
    <section className="cv-auto pt-[clamp(56px,8vw,110px)]">
      <SectionHead top="RECENT" bottom="PROJECTS" moreHref={`${base}/projects`} moreLabel="전체 보기" />
      <div className="flex flex-col gap-3.5">
        {items.map((p) => (
          <HomeProjectRow key={p.id} item={p} href={`${base}/projects/${p.slug}`} />
        ))}
      </div>
    </section>
  )
}

export function ExperienceListSection({ items, base }: { items: HomeExperienceItem[]; base: string }) {
  if (items.length === 0) return null
  return (
    <section className="cv-auto pt-[clamp(56px,8vw,110px)]">
      <SectionHead top="WORK" bottom="EXPERIENCE" moreHref={`${base}/experience`} moreLabel="전체 보기" />
      <div className="flex flex-col gap-3.5">
        {items.map((e) => (
          <HomeExperienceRow key={e.id} item={e} href={`${base}/experience`} />
        ))}
      </div>
    </section>
  )
}

export function NoteCardGrid({ items, base }: { items: HomeNoteItem[]; base: string }) {
  if (items.length === 0) return null
  return (
    <section className="cv-auto pt-[clamp(56px,8vw,110px)]">
      <SectionHead top="DEEP" bottom="DIVES" moreHref={`${base}/deep-dives`} moreLabel="전체 글" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
        {items.map((n) => (
          <HomeNoteCard key={n.id} item={n} href={`${base}/deep-dives/${n.slug}`} />
        ))}
      </div>
    </section>
  )
}
