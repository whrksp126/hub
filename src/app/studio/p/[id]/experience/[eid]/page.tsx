import { notFound } from 'next/navigation'
import { LiveExperienceEditor } from '@/components/studio/live-experience-editor'
import { getMediaUrl, getMediaUrls } from '@/db/queries'
import { requireUser } from '@/lib/auth'
import { getEditableProfile, getStudioExperience } from '@/lib/portfolio-studio'

export const metadata = { title: '경력 편집 — Studio' }

type Params = { params: Promise<{ id: string; eid: string }> }

export default async function EditExperiencePage({ params }: Params) {
  const user = await requireUser()
  const { id, eid } = await params
  const profile = await getEditableProfile(user.id, user.role === 'admin', Number(id))
  if (!profile) notFound()
  const experience = await getStudioExperience(Number(eid))
  if (!experience || experience.profileId !== profile.id) notFound()
  const mediaIds = (experience.media ?? []).map((m) => m.mediaId)
  const [logoUrl, coverUrl, avatarUrl, mediaUrls] = await Promise.all([
    getMediaUrl(experience.logoId),
    getMediaUrl(experience.coverId),
    getMediaUrl(profile.avatarId),
    getMediaUrls(mediaIds),
  ])

  return (
    <div className="py-6">
      <LiveExperienceEditor profile={profile} avatarUrl={avatarUrl} experience={experience} logoUrl={logoUrl} coverUrl={coverUrl} mediaUrls={mediaUrls} />
    </div>
  )
}
