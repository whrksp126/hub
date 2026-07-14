import { notFound } from 'next/navigation'
import { PdfExportButton } from '@/components/portfolio/pdf-export'
import { LiveProfileEditor } from '@/components/studio/live-profile-editor'
import { getMediaUrl, getMediaUrls } from '@/db/queries'
import { requireUser } from '@/lib/auth'
import { getEditableProfile, getStudioExperiences, getStudioNotes, getStudioProjects } from '@/lib/portfolio-studio'

export const metadata = { title: '포트폴리오 편집 — Studio' }

type Params = { params: Promise<{ id: string }> }

export default async function EditProfilePage({ params }: Params) {
  const user = await requireUser()
  const { id } = await params
  const profile = await getEditableProfile(user.id, user.role === 'admin', Number(id))
  if (!profile) notFound()

  // 전체 목록을 넘긴다 — 미리보기는 featured&published만, 관리는 전체.
  const [avatarUrl, allProjects, allExperiences, allNotes] = await Promise.all([
    getMediaUrl(profile.avatarId),
    getStudioProjects(profile.id),
    getStudioExperiences(profile.id),
    getStudioNotes(profile.id),
  ])
  const logos = await getMediaUrls(allProjects.map((p) => p.logoId))
  const projects = allProjects.map((p) => ({
    id: p.id,
    title: p.title,
    titleKr: p.titleKr,
    summary: p.summary,
    logoUrl: logos[p.logoId ?? -1] ?? null,
    featured: p.featured,
    published: p.status === 'published',
  }))
  const notes = allNotes.map((n) => ({
    id: n.id,
    title: n.title,
    category: n.category,
    readTime: n.readTime,
    excerpt: n.excerpt,
    featured: n.featured,
    published: n.status === 'published',
  }))
  const experiences = allExperiences.map((e) => ({
    id: e.id,
    title: e.company,
    featured: false,
    published: true,
    company: e.company,
    role: e.role,
    context: e.context,
    period: e.period,
    length: e.length,
  }))

  return (
    <div className="py-6">
      <LiveProfileEditor
        profile={profile}
        avatarUrl={avatarUrl}
        projects={projects}
        experiences={experiences}
        notes={notes}
      />
      <div className="fixed bottom-5 right-5 z-50" style={{ ['--pf-ac' as string]: profile.accent }}>
        <PdfExportButton username={profile.username} variant="inline" />
      </div>
    </div>
  )
}
