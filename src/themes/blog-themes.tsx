import Image from 'next/image'
import { SITE_AUTHOR } from '@/lib/seo'
import type { BlogTheme, BlogThemeProps } from './types'
import { blogSample } from './samples'

const CATEGORY_LABEL: Record<string, string> = {
  news: '뉴스',
  bugfix: '버그해결',
  tech: '기술',
}

function fmtDate(d?: Date | null) {
  return d ? d.toISOString().slice(0, 10).replace(/-/g, '. ') : null
}

function catLabel(category?: string | null, fallback = '') {
  if (!category) return fallback
  return CATEGORY_LABEL[category] ?? category
}

// 카테고리 키커(양옆/한쪽 룰 + 대문자 라벨)
function Kicker({ category, both = false }: { category?: string | null; both?: boolean }) {
  const label = catLabel(category, '글')
  return <span className={`kicker${both ? ' kicker--both' : ''}`}>{label}</span>
}

// 바이라인: 작성자 · 날짜
function Byline({ publishedAt, className = '' }: { publishedAt?: Date | null; className?: string }) {
  return (
    <div className={`text-sm ${className}`}>
      <span className="font-medium">{SITE_AUTHOR}</span>
      {fmtDate(publishedAt) && <span className="opacity-60"> · {fmtDate(publishedAt)}</span>}
    </div>
  )
}

function Tags({ tags }: { tags?: string[] | null }) {
  if (!tags?.length) return null
  return (
    <div className="mt-12 flex flex-wrap gap-2 border-t border-[var(--line)] pt-8">
      {tags.map((t) => (
        <span
          key={t}
          className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--fg-muted)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)]"
        >
          #{t}
        </span>
      ))}
    </div>
  )
}

// 1) 에디토리얼 — 중앙 정렬, 키커 + 큰 세리프 헤드라인 + 드롭캡 본문
function Editorial(p: BlogThemeProps) {
  return (
    <article className="mx-auto max-w-2xl px-5 py-16 sm:py-24">
      <header className="text-center">
        <Kicker category={p.category} both />
        <h1 className="font-display mt-5 text-4xl font-extrabold leading-[1.15] sm:text-[3.25rem]">
          {p.title}
        </h1>
        {p.excerpt && (
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-[var(--fg-muted)]">
            {p.excerpt}
          </p>
        )}
        <div className="mt-7 flex items-center justify-center">
          <Byline publishedAt={p.publishedAt} className="text-[var(--fg-muted)]" />
        </div>
      </header>
      {p.coverUrl && (
        <Image
          src={p.coverUrl}
          alt={p.title}
          width={1280}
          height={720}
          className="mt-12 aspect-[16/9] w-full rounded-2xl object-cover"
        />
      )}
      <div className="drop-cap mt-12 text-left">{p.children}</div>
      <Tags tags={p.tags} />
    </article>
  )
}

