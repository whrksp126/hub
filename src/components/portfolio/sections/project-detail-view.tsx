import { ArrowRight, ArrowUpRight, BookOpen, Check, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { EditableText, type EditableField } from '@/components/portfolio/editable-text'
import { Thumb } from '@/components/portfolio/pieces'
import { AddBtn, RemoveBtn } from '@/components/portfolio/sections/edit-controls'
import { InlineImageUpload } from '@/components/portfolio/sections/inline-image'
import { ProjectSectionBlock } from '@/components/portfolio/sections/project-section-block'
import type { ProjectMetric, ProjectSection } from '@/db/schema'

type ImageEdit = { url: string | null; onUploaded: (id: number, url: string) => void; onRemove: () => void }
export type RelatedNote = { id: number; slug: string; title: string; category: string | null; date: string | null; readTime: string | null; href: string }
export type ProjectViewData = {
  title: string
  titleKr: string | null
  tag: string | null
  year: string | null
  role: string | null
  url: string | null
  summary: string | null
  metrics: ProjectMetric[]
  sections: ProjectSection[]
  stack: string[]
  coverUrl: string | null
  logoUrl: string | null
  sectionMediaUrls: Record<number, string>
  relatedNotes: RelatedNote[]
}
export type ProjectEdit = {
  field: (key: 'title' | 'titleKr' | 'tag' | 'year' | 'role' | 'url' | 'summary', placeholder?: string) => EditableField
  cover: ImageEdit
  logo: ImageEdit
  onMetrics: (next: ProjectMetric[]) => void
  onSections: (next: ProjectSection[]) => void
  onStack: (next: string[]) => void
  related?: { options: RelatedNote[]; selectedIds: number[]; onChange: (ids: number[]) => void }
}

// 프로젝트 상세 본문 — 공개=정적 / 편집=인라인. projects/[slug] 공개 페이지와 프로젝트 편집기 단일 소스.
// `next`는 공개 전용(다음 프로젝트 카드). 편집기는 생략.
export function ProjectDetailView({
  data,
  edit,
  next,
}: {
  data: ProjectViewData
  edit?: ProjectEdit
  next?: { href: string; title: string } | null
}) {
  const metrics = data.metrics ?? []
  const sections = data.sections ?? []
  const stack = data.stack ?? []
  const mediaUrls = data.sectionMediaUrls ?? {}
  const relatedNotes = data.relatedNotes ?? []

  return (
    <>
      {/* 커버 배너 */}
      {edit ? (
        <InlineImageUpload
          url={edit.cover.url}
          alt={data.title}
          onUploaded={edit.cover.onUploaded}
          onRemove={edit.cover.onRemove}
          placeholderLabel="커버 추가 (권장 1024×500)"
          className="pf-reveal mb-[clamp(28px,4vw,44px)] block aspect-[1024/500] w-full rounded-[24px] border border-white/[0.07]"
        />
      ) : (
        data.coverUrl && (
          <div className="pf-reveal mb-[clamp(28px,4vw,44px)] aspect-[1024/500] w-full overflow-hidden rounded-[24px] border border-white/[0.07]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.coverUrl} alt={data.title} className="h-full w-full object-cover" />
          </div>
        )
      )}

      {/* 로고 + 메타 */}
      <div className="pf-reveal mb-6 flex items-center gap-5">
        {edit ? (
          <InlineImageUpload
            url={edit.logo.url}
            alt={data.title}
            onUploaded={edit.logo.onUploaded}
            onRemove={edit.logo.onRemove}
            placeholderLabel="로고 (정사각형)"
            className="h-[84px] w-[84px] flex-none rounded-[18px]"
          />
        ) : (
          data.logoUrl && <Thumb url={data.logoUrl} alt={data.title} className="h-[84px] w-[84px] flex-none rounded-[18px]" />
        )}
        <div className="flex flex-wrap gap-3.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[var(--pf-fg-faint)]">
          {(edit || data.tag) && (
            <EditableText value={data.tag ?? ''} edit={edit?.field('tag', 'TAG')} className="text-[var(--pf-ac)]" />
          )}
          {(edit || data.year) && <EditableText value={data.year ?? ''} edit={edit?.field('year', 'YEAR')} />}
          {(edit || data.role) && <EditableText value={data.role ?? ''} edit={edit?.field('role', 'ROLE')} />}
        </div>
      </div>

      {/* 제목 */}
      <h1 className="pf-reveal pf-display m-0 mb-3 !leading-[0.92] text-[clamp(42px,8vw,96px)] text-[var(--pf-fg)]">
        <EditableText value={data.title} edit={edit?.field('title', '프로젝트명')} />
      </h1>
      <div className="pf-reveal mb-[clamp(24px,4vw,40px)] text-[14px] text-[var(--pf-fg-faint)]">
        <EditableText value={data.titleKr ?? ''} edit={edit?.field('titleKr', '한글 부제')} />
        {edit ? (
          <>
            {' · '}
            <EditableText value={data.url ?? ''} edit={edit.field('url', 'order.ghmate.com')} className="text-[var(--pf-fg-fainter)]" />
          </>
        ) : (
          data.url && <span className="text-[var(--pf-fg-fainter)]"> · {data.url}</span>
        )}
      </div>
      {(edit || data.summary) && (
        <EditableText
          value={data.summary ?? ''}
          edit={edit?.field('summary', '한 줄 요약')}
          multiline
          className="pf-reveal m-0 mb-6 block max-w-[720px] text-[clamp(16px,1.6vw,20px)] leading-[1.65] text-[var(--pf-fg-dim)]"
        />
      )}

      {/* 랜딩 페이지 CTA (공개 전용 · 클릭 가능) */}
      {!edit && data.url && (
        <a
          href={data.url.startsWith('http') ? data.url : `https://${data.url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="pf-reveal mb-[clamp(36px,5vw,56px)] inline-flex items-center gap-2 rounded-full bg-[var(--pf-ac)] px-5 py-2.5 text-[13px] font-bold tracking-[-0.01em] text-[#141414] transition hover:opacity-90"
        >
          라이브 보기
          <ArrowUpRight size={16} strokeWidth={2.4} />
        </a>
      )}
      {edit && !data.summary && <div className="mb-[clamp(36px,5vw,56px)]" />}
      {edit && data.summary && <div className="mb-[clamp(30px,4vw,44px)]" />}

      {/* 지표(metrics) */}
      {(metrics.length > 0 || edit) && (
        <div className="pf-reveal mb-[clamp(40px,6vw,64px)] grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5">
          {metrics.map((m, i) => (
            <div key={i} className="group relative rounded-[20px] border border-white/[0.07] bg-[var(--pf-surface)] p-[clamp(22px,3vw,28px)]">
              {edit && <RemoveBtn onClick={() => edit.onMetrics(metrics.filter((_, j) => j !== i))} className="right-2 top-2" />}
              <EditableText
                value={m.value}
                edit={edit ? { onCommit: (v) => edit.onMetrics(metrics.map((x, j) => (j === i ? { ...x, value: v } : x))), placeholder: '504', ariaLabel: '지표 값' } : undefined}
                className="block text-[clamp(28px,3.5vw,42px)] font-extrabold leading-none tracking-[-0.02em] text-[var(--pf-fg)]"
              />
              <EditableText
                value={m.label}
                edit={edit ? { onCommit: (v) => edit.onMetrics(metrics.map((x, j) => (j === i ? { ...x, label: v } : x))), placeholder: '커밋', ariaLabel: '지표 라벨' } : undefined}
                className="mt-3 block text-[11px] font-semibold uppercase leading-[1.5] tracking-[0.1em] text-[var(--pf-fg-faint)]"
              />
            </div>
          ))}
          {edit && (
            <button
              type="button"
              onClick={() => edit.onMetrics([...metrics, { value: '', label: '' }])}
              className="flex min-h-[90px] items-center justify-center gap-1.5 rounded-[20px] border-2 border-dashed border-white/12 text-sm font-semibold text-[var(--pf-fg-muted)] transition-colors hover:border-[var(--pf-ac)] hover:text-[var(--pf-fg)]"
            >
              <Plus size={16} /> 지표
            </button>
          )}
        </div>
      )}

      {/* 섹션 — kind별로 다른 시각 레이아웃 */}
      {(sections.length > 0 || edit) && (
        <div className="flex flex-col gap-[clamp(40px,6vw,72px)]">
          {sections.map((sec, i) => (
            <ProjectSectionBlock
              key={i}
              sec={sec}
              mediaUrls={mediaUrls}
              edit={
                edit
                  ? {
                      onChange: (next) => edit.onSections(sections.map((x, j) => (j === i ? next : x))),
                      onRemove: () => edit.onSections(sections.filter((_, j) => j !== i)),
                    }
                  : undefined
              }
            />
          ))}
          {edit && (
            <AddBtn label="섹션 추가" onClick={() => edit.onSections([...sections, { heading: '', body: '', bullets: [], kind: 'default' }])} className="self-start" />
          )}
        </div>
      )}

      {/* 스택 */}
      {(stack.length > 0 || edit) && (
        <div className="pf-reveal mt-[clamp(36px,5vw,56px)]">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-fg-faint)]">STACK</div>
          <div className="flex flex-wrap items-center gap-2.5">
            {stack.map((t, i) =>
              edit ? (
                <span key={i} className="group flex items-center gap-1 rounded-full border border-white/[0.14] px-3.5 py-[7px] text-[12px] text-[var(--pf-fg-dim)]">
                  <EditableText
                    value={t}
                    edit={{ onCommit: (v) => edit.onStack(stack.map((x, j) => (j === i ? v : x)).filter(Boolean)), placeholder: 'Tool', ariaLabel: '스택' }}
                    className="pf-mono"
                  />
                  <button type="button" onClick={() => edit.onStack(stack.filter((_, j) => j !== i))} aria-label="삭제" className="text-[var(--pf-fg-faint)] hover:text-red-400">
                    <X size={12} />
                  </button>
                </span>
              ) : (
                <span key={i} className="pf-mono rounded-full border border-white/[0.14] px-3.5 py-[7px] text-[12px] text-[var(--pf-fg-dim)]">
                  {t}
                </span>
              ),
            )}
            {edit && <AddBtn label="스택" onClick={() => edit.onStack([...stack, 'New'])} />}
          </div>
        </div>
      )}

      {/* 관련 딥다이브 */}
      {edit?.related && edit.related.options.length > 0 ? (
        <div className="pf-reveal mt-[clamp(40px,6vw,64px)]">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-fg-faint)]">관련 딥다이브 (연결할 글 선택)</div>
          <div className="flex flex-col gap-2">
            {edit.related.options.map((n) => {
              const on = edit.related!.selectedIds.includes(n.id)
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() =>
                    edit.related!.onChange(on ? edit.related!.selectedIds.filter((x) => x !== n.id) : [...edit.related!.selectedIds, n.id])
                  }
                  className={`flex items-center gap-3 rounded-[14px] border px-4 py-3 text-left transition ${on ? 'border-[var(--pf-ac)] bg-[var(--pf-ac)]/10' : 'border-white/[0.08] bg-[var(--pf-surface)] hover:border-white/[0.16]'}`}
                >
                  <span className={`flex h-4 w-4 flex-none items-center justify-center rounded-[5px] border ${on ? 'border-[var(--pf-ac)] bg-[var(--pf-ac)] text-[#141414]' : 'border-white/25'}`}>
                    {on && <Check size={11} strokeWidth={3} />}
                  </span>
                  <span className="text-[14px] font-semibold text-[var(--pf-fg)]">{n.title}</span>
                  {n.category && <span className="ml-auto text-[11px] uppercase tracking-[0.08em] text-[var(--pf-fg-faint)]">{n.category}</span>}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        relatedNotes.length > 0 && (
          <div className="pf-reveal mt-[clamp(40px,6vw,64px)]">
            <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-fg-faint)]">
              <BookOpen size={13} className="text-[var(--pf-ac)]" /> 관련 딥다이브
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {relatedNotes.map((n) => (
                <Link
                  key={n.id}
                  href={n.href}
                  className="group flex flex-col gap-2 rounded-[18px] border border-white/[0.08] bg-[var(--pf-surface)] p-[clamp(18px,2.5vw,24px)] transition hover:border-white/[0.16] hover:bg-[#1B1B1B]"
                >
                  <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--pf-fg-faint)]">
                    {n.category && <span className="text-[var(--pf-ac)]">{n.category}</span>}
                    {n.readTime && <span>· {n.readTime}</span>}
                  </span>
                  <span className="text-[clamp(15px,1.8vw,18px)] font-bold leading-[1.35] text-[var(--pf-fg)]">{n.title}</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--pf-fg-muted)] transition group-hover:text-[var(--pf-ac)]">
                    읽기 <ArrowRight size={13} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )
      )}

      {/* 다음 프로젝트 (공개 전용) */}
      {next && (
        <Link
          href={next.href}
          className="pf-reveal mt-[clamp(40px,6vw,64px)] flex items-center justify-between gap-4 rounded-[24px] border border-white/[0.08] bg-[var(--pf-surface)] p-[clamp(24px,3.5vw,36px)] hover:border-white/[0.14] hover:bg-[#1B1B1B]"
        >
          <span className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-fg-faint)]">다음 프로젝트</span>
            <span className="pf-display text-[clamp(22px,2.6vw,32px)] !leading-tight text-[var(--pf-fg)]">{next.title}</span>
          </span>
          <span className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-full bg-[var(--pf-ac)]">
            <ArrowRight size={20} strokeWidth={2} className="text-[#141414]" />
          </span>
        </Link>
      )}
    </>
  )
}
