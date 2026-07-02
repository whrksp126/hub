'use client'

import { ImagePlus, Loader2, X } from 'lucide-react'
import { useRef, useState } from 'react'

// 이미지를 /api/v1/media(세션 인증)에 올리고 media id를 hidden input에 담는다.
export function ImageUpload({
  name,
  initialId,
  initialUrl,
  label = '이미지',
  aspect = 'aspect-square',
}: {
  name: string
  initialId?: number | null
  initialUrl?: string | null
  label?: string
  aspect?: string
}) {
  const [id, setId] = useState<number | ''>(initialId ?? '')
  const [url, setUrl] = useState<string | null>(initialUrl ?? null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('alt', label)
      const res = await fetch('/api/v1/media', { method: 'POST', body: fd })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || '업로드 실패')
      const data = await res.json()
      setId(data.id)
      setUrl(data.url)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function clear() {
    setId('')
    setUrl(null)
  }

  return (
    <div>
      <input type="hidden" name={name} value={id} />
      <div className="flex items-center gap-3">
        <div
          className={`relative ${aspect} w-24 overflow-hidden rounded-xl border border-white/10 bg-[var(--pf-surface)]`}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={label} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[var(--pf-fg-faint)]">
              <ImagePlus size={20} />
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 size={18} className="animate-spin text-white" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="rounded-full border border-white/10 px-3.5 py-1.5 text-xs font-semibold text-[var(--pf-fg-dim)] transition-colors hover:border-[var(--pf-ac)] hover:text-[var(--pf-fg)] disabled:opacity-50"
          >
            {url ? '변경' : '업로드'}
          </button>
          {url && (
            <button
              type="button"
              onClick={clear}
              className="flex items-center gap-1 text-xs text-[var(--pf-fg-faint)] hover:text-red-400"
            >
              <X size={12} /> 제거
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  )
}
