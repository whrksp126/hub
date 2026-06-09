import type { Metadata } from 'next'
import Link from 'next/link'
import { getMediaUrls, getPublishedPosts } from '@/db/queries'
import { buildMetadata } from '@/lib/seo'

export const revalidate = 60
export const metadata: Metadata = buildMetadata({ title: '블로그', path: '/blog' })

const CATEGORY_LABEL: Record<string, string> = { news: '뉴스', bugfix: '버그해결', tech: '기술' }

export default async function BlogListPage() {
  const posts = await getPublishedPosts()
  const covers = await getMediaUrls(posts.map((p) => p.coverId))

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-3xl font-bold tracking-tight">블로그</h1>
      <p className="mt-2 text-[var(--fg-muted)]">개발 기록 · 뉴스 · 버그 해결</p>

      {posts.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-[var(--line)] p-12 text-center text-sm text-[var(--fg-muted)]">
          아직 발행된 글이 없습니다.
        </div>
      ) : (
        <ul className="mt-10 space-y-8">
          {posts.map((p) => (
            <li key={p.id} className="group">
              <Link href={`/blog/${p.slug}`} className="flex gap-5">
                {p.coverId && covers[p.coverId] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={covers[p.coverId]} alt={p.title} className="hidden h-24 w-32 shrink-0 rounded-lg object-cover sm:block" />
                )}
                <div>
                  <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
                    <span className="text-[var(--brand)]">{CATEGORY_LABEL[p.category] ?? p.category}</span>
                    {p.publishedAt && <time>{p.publishedAt.toISOString().slice(0, 10)}</time>}
                  </div>
                  <h2 className="mt-1 text-lg font-semibold transition-colors group-hover:text-[var(--brand)]">{p.title}</h2>
                  {p.excerpt && <p className="mt-1 line-clamp-2 text-sm text-[var(--fg-muted)]">{p.excerpt}</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
