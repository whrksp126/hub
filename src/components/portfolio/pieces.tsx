import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import type { Project } from '@/db/schema'

// lucide-react는 GitHub 브랜드 아이콘을 더는 제공하지 않아 인라인 SVG로 둔다.
export function GithubIcon({ size = 21 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 19c-4 1.4-4-2.4-6-3m12 6v-3.6c0-1 .1-1.4-.5-2 2.8-.3 5.7-1.4 5.7-6.1a4.7 4.7 0 0 0-1.3-3.3 4.4 4.4 0 0 0-.1-3.3s-1-.3-3.5 1.3a11.8 11.8 0 0 0-6 0C6.7 2.3 5.7 2.6 5.7 2.6a4.4 4.4 0 0 0-.1 3.3A4.7 4.7 0 0 0 4.3 9.2c0 4.7 2.8 5.8 5.6 6.1-.6.6-.6 1.2-.5 2V21" />
    </svg>
  )
}

// 썸네일: 이미지가 있으면 그대로, 없으면 강조색 그라데이션 플레이스홀더.
// fit='contain'은 로고처럼 전체가 보여야 하는 경우(잘림 방지).
export function Thumb({
  url,
  alt,
  className,
  fit = 'cover',
}: {
  url?: string | null
  alt: string
  className?: string
  fit?: 'cover' | 'contain'
}) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={alt} className={`${fit === 'contain' ? 'object-contain' : 'object-cover'} ${className ?? ''}`} />
  }
  return (
    <div
      className={`flex items-center justify-center bg-[linear-gradient(135deg,var(--pf-surface),#222)] ${className ?? ''}`}
      aria-hidden
    >
      <span className="pf-mono text-[11px] uppercase tracking-widest text-[var(--pf-fg-fainter)]">
        {alt.slice(0, 2)}
      </span>
    </div>
  )
}

// 프로젝트 리스트 행 (홈 RECENT WORK + 프로젝트 목록 공용).
export function ProjectRow({
  project,
  href,
  logoUrl,
  showMeta = false,
}: {
  project: Project
  href: string
  logoUrl?: string | null
  showMeta?: boolean
}) {
  return (
    <Link
      href={href}
      className="pf-reveal grid grid-cols-[92px_minmax(0,1fr)_24px] items-start gap-[clamp(16px,2.5vw,28px)] rounded-[18px] p-[18px] transition-colors hover:bg-[var(--pf-surface)] sm:grid-cols-[112px_minmax(0,1fr)_24px]"
    >
      <Thumb url={logoUrl} alt={project.title} className="h-[92px] w-[92px] overflow-hidden rounded-[16px] sm:h-[112px] sm:w-[112px]" />
      <span className="flex min-w-0 flex-col gap-2 pt-0.5">
        <span className="flex flex-wrap items-baseline gap-3">
          <span className="text-[clamp(20px,2.4vw,28px)] font-bold tracking-[-0.01em] text-[var(--pf-fg)]">
            {project.title}
          </span>
          {project.titleKr && <span className="text-[13px] text-[var(--pf-fg-faint)]">{project.titleKr}</span>}
        </span>
        {project.summary && (
          <span className="max-w-[520px] text-[14px] leading-[1.55] text-[var(--pf-fg-muted)]">
            {project.summary}
          </span>
        )}
        {showMeta && (
          <span className="mt-0.5 flex gap-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--pf-fg-faint)]">
            {project.tag && <span>{project.tag}</span>}
            {project.year && <span>{project.year}</span>}
          </span>
        )}
      </span>
      <ArrowUpRight size={22} strokeWidth={1.9} className="mt-1 text-[var(--pf-ac)]" />
    </Link>
  )
}

// 섹션 공통 래퍼 (max-width + 반응형 패딩).
export function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`mx-auto w-full max-w-[1280px] px-[clamp(18px,5vw,64px)] ${className ?? ''}`}
    >
      {children}
    </section>
  )
}

// 거대 2줄 대문자 헤드라인 (밝은 줄 + 어두운 줄).
export function StackHeadline({
  top,
  bottom,
  className,
}: {
  top: string
  bottom: string
  className?: string
}) {
  return (
    <h2 className={`pf-display m-0 ${className ?? ''}`}>
      <span className="block text-[var(--pf-fg)]">{top}</span>
      <span className="block text-[var(--pf-headline-dim)]">{bottom}</span>
    </h2>
  )
}