// 2) 매거진 — 풀블리드 커버 히어로 + 타이틀 오버레이
function Magazine(p: BlogThemeProps) {
  return (
    <article>
      <header className="relative isolate flex min-h-[62vh] items-end overflow-hidden">
        {p.coverUrl ? (
          <Image src={p.coverUrl} alt={p.title} fill priority className="-z-10 object-cover" />
        ) : (
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[var(--brand)] via-black to-black" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
        <div className="mx-auto w-full max-w-4xl px-6 pb-14 text-white">
          <span className="kicker kicker--both text-white">{catLabel(p.category, '글')}</span>
          <h1 className="font-display mt-4 max-w-3xl text-4xl font-extrabold leading-[1.1] drop-shadow-sm sm:text-6xl">
            {p.title}
          </h1>
          {p.excerpt && <p className="mt-5 max-w-2xl text-lg text-white/85">{p.excerpt}</p>}
          <div className="mt-6">
            <Byline publishedAt={p.publishedAt} className="text-white/80" />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-5 py-14">
        <div className="drop-cap">{p.children}</div>
        <Tags tags={p.tags} />
      </div>
    </article>
  )
}

// 3) 칼럼 — 좌측 메타 레일(비대칭) + 세리프 헤드라인, 기술/연재글에 적합
function Column(p: BlogThemeProps) {
  return (
    <article className="mx-auto max-w-5xl px-5 py-16">
      <header className="border-b border-[var(--fg)] pb-8">
        <Kicker category={p.category} />
        <h1 className="font-display mt-4 text-4xl font-bold leading-[1.15] sm:text-5xl">
          {p.title}
        </h1>
        {p.excerpt && <p className="mt-4 max-w-2xl text-lg text-[var(--fg-muted)]">{p.excerpt}</p>}
      </header>
      <div className="mt-10 grid gap-10 md:grid-cols-[180px_minmax(0,1fr)]">
        <aside className="md:border-r md:border-[var(--line)] md:pr-6">
          <Byline publishedAt={p.publishedAt} className="text-[var(--fg-muted)]" />
          {p.tags?.length ? (
            <div className="mt-4 flex flex-wrap gap-2 font-mono text-xs text-[var(--fg-muted)]">
              {p.tags.map((t) => (
                <span key={t}>#{t}</span>
              ))}
            </div>
          ) : null}
        </aside>
        <div className="min-w-0">{p.children}</div>
      </div>
    </article>
  )
}

// 4) 피처 — 커버 상단의 큰 피처드 카드
function Feature(p: BlogThemeProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <article className="overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-[var(--bg)] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.18)]">
        {p.coverUrl ? (
          <Image
            src={p.coverUrl}
            alt={p.title}
            width={1280}
            height={600}
            className="h-64 w-full object-cover sm:h-80"
          />
        ) : (
          <div className="h-32 w-full bg-gradient-to-r from-[var(--brand)]/20 to-transparent" />
        )}
        <div className="px-6 py-12 sm:px-12">
          <Kicker category={p.category} both />
          <h1 className="font-display mt-4 text-3xl font-extrabold leading-tight sm:text-[2.75rem]">
            {p.title}
          </h1>
          {p.excerpt && <p className="mt-4 text-lg text-[var(--fg-muted)]">{p.excerpt}</p>}
          <div className="mt-6 border-b border-[var(--line)] pb-6">
            <Byline publishedAt={p.publishedAt} className="text-[var(--fg-muted)]" />
          </div>
          <div className="mt-8">{p.children}</div>
          <Tags tags={p.tags} />
        </div>
      </article>
    </div>
  )
}

// 5) 사이드룰 — 굵은 좌측 악센트 바 + 대형 세리프 헤드라인
function SideRule(p: BlogThemeProps) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
      <header className="border-l-[5px] border-[var(--brand)] pl-6 sm:pl-8">
        <Kicker category={p.category} />
        <h1 className="font-display mt-3 text-4xl font-extrabold leading-[1.1] sm:text-[3.5rem]">
          {p.title}
        </h1>
        {p.excerpt && <p className="mt-5 text-lg text-[var(--fg-muted)]">{p.excerpt}</p>}
        <div className="mt-6">
          <Byline publishedAt={p.publishedAt} className="text-[var(--fg-muted)]" />
        </div>
      </header>
      {p.coverUrl && (
        <Image
          src={p.coverUrl}
          alt={p.title}
          width={1280}
          height={640}
          className="mt-10 aspect-[2/1] w-full rounded-xl object-cover"
        />
      )}
      <div className="mt-10">{p.children}</div>
      <Tags tags={p.tags} />
    </article>
  )
}

export const blogThemes: Record<string, BlogTheme> = {
  clean: {
    meta: { id: 'clean', name: '에디토리얼', description: '중앙 정렬 세리프 헤드라인 + 드롭캡, 잡지 사설 느낌' },
    Layout: Editorial,
    sample: blogSample,
  },
  magazine: {
    meta: { id: 'magazine', name: '매거진', description: '풀블리드 커버 히어로 + 큰 타이틀 오버레이' },
    Layout: Magazine,
    sample: blogSample,
  },
  devlog: {
    meta: { id: 'devlog', name: '칼럼', description: '좌측 메타 레일(비대칭) + 세리프 헤드라인, 기술/연재' },
    Layout: Column,
    sample: blogSample,
  },
  card: {
    meta: { id: 'card', name: '피처', description: '커버를 품은 큰 피처드 카드 + 부드러운 그림자' },
    Layout: Feature,
    sample: blogSample,
  },
  notebook: {
    meta: { id: 'notebook', name: '사이드룰', description: '굵은 좌측 악센트 바 + 대형 세리프 헤드라인' },
    Layout: SideRule,
    sample: blogSample,
  },
}
