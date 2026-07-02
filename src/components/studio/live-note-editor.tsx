'use client'

import { ArrowLeft, Check, ChevronDown, ChevronUp, Film, ImagePlus, Lightbulb, Loader2, Minus, Plus, Quote, X } from 'lucide-react'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { useRef, useState } from 'react'
import { NOTE_BODY_GAP, noteBlockClass } from '@/components/portfolio/note-blocks'
import { PortfolioColumns } from '@/components/portfolio/portfolio-columns'
import { InlineText } from '@/components/studio/inline-text'
import type { Note, NoteBlock, Profile } from '@/db/schema'
import { isEmbedUrl, toEmbedUrl } from '@/lib/embed'
import { saveNotePatchAction } from '@/lib/portfolio-actions'
import { pfPath } from '@/lib/seo'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function LiveNoteEditor({
  note,
  profile,
  username,
  avatarUrl,
  coverUrl: initialCover,
  blockMediaUrls,
}: {
  note: Note
  profile: Profile
  username: string
  avatarUrl: string | null
  coverUrl: string | null
  blockMediaUrls: Record<number, string>
}) {
  const [data, setData] = useState<Note>(note)
  const [blocks, setBlocksState] = useState<NoteBlock[]>((note.content as NoteBlock[] | null) ?? [])
  const [coverUrl, setCoverUrl] = useState<string | null>(initialCover)
  const [mediaUrls, setMediaUrls] = useState<Record<number, string>>(blockMediaUrls)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function patch(partial: Record<string, unknown>, debounce = false) {
    if ('content' in partial) setBlocksState(partial.content as NoteBlock[])
    else setData((d) => ({ ...d, ...partial }) as Note)
    const run = async () => {
      setStatus('saving')
      const res = await saveNotePatchAction(note.id, partial)
      if (res.ok) {
        setStatus('saved')
        if (savedTimer.current) clearTimeout(savedTimer.current)
        savedTimer.current = setTimeout(() => setStatus('idle'), 1600)
      } else setStatus('error')
    }
    if (debounce) {
      const key = Object.keys(partial).join(',')
      if (timers.current[key]) clearTimeout(timers.current[key])
      timers.current[key] = setTimeout(run, 600)
    } else void run()
  }

  const setBlocks = (next: NoteBlock[]) => patch({ content: next }, true)
  const update = (i: number, b: NoteBlock) => setBlocks(blocks.map((x, j) => (j === i ? b : x)))
  const remove = (i: number) => setBlocks(blocks.filter((_, j) => j !== i))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= blocks.length) return
    const next = [...blocks]
    ;[next[i], next[j]] = [next[j], next[i]]
    setBlocks(next)
  }
  const add = (b: NoteBlock) => setBlocks([...blocks, b])

  return (
    <div className="pf pb-24" style={{ '--pf-ac': profile.accent } as CSSProperties}>
      <PortfolioColumns profile={profile} avatarUrl={avatarUrl} align="left">
        <Link
          href={`/studio/p/${profile.id}/notes`}
          className="mb-[clamp(28px,4vw,48px)] inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-[var(--pf-surface)] px-[18px] py-2.5 text-[13px] font-semibold text-[var(--pf-fg-dim)] hover:border-[var(--pf-fg)] hover:text-[var(--pf-fg)]"
        >
          <ArrowLeft size={15} strokeWidth={2} className="text-[var(--pf-ac)]" /> 글 목록
        </Link>
        <article className="max-w-[760px]">
          {/* 커버 (상단) */}
          <CoverUpload
            url={coverUrl}
            onUploaded={(id, url) => {
              setCoverUrl(url)
              patch({ coverId: id })
            }}
            onRemove={() => {
              setCoverUrl(null)
              patch({ coverId: null })
            }}
          />

          {/* 메타 (분류·날짜 좌 / 읽는 시간 우) */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.08em]">
            <span className="flex flex-wrap gap-3.5">
              <InlineText value={data.category ?? ''} onCommit={(v) => patch({ category: v })} placeholder="분류" ariaLabel="분류" className="text-[var(--pf-ac)]" />
              <InlineText value={data.date ?? ''} onCommit={(v) => patch({ date: v })} placeholder="2026.04" ariaLabel="날짜" className="text-[var(--pf-fg-faint)]" />
            </span>
            <InlineText value={data.readTime ?? ''} onCommit={(v) => patch({ readTime: v })} placeholder="8분" ariaLabel="읽는 시간" className="text-[var(--pf-fg-faint)]" />
          </div>

          {/* 제목 */}
          <InlineText
            value={data.title}
            onCommit={(v) => patch({ title: v })}
            multiline
            placeholder="글 제목"
            ariaLabel="제목"
            className="m-0 mb-[clamp(24px,4vw,40px)] block whitespace-pre-wrap text-[clamp(30px,5vw,56px)] font-extrabold leading-[1.12] tracking-[-0.02em] text-[var(--pf-fg)]"
          />

          {/* 요약 (stand-first) */}
          <InlineText
            value={data.excerpt ?? ''}
            onCommit={(v) => patch({ excerpt: v })}
            multiline
            placeholder="요약 한두 문장 (목록·검색 미리보기에 쓰입니다)"
            ariaLabel="요약"
            className="mb-[clamp(28px,4vw,44px)] block text-[clamp(17px,2vw,21px)] leading-[1.6] text-[var(--pf-fg-dim)]"
          />

          {/* 본문 블록 */}
          <div className={NOTE_BODY_GAP}>
            {blocks.map((b, i) => (
              <div key={i} className="group relative">
                <div className="absolute -left-9 top-1 hidden flex-col gap-0.5 text-[var(--pf-fg-faint)] group-hover:flex">
                  <button type="button" onClick={() => move(i, -1)} className="hover:text-[var(--pf-fg)]" aria-label="위로"><ChevronUp size={15} /></button>
                  <button type="button" onClick={() => move(i, 1)} className="hover:text-[var(--pf-fg)]" aria-label="아래로"><ChevronDown size={15} /></button>
                  <button type="button" onClick={() => remove(i)} className="hover:text-red-400" aria-label="삭제"><X size={15} /></button>
                </div>
                <BlockEditor
                  block={b}
                  onChange={(nb) => update(i, nb)}
                  mediaUrls={mediaUrls}
                  onUpload={(id, url) => setMediaUrls((m) => ({ ...m, [id]: url }))}
                />
              </div>
            ))}
          </div>

          {/* 블록 추가 */}
          <div className="mt-6 flex flex-wrap gap-2">
            <AddBlock label="문단" onClick={() => add({ type: 'p', text: '' })} />
            <AddBlock label="소제목" onClick={() => add({ type: 'h2', text: '' })} />
            <AddBlock label="작은 제목" onClick={() => add({ type: 'h3', text: '' })} />
            <AddBlock label="인용" onClick={() => add({ type: 'quote', text: '' })} icon={<Quote size={13} />} />
            <AddBlock label="콜아웃" onClick={() => add({ type: 'callout', text: '' })} icon={<Lightbulb size={13} />} />
            <AddBlock label="이미지" onClick={() => add({ type: 'image', mediaId: null })} icon={<ImagePlus size={13} />} />
            <AddBlock label="영상" onClick={() => add({ type: 'video', mediaId: null })} icon={<Film size={13} />} />
            <AddBlock label="구분선" onClick={() => add({ type: 'divider' })} icon={<Minus size={13} />} />
          </div>
        </article>
      </PortfolioColumns>

      {/* 하단 툴바 (전체폭) */}
      <div className="sticky bottom-3 z-40 mt-8 px-[clamp(18px,5vw,64px)]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.1] bg-[rgba(20,20,20,0.94)] px-4 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <div className="flex items-center gap-2 text-[13px] text-[var(--pf-fg-muted)]">
            <span className="text-[var(--pf-fg-faint)]">…/deep-dives/</span>
            <InlineText value={data.slug} onCommit={(v) => patch({ slug: v })} ariaLabel="주소" className="font-semibold text-[var(--pf-fg)]" placeholder="slug" />
          </div>
          <div className="flex items-center gap-4">
            <SaveBadge status={status} />
            {data.status === 'published' && (
              <a href={pfPath(username, `/deep-dives/${data.slug}`)} target="_blank" rel="noreferrer" className="text-[13px] text-[var(--pf-fg-muted)] hover:text-[var(--pf-ac)]">공개 글 ↗</a>
            )}
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[var(--pf-fg-dim)]">
              <input type="checkbox" checked={data.status === 'published'} onChange={(e) => patch({ published: e.target.checked })} className="h-4 w-4 accent-[var(--pf-ac)]" />
              공개
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

function BlockEditor({
  block,
  onChange,
  mediaUrls,
  onUpload,
}: {
  block: NoteBlock
  onChange: (b: NoteBlock) => void
  mediaUrls: Record<number, string>
  onUpload: (id: number, url: string) => void
}) {
  if (block.type === 'image') {
    const url = block.mediaId ? mediaUrls[block.mediaId] : null
    return (
      <figure className="my-2">
        <BlockImageUpload
          url={url}
          onUploaded={(id, u) => {
            onUpload(id, u)
            onChange({ ...block, mediaId: id })
          }}
        />
        <InlineText value={block.caption ?? ''} onCommit={(v) => onChange({ ...block, caption: v })} placeholder="캡션 (선택)" ariaLabel="캡션" className="mt-2.5 block text-center text-[13px] text-[var(--pf-fg-faint)]" />
      </figure>
    )
  }
  if (block.type === 'video') {
    const src = block.mediaId ? mediaUrls[block.mediaId] : block.url
    const embed = !block.mediaId && !!block.url && isEmbedUrl(block.url)
    return (
      <figure className="my-2 flex flex-col gap-2.5">
        {src ? (
          embed ? (
            <div className="aspect-video w-full overflow-hidden rounded-[16px] border border-white/[0.08] bg-black">
              <iframe src={toEmbedUrl(src)} className="h-full w-full" allowFullScreen title="video" />
            </div>
          ) : (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video src={src} controls playsInline className="w-full rounded-[16px] border border-white/[0.08] bg-black" />
          )
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-[16px] border border-white/[0.08] bg-[var(--pf-surface)] text-[var(--pf-fg-faint)]"><Film size={24} /></div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <BlockVideoUpload
            onUploaded={(id, u) => {
              onUpload(id, u)
              onChange({ type: 'video', mediaId: id, caption: block.caption })
            }}
          />
          <span className="text-[11px] text-[var(--pf-fg-fainter)]">또는</span>
          <input
            value={block.url ?? ''}
            onChange={(e) => onChange({ type: 'video', mediaId: null, url: e.target.value, caption: block.caption })}
            placeholder="YouTube/Vimeo URL"
            className="min-w-[200px] flex-1 rounded-md border border-white/10 bg-[#0f0f0f] px-2.5 py-1.5 text-[12px] text-[var(--pf-fg-dim)] outline-none focus:border-[var(--pf-ac)]"
          />
        </div>
        <InlineText value={block.caption ?? ''} onCommit={(v) => onChange({ ...block, caption: v })} placeholder="캡션 (선택)" ariaLabel="캡션" className="block text-center text-[13px] text-[var(--pf-fg-faint)]" />
      </figure>
    )
  }
  if (block.type === 'callout') {
    return (
      <div className="flex gap-3 rounded-[16px] border border-[var(--pf-ac)]/25 bg-[var(--pf-ac)]/[0.06] p-[clamp(16px,2.2vw,22px)]">
        <Lightbulb size={18} className="mt-0.5 flex-none text-[var(--pf-ac)]" />
        <InlineText value={block.text} onCommit={(v) => onChange({ ...block, text: v })} multiline placeholder="강조할 내용" ariaLabel="콜아웃" className="m-0 block whitespace-pre-wrap text-[clamp(15px,1.5vw,17px)] leading-[1.7] text-[var(--pf-fg-dim)]" />
      </div>
    )
  }
  if (block.type === 'divider') return <hr className="my-2 border-0 border-t border-white/[0.1]" />
  // 공개와 동일한 요소로 감싸고(스타일=결과), 편집 chrome은 안쪽 텍스트에만.
  const ph = block.type === 'h2' ? '소제목' : block.type === 'h3' ? '작은 제목' : block.type === 'quote' ? '인용문' : '문단을 입력하세요…'
  const cls = noteBlockClass(block.type)
  const editable = (
    <InlineText value={block.text} onCommit={(v) => onChange({ ...block, text: v })} multiline placeholder={ph} ariaLabel={ph} className="block" />
  )
  if (block.type === 'h2') return <h2 className={cls}>{editable}</h2>
  if (block.type === 'h3') return <h3 className={cls}>{editable}</h3>
  if (block.type === 'quote') return <blockquote className={cls}>{editable}</blockquote>
  return <p className={cls}>{editable}</p>
}

function BlockVideoUpload({ onUploaded }: { onUploaded: (id: number, url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/v1/media', { method: 'POST', body: fd })
      if (res.ok) {
        const d = await res.json()
        onUploaded(d.id, d.url)
      }
    } finally {
      setBusy(false)
      if (ref.current) ref.current.value = ''
    }
  }
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-[12px] font-semibold text-[var(--pf-fg-dim)] transition-colors hover:border-[var(--pf-ac)] hover:text-[var(--pf-fg)]"
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Film size={13} />} 영상 업로드
      </button>
      <input ref={ref} type="file" accept="video/*,image/*" onChange={pick} className="hidden" />
    </>
  )
}

function AddBlock({ label, onClick, icon }: { label: string; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1.5 rounded-full border border-dashed border-white/15 px-3 py-1.5 text-xs font-semibold text-[var(--pf-fg-muted)] transition-colors hover:border-[var(--pf-ac)] hover:text-[var(--pf-fg)]">
      {icon ?? <Plus size={13} />} {label}
    </button>
  )
}

function SaveBadge({ status }: { status: SaveStatus }) {
  if (status === 'saving') return <span className="flex items-center gap-1.5 text-[12px] text-[var(--pf-fg-muted)]"><Loader2 size={13} className="animate-spin" /> 저장 중…</span>
  if (status === 'saved') return <span className="flex items-center gap-1 text-[12px] text-[var(--pf-lime-2)]"><Check size={13} /> 저장됨</span>
  if (status === 'error') return <span className="text-[12px] text-red-400">저장 실패</span>
  return <span className="text-[12px] text-[var(--pf-fg-fainter)]">자동 저장</span>
}

function CoverUpload({ url, onUploaded, onRemove }: { url: string | null; onUploaded: (id: number, url: string) => void; onRemove: () => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/v1/media', { method: 'POST', body: fd })
      if (res.ok) {
        const d = await res.json()
        onUploaded(d.id, d.url)
      }
    } finally {
      setBusy(false)
      if (ref.current) ref.current.value = ''
    }
  }
  return (
    <div className={`group relative mb-[clamp(28px,4vw,48px)] overflow-hidden rounded-[20px] ${url ? '' : 'border border-white/[0.08] bg-[var(--pf-surface)]'}`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="block w-full" />
      ) : (
        <div className="flex aspect-[16/8] items-center justify-center text-[var(--pf-fg-faint)]"><ImagePlus size={26} /></div>
      )}
      <button type="button" onClick={() => ref.current?.click()} className="absolute inset-0 flex items-center justify-center bg-black/0 text-sm font-semibold text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
        {busy ? <Loader2 size={20} className="animate-spin" /> : url ? '커버 변경' : '커버 이미지 추가'}
      </button>
      {url && !busy && (
        <button type="button" onClick={onRemove} className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white opacity-0 transition group-hover:opacity-100">제거</button>
      )}
      <input ref={ref} type="file" accept="image/*" onChange={pick} className="hidden" />
    </div>
  )
}

function BlockImageUpload({ url, onUploaded }: { url: string | null; onUploaded: (id: number, url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/v1/media', { method: 'POST', body: fd })
      if (res.ok) {
        const d = await res.json()
        onUploaded(d.id, d.url)
      }
    } finally {
      setBusy(false)
      if (ref.current) ref.current.value = ''
    }
  }
  return (
    <div className="group/img relative overflow-hidden rounded-[16px] border border-white/[0.08] bg-[var(--pf-surface)]">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="block w-full" />
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center text-[var(--pf-fg-faint)]"><ImagePlus size={24} /></div>
      )}
      <button type="button" onClick={() => ref.current?.click()} className="absolute inset-0 flex items-center justify-center bg-black/0 text-sm font-semibold text-white opacity-0 transition group-hover/img:bg-black/40 group-hover/img:opacity-100">
        {busy ? <Loader2 size={20} className="animate-spin" /> : url ? '이미지 변경' : '이미지 업로드'}
      </button>
      <input ref={ref} type="file" accept="image/*" onChange={pick} className="hidden" />
    </div>
  )
}
