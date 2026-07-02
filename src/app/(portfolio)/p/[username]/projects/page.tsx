import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProjectRow } from '@/components/portfolio/pieces'
import { PortfolioColumns } from '@/components/portfolio/portfolio-columns'
import { PortfolioShell } from '@/components/portfolio/portfolio-shell'
import { getMediaUrl, getMediaUrls, getProfileByUsername, getProjectsByProfile } from '@/db/queries'
import { pfPath, pfUrl } from '@/lib/seo'

export const revalidate = 3600

type Params = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username } = await params
  const profile = await getProfileByUsername(username)
  if (!profile) return {}
  const title = `프로젝트 — ${profile.name}`
  return {
    title,
    description: `${profile.name}의 프로젝트와 케이스 스터디`,
    alternates: { canonical: pfUrl(username, '/projects') },
  }
}

export default async function ProjectsPage({ params }: Params) {
  const { username } = await params
  const profile = await getProfileByUsername(username)
  if (!profile) notFound()

  const projects = await getProjectsByProfile(profile.id)
  const [logos, avatarUrl] = await Promise.all([
    getMediaUrls(projects.map((p) => p.logoId)),
    getMediaUrl(profile.avatarId),
  ])
  const base = pfPath(username)

  return (
    <PortfolioShell profile={profile}>
      <PortfolioColumns profile={profile} avatarUrl={avatarUrl}>
        <div className="pf-reveal mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--pf-fg-faint)]">
          선택된 작업 · {String(projects.length).padStart(2, '0')}
        </div>
        <h1 className="pf-reveal pf-display m-0 mb-[clamp(32px,5vw,56px)] text-[clamp(44px,9vw,120px)]">
          <span className="block text-[var(--pf-fg)]">RECENT</span>
          <span className="block text-[var(--pf-headline-dim)]">PROJECTS</span>
        </h1>
        {projects.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-white/[0.12] p-12 text-center text-[var(--pf-fg-muted)]">
            아직 등록된 프로젝트가 없습니다.
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {projects.map((p) => (
              <ProjectRow
                key={p.id}
                project={p}
                href={`${base}/projects/${p.slug}`}
                logoUrl={logos[p.logoId ?? -1]}
                showMeta
              />
            ))}
          </div>
        )}
      </PortfolioColumns>
    </PortfolioShell>
  )
}
