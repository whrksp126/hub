'use client'

import { useState, useTransition } from 'react'
import { createDraftAction } from '@/lib/studio-actions'
import { BLOG_THEME_METAS, type ThemeCardMeta } from '@/themes/metas'

// 테마별 추상 미리보기(미니 목업)
function Preview({ kind }: { kind: ThemeCardMeta['preview'] }) {
  const line = 'h-1.5 rounded bg-[var(--line)]'
  const base = 'flex h-28 flex-col gap-2 overflow-hidden rounded-lg border border-[var(--line)] p-3'
  if (kind === 'hero')
    return (
      <div className={base}>
        <div className="-mx-3 -mt-3 mb-1 h-12 bg-gradient-to-br from-[var(--brand)] to-black" />
        <div className={`${line} w-3/4`} />
        <div className={`${line} w-1/2`} />
      </div>
    )
  if (kind === 'side')
    return (
      <div className={`${base} flex-row gap-3`}>
        <div className="w-1 shrink-0 rounded bg-[var(--brand)]" />
        <div className="flex flex-1 flex-col gap-2 pt-1">
          <div className={`${line} w-2/3`} />
          <div className={`${line} w-full`} />
          <div className={`${line} w-5/6`} />
        </div>
      </div>
    )
  if (kind === 'card')
    return (
      <div className="flex h-28 items-center justify-center rounded-lg bg-[var(--line)]/40 p-3">
        <div className="flex w-full flex-col gap-2 rounded-md border border-[var(--line)] bg-[var(--bg)] p-3 shadow-sm">
          <div className={`${line} w-2/3`} />
          <div className={`${line} w-full`} />
        </div>
      </div>
    )
  if (kind === 'dark')
    return (
      <div className="flex h-28 flex-col gap-2 rounded-lg bg-[#0a0a0b] p-3">
        <div className="h-1.5 w-1/4 rounded bg-[var(--brand)]" />
        <div className="h-1.5 w-3/4 rounded bg-white/30" />
        <div className="h-1.5 w-1/2 rounded bg-white/15" />
      </div>
    )
  return (
    <div className={`${base} items-center justify-center`}>
      <div className={`${line} w-1/2`} />
      <div className={`${line} w-2/3`} />
      <div className={`${line} w-1/2`} />
    </div>
  )
}

export function NewGallery() {
  const [title, setTitle] = useState('')
  const [pending, start] = useTransition()
  const metas = BLOG_THEME_METAS

  function create(theme: string | null) {
    start(() => {
      const fd = new FormData()
      fd.set('type', 'posts')
      if (theme) fd.set('theme', theme)
      else fd.set('blank', '1')
      if (title.trim()) fd.set('title', title.trim())
      createDraftAction(fd)
    })
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="text-2xl font-bold">새 글 만들기</h1>
      <p className="mt-1 text-sm text-[var(--fg-muted)]">디자인 테마를 고르면 예시 내용이 채워진 채로 편집을 시작합니다.</p>

      {/* 제목(선택) */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목 (선택 — 나중에 편집 가능)"
        className="mt-4 w-full max-w-md rounded-lg border border-[var(--line)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
      />

      {/* 테마 갤러리 */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metas.map((m) => (
          <button
            key={m.id}
            disabled={pending}
            onClick={() => create(m.id)}
            className="group rounded-xl border border-[var(--line)] p-3 text-left transition-colors hover:border-[var(--brand)] disabled:opacity-50"
          >
            <Preview kind={m.preview} />
            <div className="mt-3 font-semibold group-hover:text-[var(--brand)]">{m.name}</div>
            <div className="mt-1 text-xs text-[var(--fg-muted)]">{m.description}</div>
          </button>
        ))}
        {/* 빈 테마 */}
        <button
          disabled={pending}
          onClick={() => create(null)}
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--line)] p-3 text-center transition-colors hover:border-[var(--brand)] disabled:opacity-50"
        >
          <div className="text-2xl text-[var(--fg-muted)]">+</div>
          <div className="mt-2 font-semibold">빈 테마로 시작</div>
          <div className="mt-1 text-xs text-[var(--fg-muted)]">예시 없이 백지에서</div>
        </button>
      </div>
    </div>
  )
}
