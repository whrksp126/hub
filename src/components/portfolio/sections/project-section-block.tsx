import { Check, X } from 'lucide-react'
import { EditableText } from '@/components/portfolio/editable-text'
import { AddBtn } from '@/components/portfolio/sections/edit-controls'
import { ErdDiagram, ErdDiagramEditor } from '@/components/portfolio/sections/erd-diagram'
import { DiagramEditor, MermaidDiagram } from '@/components/portfolio/sections/mermaid-diagram'
import { SectionMediaEditor, SectionMediaView } from '@/components/portfolio/sections/section-media'
import type { ProjectSection, ProjectSectionKind, SectionMedia } from '@/db/schema'

const KIND_LABELS: Record<ProjectSectionKind, string> = {
  default: '기본',
  lead: '리드',
  features: '기능 그리드',
  challenge: '도전(문제·해결)',
  timeline: '타임라인',
  steps: '단계',
  diagram: '다이어그램(플로우/시퀀스)',
  erd: 'ERD',
  gallery: '갤러리(이미지/영상)',
  specs: '스펙(라벨·값)',
}
const KINDS: ProjectSectionKind[] = ['default', 'lead', 'features', 'challenge', 'timeline', 'steps', 'diagram', 'erd', 'gallery', 'specs']

type Edit = { onChange: (next: ProjectSection) => void; onRemove: () => void }

