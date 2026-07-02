import { notFound } from 'next/navigation'
import { StudioCollection } from '@/components/studio/studio-collection'
import { getMediaUrl, getMediaUrls } from '@/db/queries'
import { requireUser } from '@/lib/auth'
import { createProjectAction, removeProjectAction, reorderProjectsAction, setProjectFeaturedAction } from '@/lib/portfolio-actions'
import { getEditableProfile, getStudioProjects } from '@/lib/portfolio-studio'

export const metadata = { title: '프로젝트 — Studio' }

type Params = { params: Promise<{ id: string }> }

export default async function PortfolioProjectsPage({ params }: Params) {
  const user = await requireUser()
  const { id } = await params
  const profile = await getEditableProfile(user.id, user.role === 'admin', Number(id))
  if (!profile) notFound()
  const all = await getStudioProjects(profile.id)
  const [logos, avatarUrl] = await Promise.all([getMediaUrls(all.map((p) => p.logoId)), getMediaUrl(profile.avatarId)])
  const items = all.map((p) => ({
    id: p.id,
    title: p.title,
    titleKr: p.titleKr,
    summary: p.summary,
    tag: p.tag,
    year: p.year,
    logoUrl: logos[p.logoId ?? -1] ?? null,
    featured: p.featured,
    published: p.status === 'published',
  }))

  return (
    <StudioCollection
      kind="project"
      items={items}
      profile={profile}
      avatarUrl={avatarUrl}
      addAction={createProjectAction}
      addLabel="새 프로젝트"
      actions={{ setFeatured: setProjectFeaturedAction, reorder: reorderProjectsAction, remove: removeProjectAction }}
    />
  )
}
