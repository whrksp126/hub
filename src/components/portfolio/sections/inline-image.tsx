'use client'

import { ImagePlus, Loader2, X } from 'lucide-react'
import { useRef, useState } from 'react'

// 인라인 이미지 업로더(커버/로고/배너 공용). /api/v1/media에 올리고 onUploaded(id,url) 콜백.
// className으로 크기·비율을 호출부가 지정해 공개 렌더와 동일한 모양 유지.
export function InlineImageUpload({
  url,
  alt,
  onUploaded,
  onRemove,
  className = '',
  placeholderLabel = '이미지 추가',
}: {
  url: string | null
  alt: string
  onUploaded: (id: number, url: string) => void
  onRemove: () => void
  className?: string
  placeholderLabel?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('alt', alt || 'image')
      const res = await fetch('/api/v1/media', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('업로드 실패')
      const d = await res.json()
      onUploaded(d.id, d.url)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className={`group/img relative overflow-hidden ${className}`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center border-2 border-dashed border-white/12 bg-[var(--pf-surface)] text-[var(--pf-fg-faint)]">
          <ImagePlus size={22} />
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="absolute inset-0 flex items-center justify-center bg-black/0 text-sm font-semibold text-white opacity-0 transition group-hover/img:bg-black/45 group-hover/img:opacity-100"
      >
        {busy ? <Loader2 size={20} className="animate-spin" /> : url ? '변경' : placeholderLabel}
      </button>
      {url && !busy && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-2 top-2 z-10 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white opacity-0 transition group-hover/img:opacity-100"
        >
          제거
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
    </div>
  )
}
