import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/json-ld'
import { getMediaUrl, getPostBySlug } from '@/db/queries'
import { PlateStaticRender } from '@/editor/plate-static'
import { blogPostingJsonLd } from '@/lib/jsonld'
import { buildMetadata } from '@/lib/seo'
import { getBlogTheme } from '@/themes/registry'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return {}
  const cover = await getMediaUrl(post.coverId)
  return buildMetadata({
    title: post.title,
    description: post.excerpt ?? undefined,
    path: `/blog/${slug}`,
    image: cover ?? undefined,
    type: 'article',
  })
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()
  const cover = await getMediaUrl(post.coverId)
  const Layout = getBlogTheme(post.theme).Layout

  return (
    <>
      <JsonLd
        data={blogPostingJsonLd({
          title: post.title,
          slug,
          excerpt: post.excerpt,
          image: cover,
          publishedAt: post.publishedAt?.toISOString(),
          updatedAt: post.updatedAt?.toISOString(),
          tags: post.tags,
        })}
      />
      <Layout
        title={post.title}
        excerpt={post.excerpt}
        publishedAt={post.publishedAt}
        category={post.category}
        coverUrl={cover}
        tags={post.tags}
      >
        <PlateStaticRender
          value={post.content}
          className="text-[17px] leading-[1.85] text-[var(--fg)] [&_a]:text-[var(--brand)] [&_a]:underline [&_a]:underline-offset-2"
        />
      </Layout>
    </>
  )
}
