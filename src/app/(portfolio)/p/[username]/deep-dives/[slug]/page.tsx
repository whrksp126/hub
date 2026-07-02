import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { NoteBody } from '@/components/portfolio/note-blocks'
import { PortfolioColumns } from '@/components/portfolio/portfolio-columns'
import { PortfolioShell } from '@/components/portfolio/portfolio-shell'
import { getMediaUrl, getMediaUrls, getNoteBySlug, getProfileByUsername } from '@/db/queries'
import type { NoteBlock } from '@/db/schema'
import { pfPath, pfUrl } from '@/lib/seo'

export const revalidate = 3600

type Params = { params: Promise<{ username: string; slug: string }> }

// 한글 slug는 Next가 인코딩된 채로 넘기므로 디코드해서 DB 값과 맞춘다.
const dec = (s: string) => {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username, slug: rawSlug } = await params
  const slug = dec(rawSlug)
  const profile = await getProfileByUsername(username)
  if (!profile) return {}
  const note = await getNoteBySlug(profile.id, slug)
  if (!note) return {}
  const image = (await getMediaUrl(note.coverId)) ?? undefined
  return {
    title: `${note.title} — ${profile.name}`,
    description: note.excerpt ?? undefined,
    alternates: { canonical: pfUrl(username, `/deep-dives/${slug}`) },
    openGraph: {
      title: note.title,
      description: note.excerpt ?? undefined,
      url: pfUrl(username, `/deep-dives/${slug}`),
      type: 'article',
      images: image ? [{ url: image }] : undefined,
    },
  }
}

export default async function NoteDetail({ params }: Params) {
  const { username, slug: rawSlug } = await params
  const slug = dec(rawSlug)
  const profile = await getProfileByUsername(username)
  if (!profile) notFound()
  const note = await getNoteBySlug(profile.id, slug)
  if (!note) notFound()

  const blocks = (note.content as NoteBlock[] | null) ?? []
  const [coverUrl, mediaUrls, avatarUrl] = await Promise.all([
    getMediaUrl(note.coverId),
    getMediaUrls(blocks.filter((b) => b.type === 'image').map((b) => (b as { mediaId: number | null }).mediaId)),
    getMediaUrl(profile.avatarId),
  ])

  return (
    <PortfolioShell profile={profile}>
      <PortfolioColumns profile={profile} avatarUrl={avatarUrl} align="left">
        <article className="max-w-[760px]">
          <Link href={pfPath(username, '/deep-dives')} className="mb-8 inline-flex items-center gap-1.5 text-sm text-[var(--pf-fg-muted)] transition-colors hover:text-[var(--pf-fg)]">
            <ArrowLeft size={15} /> 글 목록
          </Link>

          {coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt={note.title} className="mb-[clamp(20px,3vw,32px)] w-full rounded-[20px]" />
          )}

          <div className="mb-4 flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.08em]">
            <span className="flex flex-wrap gap-3.5">
              {note.category && <span className="text-[var(--pf-ac)]">{note.category}</span>}
              {note.date && <span className="text-[var(--pf-fg-faint)]">{note.date}</span>}
            </span>
            {note.readTime && <span className="text-[var(--pf-fg-faint)]">{note.readTime}</span>}
          </div>
          <h1 className="m-0 mb-[clamp(24px,4vw,40px)] text-[clamp(30px,5vw,56px)] font-extrabold leading-[1.12] tracking-[-0.02em] text-[var(--pf-fg)]">
            {note.title}
          </h1>

          {note.excerpt && (
            <p className="mb-[clamp(28px,4vw,44px)] text-[clamp(17px,2vw,21px)] leading-[1.6] text-[var(--pf-fg-dim)]">
              {note.excerpt}
            </p>
          )}

          <NoteBody blocks={blocks} mediaUrls={mediaUrls} />
        </article>
      </PortfolioColumns>
    </PortfolioShell>
  )
}
