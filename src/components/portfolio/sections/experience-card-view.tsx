import { Plus, X } from 'lucide-react'
import { EditableText, type EditableField } from '@/components/portfolio/editable-text'
import { Thumb } from '@/components/portfolio/pieces'
import { AddBtn, RemoveBtn } from '@/components/portfolio/sections/edit-controls'
import { InlineImageUpload } from '@/components/portfolio/sections/inline-image'
import { SectionMediaEditor, SectionMediaView } from '@/components/portfolio/sections/section-media'
import type { SectionMedia } from '@/db/schema'

type ImageEdit = { url: string | null; onUploaded: (id: number, url: string) => void; onRemove: () => void }
export type ExperienceViewData = {
  company: string
  role: string | null
  period: string | null
  length: string | null
  context: string | null
  current: boolean
  points: string[]
  stack: string[]
  media: SectionMedia[]
  mediaUrls: Record<number, string>
  logoUrl: string | null
  coverUrl: string | null
}
export type ExperienceEdit = {
  field: (key: 'company' | 'role' | 'period' | 'length' | 'context', placeholder?: string) => EditableField
  cover: ImageEdit
  logo: ImageEdit
  current: boolean
  onCurrent: (v: boolean) => void
  onPoints: (next: string[]) => void
  onStack: (next: string[]) => void
  onMedia: (next: SectionMedia[]) => void
}

