import { notFound } from 'next/navigation'
import { StudioCollection } from '@/components/studio/studio-collection'
import { getMediaUrl, getMediaUrls } from '@/db/queries'
import { requireUser } from '@/lib/auth'
import { createExperienceAction, removeExperienceAction, reorderExperiencesAction } from '@/lib/portfolio-actions'
import { getEditableProfile, getStudioExperiences } from '@/lib/portfolio-studio'

export const metadata = { title: '경력 — Studio' }

type Params = { params: Promise<{ id: string }> }

export default async function PortfolioExperiencePage({ params }: Params) {
  const user = await requireUser()
  const { id } = await params
  const profile = await getEditableProfile(user.id, user.role === 'admin', Number(id))
  if (!profile) notFound()
  const all = await getStudioExperiences(profile.id)
  const [logos, covers, avatarUrl] = await Promise.all([
    getMediaUrls(all.map((e) => e.logoId)),
    getMediaUrls(all.map((e) => e.coverId)),
    getMediaUrl(profile.avatarId),
  ])
  const items = all.map((e) => ({
    id: e.id,
    company: e.company,
    role: e.role,
    period: e.period,
    length: e.length,
    context: e.context,
    current: e.current,
    points: e.points ?? [],
    stack: e.stack ?? [],
    logoUrl: logos[e.logoId ?? -1] ?? null,
    coverUrl: covers[e.coverId ?? -1] ?? null,
  }))

  return (
    <StudioCollection
      kind="experience"
      items={items}
      profile={profile}
      avatarUrl={avatarUrl}
      addAction={createExperienceAction}
      addLabel="새 경력"
      actions={{ reorder: reorderExperiencesAction, remove: removeExperienceAction }}
    />
  )
}
