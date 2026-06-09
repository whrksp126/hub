'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { ContentType } from '@/lib/content-types'
import { saveDocAction } from '@/lib/studio-actions'

// Plate 편집기는 브라우저 전용(contentEditable) → SSR 비활성.
const PlateEditor = dynamic(() => import('@/editor/plate-editor').then((m) => m.PlateEditor), {
  ssr: false,
  loading: () => <div className="py-10 text-center text-sm text-[var(--fg-muted)]">편집기 로딩…</div>,
})

type Props = {
  type: ContentType
  id: number
  initialTitle: string
  initialSlug: string
  initialStatus: 'draft' | 'published'
  initialContent: unknown
  publicPath: string
}

export function EditorShell(props: Props) {
  const [title, setTitle] = useState(props.initialTitle)
  const [slug, setSlug] = useState(props.initialSlug)
  const [status, setStatus] = useState(props.initialStatus)
  const [content, setContent] = useState<unknown>(props.initialContent)
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  function save(publish?: boolean) {
    startTransition(async () => {
      const res = await saveDocAction({ type: props.type, id: props.id, title, slug, content, status, publish })
      if (res.ok) {
        setMsg(publish ? '발행되었습니다.' : '저장되었습니다.')
        if (publish) setStatus('published')
      } else {
        setMsg(res.error || '저장 실패')
      }
      setTimeout(() => setMsg(null), 2500)
    })
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      {/* 상단 바 */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link href="/studio" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]">
          ← 목록
        </Link>
        <div className="flex items-center gap-2">
          {msg && <span className="text-sm text-[var(--fg-muted)]">{msg}</span>}
          <button
            onClick={() => save(false)}
            disabled={pending}
            className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--brand)] disabled:opacity-50"
          >
            저장
          </button>
          <button
            onClick={() => save(true)}
            disabled={pending}
            className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            발행
          </button>
        </div>
      </div>

      {/* 제목 */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목"
        className="w-full bg-transparent text-3xl font-bold outline-none placeholder:text-[var(--fg-muted)]"
      />

      {/* slug */}
      <div className="mt-2 flex items-center gap-1 text-sm text-[var(--fg-muted)]">
        <span>{props.publicPath}/</span>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="flex-1 bg-transparent outline-none"
        />
      </div>

      {/* 본문 (Plate 단일 렌더러) */}
      <div className="mt-8">
        <PlateEditor initialValue={props.initialContent} onChange={setContent} />
      </div>
    </div>
  )
}
