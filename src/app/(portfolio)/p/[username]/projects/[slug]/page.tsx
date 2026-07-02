import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/json-ld'
import { PortfolioColumns } from '@/components/portfolio/portfolio-columns'
import { PortfolioShell } from '@/components/portfolio/portfolio-shell'
import { ProjectDetailView } from '@/components/portfolio/sections/project-detail-view'
import {
  getMediaUrl,
  getMediaUrls,
  getNotesByIds,
  getProfileByUsername,
  getProjectBySlug,
  getProjectsByProfile,
} from '@/db/queries'
import { creativeWorkJsonLd } from '@/lib/jsonld'
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
  const project = await getProjectBySlug(profile.id, slug)
  if (!project) return {}
  const title = `${project.title} — ${profile.name}`
  const image = (await getMediaUrl(project.coverId)) ?? undefined
  return {
    title,
    description: project.summary ?? undefined,
    alternates: { canonical: pfUrl(username, `/projects/${slug}`) },
    openGraph: {
      title,
      description: project.summary ?? undefined,
      url: pfUrl(username, `/projects/${slug}`),
      type: 'article',
      images: image ? [{ url: image }] : undefined,
    },
  }
}

export default async function ProjectDetail({ params }: Params) {
  const { username, slug: rawSlug } = await params
  const slug = dec(rawSlug)
  const profile = await getProfileByUsername(username)
  if (!profile) notFound()
  const project = await getProjectBySlug(profile.id, slug)
  if (!project) notFound()

  const [all, coverUrl, logoUrl, avatarUrl] = await Promise.all([
    getProjectsByProfile(profile.id),
    getMediaUrl(project.coverId),
    getMediaUrl(project.logoId),
    getMediaUrl(profile.avatarId),
  ])
  const idx = all.findIndex((p) => p.id === project.id)
  const next = all.length > 1 ? all[(idx + 1) % all.length] : null
  const base = pfPath(username)
  const metrics = project.metrics ?? []
  const sections = project.sections ?? []
  const stack = project.stack ?? []

  // 섹션 갤러리 미디어 + 관련 딥다이브 해소.
  const sectionMediaIds = sections.flatMap((s) => (s.media ?? []).map((m) => m.mediaId))
  const [sectionMediaUrls, relatedRows] = await Promise.all([
    getMediaUrls(sectionMediaIds),
    getNotesByIds(profile.id, project.relatedNoteIds ?? []),
  ])
  const relatedNotes = relatedRows.map((n) => ({
    id: n.id,
    slug: n.slug,
    title: n.title,
    category: n.category,
    date: n.date,
    readTime: n.readTime,
    href: `${base}/deep-dives/${n.slug}`,
  }))

  return (
    <PortfolioShell profile={profile}>
      <JsonLd
        data={creativeWorkJsonLd({
          username: profile.username,
          slug: project.slug,
          title: project.title,
          summary: project.summary,
          image: coverUrl,
          authorName: profile.name,
          stack,
          url: project.url,
        })}
      />
      <PortfolioColumns profile={profile} avatarUrl={avatarUrl} align="left">
        <Link
          href={`${base}/projects`}
          className="mb-[clamp(28px,4vw,48px)] inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-[var(--pf-surface)] px-[18px] py-2.5 text-[13px] font-semibold text-[var(--pf-fg-dim)] hover:border-[var(--pf-fg)] hover:text-[var(--pf-fg)]"
        >
          <ArrowLeft size={15} strokeWidth={2} className="text-[var(--pf-ac)]" />
          프로젝트 목록
        </Link>

        <ProjectDetailView
          data={{
            title: project.title,
            titleKr: project.titleKr,
            tag: project.tag,
            year: project.year,
            role: project.role,
            url: project.url,
            summary: project.summary,
            metrics,
            sections,
            stack,
            coverUrl,
            logoUrl,
            sectionMediaUrls,
            relatedNotes,
          }}
          next={next ? { href: `${base}/projects/${next.slug}`, title: next.title } : null}
        />
      </PortfolioColumns>
    </PortfolioShell>
  )
}
