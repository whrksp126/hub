import Image from 'next/image'
import type { BlogTheme, BlogThemeProps } from './types'
import { blogSample } from './samples'

const CATEGORY_LABEL: Record<string, string> = {
  news: '뉴스',
  bugfix: '버그해결',
  tech: '기술',
}

function fmtDate(d?: Date | null) {
  return d ? d.toISOString().slice(0, 10) : null
}

function Tags({ tags }: { tags?: string[] | null }) {
  if (!tags?.length) return null
  return (
    <div className="mt-8 flex flex-wrap gap-2">
      {tags.map((t) => (
        <span key={t} className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--fg-muted)]">
          #{t}
        </span>
      ))}
    </div>
  )
}

// 1) 깔끔 텍스트 — 중앙 정렬, 넉넉한 여백, 가독성 최우선
function Clean(p: BlogThemeProps) {
  return (
    <article className="mx-auto max-w-2xl px-5 py-16 sm:py-20">
      {p.category && <p className="text-sm font-medium text-[var(--brand)]">{CATEGORY_LABEL[p.category] ?? p.category}</p>}
      <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{p.title}</h1>
      <div className="mt-3 text-sm text-[var(--fg-muted)]">{fmtDate(p.publishedAt)}</div>
      {p.coverUrl && (
        <Image src={p.coverUrl} alt={p.title} width={1200} height={630} className="mt-8 w-full rounded-xl object-cover" />
      )}
      <div className="mt-10">{p.children}</div>
      <Tags tags={p.tags} />
    </article>
  )
}

// 2) 매거진 — 큰 커버 히어로 + 타이틀 오버레이
function Magazine(p: BlogThemeProps) {
  return (
    <article>
      <header className="relative isolate flex min-h-[42vh] items-end overflow-hidden">
        {p.coverUrl ? (
          <Image src={p.coverUrl} alt={p.title} fill className="-z-10 object-cover" />
        ) : (
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[var(--brand)] to-black" />
        )}
        <div className="absolute inset-0 -z-10 bg-black/45" />
        <div className="mx-auto w-full max-w-4xl px-6 pb-10 text-white">
          {p.category && <p className="text-sm font-semibold uppercase tracking-wide">{CATEGORY_LABEL[p.category] ?? p.category}</p>}
          <h1 className="mt-2 text-4xl font-extrabold leading-tight sm:text-5xl">{p.title}</h1>
          <p className="mt-3 text-sm text-white/80">{fmtDate(p.publishedAt)}</p>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-5 py-12">
        {p.children}
        <Tags tags={p.tags} />
      </div>
    </article>
  )
}

// 3) 개발노트 — 모노 악센트, 좌측 카테고리 라벨
function Devlog(p: BlogThemeProps) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16">
      <div className="mb-6 flex items-center gap-2 font-mono text-xs text-[var(--fg-muted)]">
        <span className="rounded bg-[var(--brand)]/15 px-2 py-1 text-[var(--brand)]">
          {p.category ? CATEGORY_LABEL[p.category] ?? p.category : 'log'}
        </span>
        <span>{fmtDate(p.publishedAt)}</span>
      </div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{p.title}</h1>
      {p.excerpt && <p className="mt-3 text-lg text-[var(--fg-muted)]">{p.excerpt}</p>}
      <div className="mt-8 border-t border-[var(--line)] pt-8">{p.children}</div>
      <Tags tags={p.tags} />
    </article>
  )
}

// 4) 카드형 — 박스 컨테이너 + 부드러운 그림자
function Card(p: BlogThemeProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <article className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--bg)] shadow-sm">
        {p.coverUrl && (
          <Image src={p.coverUrl} alt={p.title} width={1200} height={500} className="h-56 w-full object-cover" />
        )}
        <div className="px-6 py-10 sm:px-10">
          {p.category && <p className="text-sm font-medium text-[var(--brand)]">{CATEGORY_LABEL[p.category] ?? p.category}</p>}
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{p.title}</h1>
          <div className="mt-2 text-sm text-[var(--fg-muted)]">{fmtDate(p.publishedAt)}</div>
          <div className="mt-8">{p.children}</div>
          <Tags tags={p.tags} />
        </div>
      </article>
    </div>
  )
}

// 5) 노트 — 좌측 악센트 보더, 노트 느낌
function Notebook(p: BlogThemeProps) {
  return (
    <article className="mx-auto max-w-2xl px-5 py-16">
      <div className="border-l-4 border-[var(--brand)] pl-5">
        {p.category && <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand)]">{CATEGORY_LABEL[p.category] ?? p.category}</p>}
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{p.title}</h1>
        <div className="mt-2 text-sm text-[var(--fg-muted)]">{fmtDate(p.publishedAt)}</div>
      </div>
      <div className="mt-10">{p.children}</div>
      <Tags tags={p.tags} />
    </article>
  )
}

export const blogThemes: Record<string, BlogTheme> = {
  clean: { meta: { id: 'clean', name: '깔끔 텍스트', description: '중앙 정렬·넉넉한 여백, 가독성 최우선' }, Layout: Clean, sample: blogSample },
  magazine: { meta: { id: 'magazine', name: '매거진', description: '큰 커버 히어로 + 타이틀 오버레이' }, Layout: Magazine, sample: blogSample },
  devlog: { meta: { id: 'devlog', name: '개발노트', description: '모노 악센트·카테고리 라벨, 기술글에 적합' }, Layout: Devlog, sample: blogSample },
  card: { meta: { id: 'card', name: '카드형', description: '박스 컨테이너 + 부드러운 그림자' }, Layout: Card, sample: blogSample },
  notebook: { meta: { id: 'notebook', name: '노트', description: '좌측 악센트 보더, 메모 같은 느낌' }, Layout: Notebook, sample: blogSample },
}