// 같은 데이터(제목/본문/불릿)를 kind별로 다른 시각 레이아웃으로 렌더. 편집 모드에서도 동일 레이아웃(편집=결과).
export function ProjectSectionBlock({ sec, edit, mediaUrls = {} }: { sec: ProjectSection; edit?: Edit; mediaUrls?: Record<number, string> }) {
  const kind = sec.kind ?? 'default'
  const bullets = sec.bullets ?? []
  const media = sec.media ?? []
  const set = (patch: Partial<ProjectSection>) => edit?.onChange({ ...sec, ...patch })
  // 갤러리는 보여줄 미디어가 없으면 공개에서 통째로 숨긴다(있으면 표현, 없으면 미표시).
  if (kind === 'gallery' && !edit && media.filter((m) => (m.kind === 'embed' ? m.url : m.mediaId)).length === 0) return null
  const headField = edit ? { onCommit: (v: string) => set({ heading: v }), placeholder: '제목', ariaLabel: '섹션 제목' } : undefined
  const bodyField = edit ? { onCommit: (v: string) => set({ body: v }), placeholder: '본문', ariaLabel: '섹션 본문' } : undefined
  const bulletField = (k: number) =>
    edit ? { onCommit: (v: string) => set({ bullets: bullets.map((b, j) => (j === k ? v : b)).filter(Boolean) }), placeholder: '항목', ariaLabel: '항목' } : undefined
  const removeBullet = (k: number) => set({ bullets: bullets.filter((_, j) => j !== k) })
  const addBullet = () => set({ bullets: [...bullets, '새 항목'] })

  const eyebrow = (
    <EditableText value={sec.heading} edit={headField} className="mb-5 block text-[13px] font-bold uppercase tracking-[0.1em] text-[var(--pf-ac)]" />
  )
  const bulletX = (k: number) =>
    edit ? (
      <button
        type="button"
        onClick={() => removeBullet(k)}
        aria-label="삭제"
        className="absolute -right-1 -top-1 z-10 text-[var(--pf-fg-faint)] opacity-0 transition hover:text-red-400 group-hover/i:opacity-100"
      >
        <X size={12} />
      </button>
    ) : null

  // 다이어그램/ERD 하단 설명 캡션(공용).
  const DiagramCaptions = () => (
    <div className="mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-2">
      {bullets.map((b, k) => (
        <div key={k} className="group/i relative flex gap-2 text-[13px] leading-[1.55] text-[var(--pf-fg-muted)]">
          <span className="text-[var(--pf-ac)]">·</span>
          <EditableText value={b} edit={bulletField(k)} multiline className="block" />
          {bulletX(k)}
        </div>
      ))}
      {edit && <AddBtn label="설명" onClick={addBullet} className="self-start" />}
    </div>
  )

  let inner: React.ReactNode

  if (kind === 'lead') {
    inner = (
      <>
        {eyebrow}
        {(edit || sec.body) && (
          <EditableText value={sec.body ?? ''} edit={bodyField} multiline className="block max-w-[760px] text-[clamp(18px,2vw,24px)] font-medium leading-[1.5] text-[var(--pf-fg)]" />
        )}
        {(bullets.length > 0 || edit) && (
          <div className="mt-7 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {bullets.map((b, k) => (
              <div key={k} className="group/i relative border-l-2 border-[var(--pf-ac)] pl-4 text-[14px] leading-[1.6] text-[var(--pf-fg-dim)]">
                <EditableText value={b} edit={bulletField(k)} multiline className="block" />
                {bulletX(k)}
              </div>
            ))}
            {edit && <AddBtn label="항목" onClick={addBullet} className="self-start" />}
          </div>
        )}
      </>
    )
  } else if (kind === 'features') {
    inner = (
      <>
        {eyebrow}
        <div className="grid gap-4 sm:grid-cols-2">
          {bullets.map((b, k) => {
            const [title, ...rest] = b.split(' — ')
            const desc = rest.join(' — ')
            return (
              <div key={k} className="group/i relative flex flex-col gap-2 rounded-[18px] border border-white/[0.07] bg-[var(--pf-surface)] p-5">
                <span className="pf-mono text-[12px] font-bold text-[var(--pf-ac)]">{String(k + 1).padStart(2, '0')}</span>
                {edit ? (
                  <EditableText value={b} edit={bulletField(k)} multiline className="block text-[15px] font-semibold leading-[1.45] text-[var(--pf-fg)]" />
                ) : (
                  <>
                    <span className="text-[15px] font-bold leading-[1.35] text-[var(--pf-fg)]">{title}</span>
                    {desc && <span className="text-[13px] leading-[1.55] text-[var(--pf-fg-muted)]">{desc}</span>}
                  </>
                )}
                {bulletX(k)}
              </div>
            )
          })}
          {edit && (
            <button
              type="button"
              onClick={addBullet}
              className="flex min-h-[90px] items-center justify-center rounded-[18px] border-2 border-dashed border-white/12 text-sm font-semibold text-[var(--pf-fg-muted)] transition-colors hover:border-[var(--pf-ac)] hover:text-[var(--pf-fg)]"
            >
              + 항목
            </button>
          )}
        </div>
      </>
    )
  } else if (kind === 'challenge') {
    inner = (
      <div className="rounded-[22px] border border-white/[0.08] bg-[var(--pf-surface-2)] p-[clamp(24px,3.5vw,36px)]">
        <div className="mb-3 flex flex-wrap items-center gap-2.5">
          <span className="rounded-full bg-[var(--pf-ac)]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--pf-ac)]">도전</span>
          <EditableText value={sec.heading} edit={headField} className="text-[clamp(18px,2vw,24px)] font-bold tracking-[-0.01em] text-[var(--pf-fg)]" />
        </div>
        {(edit || sec.body) && (
          <EditableText value={sec.body ?? ''} edit={bodyField} multiline className="mb-5 block text-[14px] leading-[1.6] text-[var(--pf-fg-faint)]" />
        )}
        {(bullets.length > 0 || edit) && (
          <div className="flex flex-col gap-2.5">
            {bullets.map((b, k) => {
              const isResult = b.startsWith('결과:') || b.startsWith('결과 :')
              return (
                <div key={k} className="group/i relative grid grid-cols-[16px_1fr] gap-2.5 text-[14px] leading-[1.6]">
                  <span className={`flex justify-center pt-0.5 font-bold ${isResult ? 'text-[var(--pf-lime-2)]' : 'text-[var(--pf-ac)]'}`}>
                    {isResult ? <Check size={14} strokeWidth={3} /> : '·'}
                  </span>
                  <EditableText
                    value={b}
                    edit={bulletField(k)}
                    multiline
                    className={`block ${isResult ? 'font-semibold text-[var(--pf-lime-2)]' : 'text-[var(--pf-fg-dim)]'}`}
                  />
                  {bulletX(k)}
                </div>
              )
            })}
            {edit && <AddBtn label="항목" onClick={addBullet} className="self-start" />}
          </div>
        )}
      </div>
    )
  } else if (kind === 'timeline') {
    inner = (
      <>
        {eyebrow}
        <div className="flex flex-col gap-5 border-l border-white/[0.14] pl-6">
          {bullets.map((b, k) => (
            <div key={k} className="group/i relative">
              <span className="absolute -left-[27px] top-[7px] h-2.5 w-2.5 rounded-full bg-[var(--pf-ac)]" />
              <EditableText value={b} edit={bulletField(k)} multiline className="block text-[14px] leading-[1.6] text-[var(--pf-fg-dim)]" />
              {bulletX(k)}
            </div>
          ))}
          {edit && <AddBtn label="항목" onClick={addBullet} className="self-start" />}
        </div>
      </>
    )
  } else if (kind === 'steps') {
    inner = (
      <>
        {eyebrow}
        <div className="flex flex-col gap-4">
          {bullets.map((b, k) => (
            <div key={k} className="group/i relative flex gap-4">
              <span className="pf-display flex-none text-[clamp(20px,2.4vw,30px)] leading-none text-[var(--pf-headline-dim)]">{String(k + 1).padStart(2, '0')}</span>
              <EditableText value={b} edit={bulletField(k)} multiline className="block pt-1 text-[14px] leading-[1.6] text-[var(--pf-fg-dim)]" />
              {bulletX(k)}
            </div>
          ))}
          {edit && <AddBtn label="항목" onClick={addBullet} className="self-start" />}
        </div>
      </>
    )
  } else if (kind === 'diagram') {
    inner = (
      <>
        {eyebrow}
        {edit ? (
          <DiagramEditor code={sec.body ?? ''} onCommit={(v) => set({ body: v })} />
        ) : (
          <MermaidDiagram code={sec.body ?? ''} className="rounded-[20px] border border-white/[0.07] bg-[var(--pf-surface)] p-2" />
        )}
        {(bullets.length > 0 || edit) && <DiagramCaptions />}
      </>
    )
  } else if (kind === 'erd') {
    inner = (
      <>
        {eyebrow}
        {edit ? (
          <ErdDiagramEditor code={sec.body ?? ''} onCommit={(v) => set({ body: v })} />
        ) : (
          <div className="rounded-[20px] border border-white/[0.07] bg-[var(--pf-surface)] p-2">
            <ErdDiagram code={sec.body ?? ''} />
          </div>
        )}
        {(bullets.length > 0 || edit) && <DiagramCaptions />}
      </>
    )
  } else if (kind === 'gallery') {
    inner = (
      <>
        {eyebrow}
        {(edit || sec.body) && (
          <EditableText value={sec.body ?? ''} edit={bodyField} multiline className="mb-5 block max-w-[720px] text-[15px] leading-[1.7] text-[var(--pf-fg-dim)]" />
        )}
        {edit ? (
          <SectionMediaEditor media={media} urls={mediaUrls} onChange={(next: SectionMedia[]) => set({ media: next })} />
        ) : (
          <SectionMediaView media={media} urls={mediaUrls} />
        )}
      </>
    )
  } else if (kind === 'specs') {
    inner = (
      <>
        {eyebrow}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
          {bullets.map((b, k) => {
            const [label, ...rest] = b.split(' — ')
            const value = rest.join(' — ')
            return (
              <div key={k} className="group/i relative rounded-[14px] border border-white/[0.07] bg-[var(--pf-surface)] px-4 py-3">
                {edit ? (
                  <EditableText value={b} edit={bulletField(k)} className="block text-[13px] text-[var(--pf-fg-dim)]" />
                ) : (
                  <>
                    <span className="block text-[clamp(17px,2vw,20px)] font-bold leading-tight tracking-[-0.01em] text-[var(--pf-fg)]">{value || label}</span>
                    {value && <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--pf-fg-faint)]">{label}</span>}
                  </>
                )}
                {bulletX(k)}
              </div>
            )
          })}
          {edit && <AddBtn label="스펙" onClick={addBullet} className="self-start" />}
        </div>
      </>
    )
  } else {
    // default: 좌측 제목 + 우측 본문/불릿 2단
    inner = (
      <div className="grid gap-[clamp(16px,4vw,48px)] rounded-[20px] border border-white/[0.06] bg-[var(--pf-surface-2)] p-[clamp(24px,3.5vw,36px)] sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
        <EditableText value={sec.heading} edit={headField} className="block pt-[3px] text-[13px] font-bold uppercase tracking-[0.04em] text-[var(--pf-ac)]" />
        <div className="flex min-w-0 flex-col gap-4">
          {(edit || sec.body) && (
            <EditableText value={sec.body ?? ''} edit={bodyField} multiline className="m-0 block text-[clamp(15px,1.5vw,17px)] leading-[1.72] text-[var(--pf-fg-dim)]" />
          )}
          {(bullets.length > 0 || edit) && (
            <div className="flex flex-col gap-2.5">
              {bullets.map((b, k) => (
                <div key={k} className="group/i relative grid grid-cols-[16px_1fr] gap-2.5 text-[clamp(14px,1.4vw,16px)] leading-[1.6] text-[var(--pf-fg-dim)]">
                  <span className="font-bold text-[var(--pf-ac)]">·</span>
                  <EditableText value={b} edit={bulletField(k)} multiline className="block" />
                  {bulletX(k)}
                </div>
              ))}
              {edit && <AddBtn label="항목" onClick={addBullet} className="self-start" />}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="pf-reveal group relative">
      {edit && (
        <div className="absolute right-2 top-2 z-20 flex items-center gap-1.5 opacity-0 transition group-hover:opacity-100">
          <select
            value={kind}
            onChange={(e) => set({ kind: e.target.value as ProjectSectionKind })}
            className="rounded-md border border-white/10 bg-[#161616] px-1.5 py-1 text-[11px] font-semibold text-[var(--pf-fg-dim)] outline-none"
            title="섹션 표시 방식"
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_LABELS[k]}
              </option>
            ))}
          </select>
          <button type="button" onClick={edit.onRemove} aria-label="섹션 삭제" className="rounded-md bg-black/40 p-1 text-[var(--pf-fg-faint)] hover:text-red-400">
            <X size={14} />
          </button>
        </div>
      )}
      {inner}
    </div>
  )
}
