'use client'

import { Check, Loader2, Plus, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
type ActionResult = { ok: boolean; error?: string }

// 인라인 자동저장 공용 훅: 낙관적 로컬 상태 + (디바운스) 서버 patch + 저장 상태.
export function useAutoSave<T extends object>(
  initial: T,
  save: (partial: Partial<T>) => Promise<ActionResult>,
) {
  const [data, setData] = useState<T>(initial)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const patch = useCallback(
    (partial: Partial<T>, debounce = false) => {
      setData((d) => ({ ...d, ...partial }))
      const run = async () => {
        setStatus('saving')
        setError(null)
        const res = await save(partial)
        if (res.ok) {
          setStatus('saved')
          if (savedTimer.current) clearTimeout(savedTimer.current)
          savedTimer.current = setTimeout(() => setStatus('idle'), 1600)
        } else {
          setStatus('error')
          setError(res.error ?? '저장 실패')
        }
      }
      if (debounce) {
        const key = Object.keys(partial).join(',')
        if (timers.current[key]) clearTimeout(timers.current[key])
        timers.current[key] = setTimeout(run, 600)
      } else {
        void run()
      }
    },
    [save],
  )

  return { data, setData, patch, status, error }
}

export function SaveBadge({ status, error }: { status: SaveStatus; error: string | null }) {
  if (status === 'saving')
    return (
      <span className="flex items-center gap-1.5 text-[12px] text-[var(--pf-fg-muted)]">
        <Loader2 size={13} className="animate-spin" /> 저장 중…
      </span>
    )
  if (status === 'saved')
    return (
      <span className="flex items-center gap-1 text-[12px] text-[var(--pf-lime-2)]">
        <Check size={13} /> 저장됨
      </span>
    )
  if (status === 'error')
    return (
      <span className="text-[12px] text-red-400" title={error ?? ''}>
        저장 실패
      </span>
    )
  return <span className="text-[12px] text-[var(--pf-fg-fainter)]">자동 저장</span>
}

export function RemoveBtn({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="삭제"
      className={`absolute z-10 hidden h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[var(--pf-fg-faint)] hover:text-red-400 group-hover:flex ${className}`}
    >
      <X size={13} />
    </button>
  )
}

export function AddBtn({ label, onClick, className = '' }: { label: string; onClick?: () => void; className?: string }) {
  return (
    <button
      type={onClick ? 'button' : 'submit'}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border border-dashed border-white/15 px-3.5 py-1.5 text-xs font-semibold text-[var(--pf-fg-muted)] transition-colors hover:border-[var(--pf-ac)] hover:text-[var(--pf-fg)] ${className}`}
    >
      <Plus size={14} /> {label}
    </button>
  )
}
