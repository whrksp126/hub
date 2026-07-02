'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { useState } from 'react'
import { PortfolioColumns } from '@/components/portfolio/portfolio-columns'
import { SaveBadge, type SaveStatus } from '@/components/portfolio/sections/edit-controls'
import type { Profile } from '@/db/schema'

// 상세(프로젝트·경력) 인라인 편집 공용 셸: 강조색 wrapper + 좌측 읽기전용 프로필 카드 + 본문 + 설정/저장 툴바.
export function DetailEditorFrame({
  profile,
  avatarUrl,
  backHref,
  backLabel,
  publicHref,
  status,
  error,
  settings,
  children,
}: {
  profile: Profile
  avatarUrl: string | null
  backHref: string
  backLabel: string
  publicHref?: string
  status: SaveStatus
  error: string | null
  settings?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="pf pb-24" style={{ '--pf-ac': profile.accent } as CSSProperties}>
      <PortfolioColumns profile={profile} avatarUrl={avatarUrl} align="left">
        <Link
          href={backHref}
          className="mb-[clamp(28px,4vw,48px)] inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-[var(--pf-surface)] px-[18px] py-2.5 text-[13px] font-semibold text-[var(--pf-fg-dim)] hover:border-[var(--pf-fg)] hover:text-[var(--pf-fg)]"
        >
          <ArrowLeft size={15} strokeWidth={2} className="text-[var(--pf-ac)]" /> {backLabel}
        </Link>
        {children}
      </PortfolioColumns>

      {settings && <div className="mx-auto w-full max-w-[1280px] px-[clamp(18px,5vw,64px)]">{settings}</div>}

      <div className="sticky bottom-3 z-40 mt-8 px-[clamp(18px,5vw,64px)]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-end gap-4 rounded-2xl border border-white/[0.1] bg-[rgba(20,20,20,0.94)] px-4 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <SaveBadge status={status} error={error} />
          {publicHref && (
            <a href={publicHref} target="_blank" rel="noreferrer" className="text-[13px] text-[var(--pf-fg-muted)] hover:text-[var(--pf-ac)]">
              공개 페이지 ↗
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// 설정 패널 공용 입력 (blur 시 저장)
export function SettingInput({
  label,
  value,
  onSave,
  placeholder,
  type = 'text',
  className = '',
}: {
  label: string
  value: string
  onSave: (v: string) => void
  placeholder?: string
  type?: string
  className?: string
}) {
  const [v, setV] = useState(value)
  return (
    <div className={className}>
      <label className="mb-1.5 block text-[11px] font-medium text-[var(--pf-fg-faint)]">{label}</label>
      <input
        type={type}
        value={v}
        placeholder={placeholder}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => v.trim() !== (value ?? '').trim() && onSave(v)}
        className="w-full rounded-lg border border-white/10 bg-[var(--pf-surface)] px-3 py-2 text-sm text-[var(--pf-fg)] outline-none transition-colors focus:border-[var(--pf-ac)] placeholder:text-[var(--pf-fg-faint)]"
      />
    </div>
  )
}

export function SettingsPanel({ children }: { children: ReactNode }) {
  return (
    <details className="mt-10 rounded-2xl border border-white/[0.08] bg-[var(--pf-surface)]/40">
      <summary className="cursor-pointer select-none px-5 py-4 text-sm font-semibold text-[var(--pf-fg-dim)]">설정</summary>
      <div className="grid gap-4 border-t border-white/[0.07] px-5 py-5">{children}</div>
    </details>
  )
}