// 경력 카드 — 공개 experience 페이지 + 경력 편집기 단일 소스.
export function ExperienceCardView({ data, edit }: { data: ExperienceViewData; edit?: ExperienceEdit }) {
  const points = data.points ?? []
  const stack = data.stack ?? []
  const media = data.media ?? []
  const current = edit ? edit.current : data.current

  return (
    <div className="pf-reveal overflow-hidden rounded-[24px] border border-white/[0.07] bg-[var(--pf-surface)]">
      {edit ? (
        <InlineImageUpload
          url={edit.cover.url}
          alt={data.company}
          onUploaded={edit.cover.onUploaded}
          onRemove={edit.cover.onRemove}
          placeholderLabel="커버 추가 (권장 1024×500)"
          className="block aspect-[1024/500] w-full"
        />
      ) : (
        data.coverUrl && (
          <div className="aspect-[1024/500] w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.coverUrl} alt={data.company} className="h-full w-full object-cover" />
          </div>
        )
      )}
      <div className="grid gap-[clamp(20px,4vw,48px)] p-[clamp(24px,3.5vw,40px)] sm:grid-cols-[minmax(0,210px)_minmax(0,1fr)]">
        <div>
          {edit ? (
            <InlineImageUpload
              url={edit.logo.url}
              alt={data.company}
              onUploaded={edit.logo.onUploaded}
              onRemove={edit.logo.onRemove}
              placeholderLabel="로고 (정사각형)"
              className="mb-[18px] h-14 w-14 rounded-[14px]"
            />
          ) : (
            data.logoUrl && <Thumb url={data.logoUrl} alt={data.company} className="mb-[18px] h-14 w-14 rounded-[14px]" />
          )}
          <EditableText
            value={data.period ?? ''}
            edit={edit?.field('period', '2023.06 — 2026.02')}
            className="block text-[13px] font-semibold leading-[1.5] text-[var(--pf-fg-dim)]"
          />
          {(edit || data.length) && (
            <EditableText
              value={data.length ?? ''}
              edit={edit?.field('length', '2년 9개월')}
              className="mt-1.5 block text-[12px] text-[var(--pf-fg-faint)]"
            />
          )}
          {edit ? (
            <label className="mt-3.5 inline-flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-[var(--pf-fg-dim)]">
              <input type="checkbox" checked={current} onChange={(e) => edit.onCurrent(e.target.checked)} className="h-3.5 w-3.5 accent-[var(--pf-ac)]" />
              현재 재직
            </label>
          ) : (
            current && (
              <div className="mt-3.5 inline-flex items-center gap-[7px] rounded-full bg-[rgba(182,232,75,0.12)] px-3 py-[5px] text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--pf-lime-2)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--pf-lime-2)]" />
                현재
              </div>
            )
          )}
        </div>
        <div>
          <div className="mb-2 flex flex-wrap items-baseline gap-3.5">
            <EditableText
              value={data.company}
              edit={edit?.field('company', '회사명')}
              className="m-0 text-[clamp(23px,3vw,34px)] font-bold tracking-[-0.015em] text-[var(--pf-fg)]"
            />
            {(edit || data.role) && (
              <EditableText value={data.role ?? ''} edit={edit?.field('role', '역할')} className="text-[13px] font-semibold text-[var(--pf-ac)]" />
            )}
          </div>
          {(edit || data.context) && (
            <EditableText
              value={data.context ?? ''}
              edit={edit?.field('context', '한 줄 설명')}
              multiline
              className="mb-5 block text-[14px] leading-[1.5] text-[var(--pf-fg-faint)]"
            />
          )}
          {(points.length > 0 || edit) && (
            <div className="mb-[22px] flex flex-col gap-3">
              {points.map((pt, i) => (
                <div key={i} className="group grid grid-cols-[18px_1fr_18px] gap-2.5 text-[15px] leading-[1.6] text-[var(--pf-fg-dim)]">
                  <span className="font-bold text-[var(--pf-ac)]">·</span>
                  <EditableText
                    value={pt}
                    edit={edit ? { onCommit: (v) => edit.onPoints(points.map((x, j) => (j === i ? v : x)).filter(Boolean)), placeholder: '성과를 한 줄로', ariaLabel: '성과' } : undefined}
                    className="block"
                  />
                  {edit && (
                    <button type="button" onClick={() => edit.onPoints(points.filter((_, j) => j !== i))} aria-label="삭제" className="text-[var(--pf-fg-faint)] opacity-0 transition hover:text-red-400 group-hover:opacity-100">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              {edit && <AddBtn label="성과" onClick={() => edit.onPoints([...points, '새 성과'])} className="self-start" />}
            </div>
          )}
          {(stack.length > 0 || edit) && (
            <div className="flex flex-wrap items-center gap-[7px]">
              {stack.map((t, i) =>
                edit ? (
                  <span key={i} className="group flex items-center gap-1 rounded-full border border-white/[0.12] px-[11px] py-[5px] text-[11.5px] text-[var(--pf-fg-muted)]">
                    <EditableText value={t} edit={{ onCommit: (v) => edit.onStack(stack.map((x, j) => (j === i ? v : x)).filter(Boolean)), placeholder: 'Tool', ariaLabel: '스택' }} />
                    <button type="button" onClick={() => edit.onStack(stack.filter((_, j) => j !== i))} aria-label="삭제" className="text-[var(--pf-fg-faint)] hover:text-red-400">
                      <X size={11} />
                    </button>
                  </span>
                ) : (
                  <span key={i} className="rounded-full border border-white/[0.12] px-[11px] py-[5px] text-[11.5px] text-[var(--pf-fg-muted)]">
                    {t}
                  </span>
                ),
              )}
              {edit && (
                <button
                  type="button"
                  onClick={() => edit.onStack([...stack, 'New'])}
                  className="flex items-center gap-1 rounded-full border border-dashed border-white/15 px-[11px] py-[5px] text-[11.5px] font-semibold text-[var(--pf-fg-muted)] hover:border-[var(--pf-ac)] hover:text-[var(--pf-fg)]"
                >
                  <Plus size={12} /> 스택
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {(media.length > 0 || edit) && (
        <div className="border-t border-white/[0.06] p-[clamp(24px,3.5vw,40px)] pt-[clamp(20px,2.5vw,28px)]">
          {edit ? (
            <SectionMediaEditor media={media} urls={data.mediaUrls} onChange={edit.onMedia} />
          ) : (
            <SectionMediaView media={media} urls={data.mediaUrls} />
          )}
        </div>
      )}
    </div>
  )
}
