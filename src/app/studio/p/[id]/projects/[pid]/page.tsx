import { notFound } from 'next/navigation'
import { LiveProjectEditor } from '@/components/studio/live-project-editor'
import { getMediaUrl, getMediaUrls } from '@/db/queries'
import { requireUser } from '@/lib/auth'
import { getEditableProfile, getStudioNotes, getStudioProject } from '@/lib/portfolio-studio'
import { pfPath } from '@/lib/seo'

export const metadata = { title: '프로젝트 편집 — Studio' }

type Params = { params: Promise<{ id: string; pid: string }> }

export default async function EditProjectPage({ params }: Params) {
  const user = await requireUser()
  const { id, pid } = await params
  const profile = await getEditableProfile(user.id, user.role === 'admin', Number(id))
  if (!profile) notFound()
  const project = await getStudioProject(Number(pid))
  if (!project || project.profileId !== profile.id) notFound()
  const sectionMediaIds = (project.sections ?? []).flatMap((s) => (s.media ?? []).map((m) => m.mediaId))
  const [coverUrl, logoUrl, avatarUrl, sectionMediaUrls, allNotes] = await Promise.all([
    getMediaUrl(project.coverId),
    getMediaUrl(project.logoId),
    getMediaUrl(profile.avatarId),
    getMediaUrls(sectionMediaIds),
    getStudioNotes(profile.id),
  ])
  const base = pfPath(profile.username)
  const noteOptions = allNotes.map((n) => ({
    id: n.id,
    slug: n.slug,
    title: n.title,
    category: n.category,
    date: n.date,
    readTime: n.readTime,
    href: `${base}/deep-dives/${n.slug}`,
  }))

  return (
    <div className="py-6">
      <LiveProjectEditor
        profile={profile}
        avatarUrl={avatarUrl}
        project={project}
        coverUrl={coverUrl}
        logoUrl={logoUrl}
        sectionMediaUrls={sectionMediaUrls}
        noteOptions={noteOptions}
      />
    </div>
  )
}
