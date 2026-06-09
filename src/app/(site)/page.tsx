import Link from 'next/link'
import { JsonLd } from '@/components/json-ld'
import { getMediaUrls, getPublishedPosts } from '@/db/queries'
import { personJsonLd, websiteJsonLd } from '@/lib/jsonld'
import { SITE_AUTHOR, SITE_DESCRIPTION, SITE_NAME } from '@/lib/seo'

export const revalidate = 3600

const CATEGORY_LABEL: Record<string, string> = { news: '뉴스', bugfix: '버그해결', tech: '기술' }

export default async function HomePage() {
  const posts = await getPublishedPosts()
  const recent = posts.slice(0, 8)
  const covers = await getMediaUrls(recent.map((p) => p.coverId))

  return (
    <>
      <JsonLd data={[personJsonLd(), websiteJsonLd()]} />

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-5 py-20 sm:py-28">
        <p className="text-sm font-medium text-[var(--brand)]">{SITE_AUTHOR} · {SITE_NAME}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">개발 기록과 생각.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--fg-muted)]">{SITE_DESCRIPTION}</p>
        <div className="mt-8">
          <Link
            href="/blog"
            className="rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            블로그 보기
          </Link>
        </div>
      </section>

      {/* Recent posts */}
      <section className="mx-auto max-w-3xl px-5 pb-20">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-xl font-bold">최근 글</h2>
          <Link href="/blog" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]">
            전체 보기 →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--line)] p-10 text-center text-sm text-[var(--fg-muted)]">
            아직 발행된 글이 없습니다.
          </div>
        ) : (
          <ul className="space-y-6">
            {recent.map((p) => (
              <li key={p.id}>
                <Link href={`/blog/${p.slug}`} className="group flex gap-5">
                  {p.coverId && covers[p.coverId] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={covers[p.coverId]} alt={p.title} className="hidden h-20 w-28 shrink-0 rounded-lg object-cover sm:block" />
                  )}
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
                      <span className="text-[var(--brand)]">{CATEGORY_LABEL[p.category] ?? p.category}</span>
                      {p.publishedAt && <time>{p.publishedAt.toISOString().slice(0, 10)}</time>}
                    </div>
                    <h3 className="mt-1 font-semibold transition-colors group-hover:text-[var(--brand)]">{p.title}</h3>
                    {p.excerpt && <p className="mt-1 line-clamp-2 text-sm text-[var(--fg-muted)]">{p.excerpt}</p>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
