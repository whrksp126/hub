'use client'

import { ArrowUpRight, ChevronDown, ChevronUp, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import { StackHeadline } from '@/components/portfolio/pieces'

export type ColItem = {
  id: number
  title: string
  featured: boolean
  published: boolean
}

type Actions = {
  // featured 개념이 없는 컬렉션(경력)은 생략 → 미리보기는 앞에서 previewLimit개.
  setFeatured?: (id: number, featured: boolean) => Promise<{ ok: boolean; error?: string }>
  reorder: (profileId: number, orderedIds: number[]) => Promise<{ ok: boolean; error?: string }>
  remove: (id: number) => Promise<{ ok: boolean; error?: string }>
}

// 홈 큐레이션 섹션: 공개와 동일한 미리보기(featured) + 접이식 전체 관리(노출/순서/편집/삭제/추가).
export function HomeCollection<T extends ColItem>({
  titleTop,
  titleBottom,
  items: initial,
  profileId,
  manageHref,
  manageLabel,
  addLabel,
  createAction,
  editHref,
  previewClassName,
  previewCard,
  previewLimit,
  actions,
}: {
  titleTop: string
  titleBottom: string
  items: T[]
  profileId: number
  manageHref: string
  manageLabel: string
  addLabel: string
  createAction: (formData: FormData) => void
  editHref: (item: T) => string
  previewClassName: string
  previewCard: (item: T) => ReactNode
  previewLimit?: number
  actions: Actions
}) {
  const [items, setItems] = useState<T[]>(initial)
  const reorderTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasFeatured = !!actions.setFeatured
  const featured = hasFeatured
    ? items.filter((i) => i.featured && i.published)
    : items.slice(0, previewLimit ?? items.length)

  function toggle(item: T) {
    if (!actions.setFeatured) return
    const next = !item.featured
    setItems((arr) => arr.map((x) => (x.id === item.id ? { ...x, featured: next } : x)))
    void actions.setFeatured(item.id, next)
  }

  function move(index: number, dir: -1 | 1) {
    const j = index + dir
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[index], next[j]] = [next[j], next[index]]
    setItems(next)
    if (reorderTimer.current) clearTimeout(reorderTimer.current)
    const ids = next.map((x) => x.id)
    reorderTimer.current = setTimeout(() => void actions.reorder(profileId, ids), 400)
  }

  function del(item: T) {
    if (!window.confirm(`“${item.title}”을(를) 삭제할까요? 되돌릴 수 없습니다.`)) return
    setItems((arr) => arr.filter((x) => x.id !== item.id))
    void actions.remove(item.id)
  }

  return (
    <section className="mt-[clamp(48px,7vw,96px)]">
      <div className="mb-[clamp(20px,3vw,32px)] flex flex-wrap items-end justify-between gap-4">
        <StackHeadline top={titleTop} bottom={titleBottom} className="text-[clamp(40px,7vw,104px)]" />
        <Link
          href={manageHref}
          className="flex items-center gap-2.5 rounded-full border border-white/[0.16] px-5 py-2.5 text-[13px] font-semibold text-[var(--pf-fg-dim)] hover:border-[var(--pf-fg)] hover:text-[var(--pf-fg)]"
        >
          {manageLabel} <ArrowUpRight size={15} strokeWidth={2} className="text-[var(--pf-ac)]" />
        </Link>
      </div>

      {/* 공개와 동일한 미리보기 (홈에 표시되는 것) */}
      {featured.length > 0 ? (
        <div className={previewClassName}>{featured.map((item) => previewCard(item))}</div>
      ) : (
        <div className="rounded-[18px] border border-dashed border-white/[0.12] p-8 text-center text-sm text-[var(--pf-fg-muted)]">
          {hasFeatured
            ? '홈에 표시할 항목이 없습니다. 아래 “관리”에서 표시할 항목을 켜세요.'
            : '항목이 없습니다. 아래 “관리”에서 추가하세요.'}
        </div>
      )}

      {/* 관리: 전체 목록에서 표시 선택 · 순서 · 편집 · 삭제 · 추가 */}
      <details className="mt-4 rounded-2xl border border-white/[0.08] bg-[var(--pf-surface)]/40">
        <summary className="cursor-pointer select-none px-5 py-3.5 text-sm font-semibold text-[var(--pf-fg-dim)]">
          {hasFeatured ? `관리 · 표시 ${featured.length} / 전체 ${items.length}` : `관리 · 전체 ${items.length}`}
        </summary>
        <div className="border-t border-white/[0.07] p-3">
          <ul className="flex flex-col gap-1.5">
            {items.map((item, i) => (
              <li key={item.id} className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-white/[0.03]">
                <div className="flex flex-col text-[var(--pf-fg-faint)]">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="hover:text-[var(--pf-fg)] disabled:opacity-25" aria-label="위로"><ChevronUp size={14} /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="hover:text-[var(--pf-fg)] disabled:opacity-25" aria-label="아래로"><ChevronDown size={14} /></button>
                </div>
                <span className="min-w-0 flex-1 truncate text-sm text-[var(--pf-fg)]">
                  {item.title}
                  {!item.published && <span className="ml-2 rounded-full bg-white/[0.08] px-1.5 py-0.5 text-[10px] text-[var(--pf-fg-faint)]">초안</span>}
                </span>
                {hasFeatured && (
                  <button
                    type="button"
                    onClick={() => toggle(item)}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      item.featured ? 'bg-[var(--pf-ac)]/15 text-[var(--pf-ac)]' : 'border border-white/10 text-[var(--pf-fg-faint)] hover:text-[var(--pf-fg)]'
                    }`}
                    title={item.featured ? '홈에서 숨기기' : '홈에 표시'}
                  >
                    {item.featured ? <Eye size={12} /> : <EyeOff size={12} />}
                    {item.featured ? '홈 표시' : '숨김'}
                  </button>
                )}
                <Link href={editHref(item)} className="rounded-lg p-1.5 text-[var(--pf-fg-faint)] hover:text-[var(--pf-ac)]" title="편집"><Pencil size={14} /></Link>
                <button type="button" onClick={() => del(item)} className="rounded-lg p-1.5 text-[var(--pf-fg-faint)] hover:text-red-400" title="삭제"><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
          <form action={createAction} className="mt-2">
            <input type="hidden" name="profileId" value={profileId} />
            <button type="submit" className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 py-2.5 text-xs font-semibold text-[var(--pf-fg-muted)] transition-colors hover:border-[var(--pf-ac)] hover:text-[var(--pf-fg)]">
              <Plus size={14} /> {addLabel}
            </button>
          </form>
        </div>
      </details>
    </section>
  )
}
