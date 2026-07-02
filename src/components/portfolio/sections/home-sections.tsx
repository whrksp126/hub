import { ArrowRight, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { EditableText, type EditableField } from '@/components/portfolio/editable-text'
import { StackHeadline } from '@/components/portfolio/pieces'
import { AddBtn, RemoveBtn } from '@/components/portfolio/sections/edit-controls'
import type { ProfileSkillGroup } from '@/db/schema'

type Stat = { value: string; label: string }

// 2줄 거대 헤드라인 — 공개=정적(StackHeadline과 동일 DOM) / 편집=인라인.
function EditableHeadline({
  top,
  bottom,
  className,
  edit,
}: {
  top: string
  bottom: string
  className: string
  edit?: { top: EditableField; bottom: EditableField }
}) {
  if (!edit) return <StackHeadline top={top} bottom={bottom} className={className} />
  return (
    <h2 className={`pf-display m-0 ${className}`}>
      <EditableText value={top} edit={edit.top} className="block text-[var(--pf-fg)]" />
      <EditableText value={bottom} edit={edit.bottom} className="block text-[var(--pf-headline-dim)]" />
    </h2>
  )
}

// ── HERO (헤드라인 h1 + 소개) ─────────────────────────────────────────
export function Hero({
  headTop,
  headBottom,
  intro,
  edit,
}: {
  headTop: string
  headBottom: string
  intro: string
  edit?: { headTop: EditableField; headBottom: EditableField; intro: EditableField }
}) {
  return (
    <>
      <h1 className="pf-display m-0 text-[clamp(46px,8.5vw,140px)] leading-[0.9]">
        <EditableText value={headTop} edit={edit?.headTop} className="block text-[var(--pf-fg)]" />
        <EditableText value={headBottom} edit={edit?.headBottom} className="block text-[var(--pf-headline-dim)]" />
      </h1>
      {(edit || intro) && (
        <EditableText
          value={intro}
          edit={edit?.intro}
          multiline
          className="mx-auto mt-[clamp(20px,3vw,32px)] block max-w-[520px] text-[clamp(15px,1.3vw,17px)] leading-[1.7] text-[var(--pf-fg-muted)] min-[1080px]:mx-0"
        />
      )}
    </>
  )
}

// ── STATS ─────────────────────────────────────────────────────────────
export function StatList({ stats, edit }: { stats: Stat[]; edit?: { onChange: (next: Stat[]) => void } }) {
  if (stats.length === 0 && !edit) return null
  return (
    <div className="mt-[clamp(28px,4vw,44px)] flex flex-wrap items-start justify-center gap-x-[clamp(16px,4vw,56px)] gap-y-6 min-[1080px]:justify-start">
      {stats.map((s, i) => (
        <div key={i} className={edit ? 'group relative' : undefined}>
          {edit && <RemoveBtn onClick={() => edit.onChange(stats.filter((_, j) => j !== i))} className="-right-3 -top-2" />}
          <EditableText
            value={s.value}
            edit={edit ? { onCommit: (v) => edit.onChange(stats.map((x, j) => (j === i ? { ...x, value: v } : x))), placeholder: '00', ariaLabel: '스탯 값' } : undefined}
            className="block text-[clamp(38px,4.5vw,60px)] font-extrabold leading-none tracking-[-0.03em] text-[var(--pf-fg)]"
          />
          <EditableText
            value={s.label}
            edit={edit ? { onCommit: (v) => edit.onChange(stats.map((x, j) => (j === i ? { ...x, label: v } : x))), placeholder: '설명', ariaLabel: '스탯 라벨' } : undefined}
            className="mx-auto mt-2.5 block max-w-[96px] text-[11.5px] font-semibold uppercase leading-[1.45] tracking-[0.13em] text-[var(--pf-fg-faint)] sm:max-w-[108px] min-[1080px]:mx-0"
          />
        </div>
      ))}
      {edit && <AddBtn label="스탯" onClick={() => edit.onChange([...stats, { value: '', label: '' }])} className="mt-1" />}
    </div>
  )
}

// ── TECH STACK ────────────────────────────────────────────────────────
export function SkillGrid({
  skills,
  edit,
}: {
  skills: ProfileSkillGroup[]
  edit?: { onChange: (next: ProfileSkillGroup[]) => void }
}) {
  if (skills.length === 0 && !edit) return null
  const set = (next: ProfileSkillGroup[]) => edit?.onChange(next)
  return (
    <section className="cv-auto pt-[clamp(56px,8vw,110px)]">
      <div className="pf-reveal mb-[clamp(28px,4vw,48px)] text-center min-[1080px]:text-left">
        <StackHeadline top="TECH" bottom="STACK" className="text-[clamp(40px,7vw,104px)]" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
        {skills.map((g, i) => (
          <div
            key={i}
            className="pf-reveal group relative rounded-[22px] border border-white/[0.07] bg-[var(--pf-surface)] p-[clamp(24px,3vw,32px)] text-left"
          >
            {edit && <RemoveBtn onClick={() => set(skills.filter((_, j) => j !== i))} className="right-3 top-3" />}
            <EditableText
              value={g.area}
              edit={edit ? { onCommit: (v) => set(skills.map((x, j) => (j === i ? { ...x, area: v } : x))), placeholder: '영역 (예: Frontend)', ariaLabel: '스킬 영역' } : undefined}
              className="mb-[18px] block text-[13px] font-bold uppercase tracking-[0.04em] text-[var(--pf-ac)]"
            />
            <div className="flex flex-col gap-2.5">
              {(g.items ?? []).map((it, j) => (
                <div key={j} className={edit ? 'group/item flex items-center gap-2' : undefined}>
                  <EditableText
                    value={it}
                    edit={edit ? { onCommit: (v) => set(skills.map((x, k) => (k === i ? { ...x, items: x.items.map((y, l) => (l === j ? v : y)) } : x))), placeholder: '항목', ariaLabel: '스킬 항목' } : undefined}
                    className={`text-[15px] leading-[1.4] text-[var(--pf-fg-dim)]${edit ? ' flex-1' : ''}`}
                  />
                  {edit && (
                    <button
                      type="button"
                      onClick={() => set(skills.map((x, k) => (k === i ? { ...x, items: x.items.filter((_, l) => l !== j) } : x)))}
                      className="text-[var(--pf-fg-faint)] opacity-0 transition hover:text-red-400 group-hover/item:opacity-100"
                      aria-label="항목 삭제"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              {edit && (
                <AddBtn
                  label="항목"
                  onClick={() => set(skills.map((x, k) => (k === i ? { ...x, items: [...(x.items ?? []), ''] } : x)))}
                />
              )}
            </div>
          </div>
        ))}
        {edit && (
          <button
            type="button"
            onClick={() => set([...skills, { area: '', items: [] }])}
            className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-white/12 text-sm font-semibold text-[var(--pf-fg-muted)] transition-colors hover:border-[var(--pf-ac)] hover:text-[var(--pf-fg)]"
          >
            <Plus size={18} /> 스택 영역
          </button>
        )}
      </div>
    </section>
  )
}

// ── CTA ───────────────────────────────────────────────────────────────
export function CtaSection({
  ctaTop,
  ctaBottom,
  ctaText,
  contactHref,
  edit,
}: {
  ctaTop: string
  ctaBottom: string
  ctaText: string
  contactHref: string
  edit?: { headline: { top: EditableField; bottom: EditableField }; text: EditableField }
}) {
  return (
    <section className="cv-auto pt-[clamp(56px,8vw,110px)]">
      <div className="pf-reveal">
        <EditableHeadline
          top={ctaTop}
          bottom={ctaBottom}
          className="text-[clamp(44px,9vw,132px)] !leading-[0.88]"
          edit={edit?.headline}
        />
        {(edit || ctaText) && (
          <EditableText
            value={ctaText}
            edit={edit?.text}
            multiline
            className="mx-auto mt-[clamp(20px,3vw,28px)] block max-w-[460px] text-[16px] leading-[1.65] text-[var(--pf-fg-muted)] min-[1080px]:mx-0"
          />
        )}
        {edit ? (
          <span className="mt-[clamp(24px,3vw,36px)] inline-flex items-center gap-2.5 rounded-full bg-[var(--pf-ac)] px-7 py-4 text-[14px] font-semibold text-[#141414]">
            프로젝트 문의하기 <ArrowRight size={16} strokeWidth={2} />
          </span>
        ) : (
          <Link
            href={contactHref}
            className="mt-[clamp(24px,3vw,36px)] inline-flex items-center gap-2.5 rounded-full bg-[var(--pf-ac)] px-7 py-4 text-[14px] font-semibold text-[#141414] transition hover:brightness-110"
          >
            프로젝트 문의하기 <ArrowRight size={16} strokeWidth={2} />
          </Link>
        )}
      </div>
    </section>
  )
}
