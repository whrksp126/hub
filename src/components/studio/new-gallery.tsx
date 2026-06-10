'use client'

import { useState, useTransition } from 'react'
import { createDraftAction } from '@/lib/studio-actions'
import { BLOG_THEME_METAS } from '@/themes/metas'

// 본문 더미 라인
function Lines({ n = 3, className = '' }: { n?: number; className?: string }) {
  const w = ['w-full', 'w-[92%]', 'w-[85%]', 'w-[70%]']
  return (
    <div className={`space-y-[5px] ${className}`}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className={`h-[3px] rounded-full bg-[var(--line)] ${w[i % w.length]}`} />
      ))}
    </div>
  )
}

const KICKER = 'text-[6px] font-bold uppercase tracking-[0.22em] text-[var(--brand)]'
const TITLE = 'font-[family-name:var(--font-serif)] font-bold leading-[1.15] text-[var(--fg)]'
const FRAME = 'h-36 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--bg)]'

// 실제 테마 축소 미리보기(미니 목업) — id별
function Preview({ id }: { id: string }) {
  // 1) 에디토리얼 — 중앙 정렬 세리프 + 드롭캡 느낌
  if (id === 'clean')
    return (
      <div className={`${FRAME} flex flex-col items-center px-5 py-4 text-center`}>
        <span className={KICKER}>NEWS</span>
        <div className={`${TITLE} mt-1.5 text-[13px]`}>깊이 있는 기록</div>
        <div className="mt-1.5 text-[6px] text-[var(--fg-muted)]">건호 · 2026. 06. 10</div>
        <Lines n={3} className="mt-3 w-full text-left" />
      </div>
    )
  // 2) 매거진 — 풀블리드 커버 히어로 + 타이틀 오버레이
  if (id === 'magazine')
    return (
      <div className={FRAME}>
        <div className="relative flex h-[62%] items-end bg-gradient-to-br from-[var(--brand)] via-slate-700 to-black p-3">
          <div>
            <span className="text-[6px] font-bold uppercase tracking-[0.22em] text-white/80">기술</span>
            <div className={`${TITLE} text-[13px] text-white`}>커버 위의 제목</div>
          </div>
        </div>
        <div className="px-3 py-2.5">
          <Lines n={2} />
        </div>
      </div>
    )
  // 3) 칼럼 — 좌측 메타 레일(비대칭)
  if (id === 'devlog')
    return (
      <div className={`${FRAME} px-4 py-4`}>
        <div className="border-b border-[var(--fg)]/30 pb-2">
          <span className={KICKER}>기술</span>
          <div className={`${TITLE} mt-1 text-[12px]`}>연재 칼럼</div>
        </div>
        <div className="mt-2.5 grid grid-cols-[24px_1fr] gap-2.5">
          <div className="border-r border-[var(--line)] pr-1.5">
            <div className="h-[3px] w-full rounded-full bg-[var(--line)]" />
            <div className="mt-1 h-[3px] w-3/4 rounded-full bg-[var(--line)]" />
          </div>
          <Lines n={3} />
        </div>
      </div>
    )
  // 4) 피처 — 커버를 품은 피처드 카드
  if (id === 'card')
    return (
      <div className={`${FRAME} flex items-center justify-center bg-[var(--line)]/30 p-3`}>
        <div className="w-full overflow-hidden rounded-md border border-[var(--line)] bg-[var(--bg)] shadow-[0_4px_14px_-6px_rgba(0,0,0,0.3)]">
          <div className="h-8 bg-gradient-to-r from-[var(--brand)]/30 to-[var(--brand)]/5" />
          <div className="px-3 py-2.5">
            <span className={KICKER}>버그해결</span>
            <div className={`${TITLE} mt-1 text-[12px]`}>피처드 카드</div>
            <Lines n={2} className="mt-2" />
          </div>
        </div>
      </div>
    )
  // 5) 사이드룰 — 굵은 좌측 악센트 바
  return (
    <div className={`${FRAME} flex gap-3 px-4 py-4`}>
      <div className="w-[3px] shrink-0 rounded-full bg-[var(--brand)]" />
      <div className="flex-1">
        <span className={KICKER}>뉴스</span>
        <div className={`${TITLE} mt-1 text-[13px]`}>큰 제목 한 줄</div>
        <Lines n={3} className="mt-2.5" />
      </div>
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
            <Preview id={m.id} />
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
