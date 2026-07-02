'use client'

import { ChevronLeft, ChevronRight, Film, ImagePlus, Link2, Loader2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import type { SectionMedia } from '@/db/schema'
import { toEmbedUrl } from '@/lib/embed'

function mediaSrc(m: SectionMedia, urls: Record<number, string>): string | null {
  if (m.kind === 'embed') return m.url || null
  if (m.mediaId && urls[m.mediaId]) return urls[m.mediaId]
  return m.url || null
}

// 단일 미디어 렌더(공개·편집 공용 시각).
function MediaFrame({ m, urls }: { m: SectionMedia; urls: Record<number, string> }) {
  const src = mediaSrc(m, urls)
  if (!src) return null
  if (m.kind === 'embed') {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-[14px] border border-white/[0.08] bg-black">
        <iframe
          src={toEmbedUrl(src)}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={m.caption || 'embed'}
        />
      </div>
    )
  }
  if (m.kind === 'video') {
    // eslint-disable-next-line jsx-a11y/media-has-caption
    return <video src={src} controls playsInline className="w-full rounded-[14px] border border-white/[0.08] bg-black" />
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={m.caption ?? ''} className="w-full rounded-[14px] border border-white/[0.07] object-cover" />
}

// 공개: 미디어 그리드(1장=가로 꽉, 2장 이상=2열).
export function SectionMediaView({ media, urls }: { media: SectionMedia[]; urls: Record<number, string> }) {
  const list = (media ?? []).filter((m) => mediaSrc(m, urls))
  if (list.length === 0) return null
  return (
    <div className={`grid gap-4 ${list.length > 1 ? 'sm:grid-cols-2' : ''}`}>
      {list.map((m, i) => (
        <figure key={i} className="m-0">
          <MediaFrame m={m} urls={urls} />
          {m.caption && <figcaption className="mt-2 text-[12.5px] leading-[1.5] text-[var(--pf-fg-faint)]">{m.caption}</figcaption>}
        </figure>
      ))}
    </div>
  )
}

// 편집: 업로드(이미지/영상) + 임베드 URL + 캡션 + 순서/삭제.
export function SectionMediaEditor({
  media,
  urls,
  onChange,
}: {
  media: SectionMedia[]
  urls: Record<number, string>
  onChange: (next: SectionMedia[]) => void
}) {
  const list = media ?? []
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [localUrls, setLocalUrls] = useState<Record<number, string>>({})
  const merged = { ...urls, ...localUrls }

  const set = (i: number, patch: Partial<SectionMedia>) => onChange(list.map((m, j) => (j === i ? { ...m, ...patch } : m)))
  const remove = (i: number) => onChange(list.filter((_, j) => j !== i))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= list.length) return
    const next = [...list]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('alt', file.name)
      const res = await fetch('/api/v1/media', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('업로드 실패')
      const d = await res.json()
      setLocalUrls((u) => ({ ...u, [d.id]: d.url }))
      onChange([...list, { kind: file.type.startsWith('video') ? 'video' : 'image', mediaId: d.id, caption: '' }])
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {list.length > 0 && (
        <div className={`grid gap-4 ${list.length > 1 ? 'sm:grid-cols-2' : ''}`}>
          {list.map((m, i) => (
            <div key={i} className="group/m relative flex flex-col gap-2 rounded-[16px] border border-white/[0.08] bg-[var(--pf-surface)] p-2.5">
              <MediaFrame m={m} urls={merged} />
              <input
                value={m.caption ?? ''}
                onChange={(e) => set(i, { caption: e.target.value })}
                placeholder="캡션 (선택)"
                className="w-full rounded-md border border-white/10 bg-[#0f0f0f] px-2 py-1 text-[12px] text-[var(--pf-fg-dim)] outline-none focus:border-[var(--pf-ac)]"
              />
              <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition group-hover/m:opacity-100">
                <button type="button" onClick={() => move(i, -1)} aria-label="앞으로" className="rounded-md bg-black/55 p-1 text-white hover:text-[var(--pf-ac)]">
                  <ChevronLeft size={13} />
                </button>
                <button type="button" onClick={() => move(i, 1)} aria-label="뒤로" className="rounded-md bg-black/55 p-1 text-white hover:text-[var(--pf-ac)]">
                  <ChevronRight size={13} />
                </button>
                <button type="button" onClick={() => remove(i)} aria-label="삭제" className="rounded-md bg-black/55 p-1 text-white hover:text-red-400">
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-full border border-white/12 px-3.5 py-2 text-[12.5px] font-semibold text-[var(--pf-fg-dim)] transition-colors hover:border-[var(--pf-ac)] hover:text-[var(--pf-fg)]"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />} 이미지/영상
        </button>
        <button
          type="button"
          onClick={() => onChange([...list, { kind: 'embed', url: '', caption: '' }])}
          className="flex items-center gap-1.5 rounded-full border border-white/12 px-3.5 py-2 text-[12.5px] font-semibold text-[var(--pf-fg-dim)] transition-colors hover:border-[var(--pf-ac)] hover:text-[var(--pf-fg)]"
        >
          <Link2 size={14} /> 임베드 URL
        </button>
        <input ref={inputRef} type="file" accept="image/*,video/*" onChange={onPick} className="hidden" />
      </div>
      {list.map((m, i) =>
        m.kind === 'embed' ? (
          <div key={`em${i}`} className="flex items-center gap-2">
            <Film size={14} className="flex-none text-[var(--pf-fg-faint)]" />
            <input
              value={m.url ?? ''}
              onChange={(e) => set(i, { url: e.target.value })}
              placeholder="YouTube/Vimeo URL"
              className="w-full rounded-md border border-white/10 bg-[#0f0f0f] px-2.5 py-1.5 text-[12px] text-[var(--pf-fg-dim)] outline-none focus:border-[var(--pf-ac)]"
            />
          </div>
        ) : null,
      )}
    </div>
  )
}
