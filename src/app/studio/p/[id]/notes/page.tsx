import { notFound } from 'next/navigation'
import { StudioCollection } from '@/components/studio/studio-collection'
import { getMediaUrl } from '@/db/queries'
import { requireUser } from '@/lib/auth'
import { createNoteAction, removeNoteAction, reorderNotesAction, setNoteFeaturedAction } from '@/lib/portfolio-actions'
import { getEditableProfile, getStudioNotes } from '@/lib/portfolio-studio'

export const metadata = { title: '글 — Studio' }

type Params = { params: Promise<{ id: string }> }

export default async function PortfolioNotesPage({ params }: Params) {
  const user = await requireUser()
  const { id } = await params
  const profile = await getEditableProfile(user.id, user.role === 'admin', Number(id))
  if (!profile) notFound()
  const all = await getStudioNotes(profile.id)
  const avatarUrl = await getMediaUrl(profile.avatarId)
  const items = all.map((n) => ({
    id: n.id,
    title: n.title,
    category: n.category,
    date: n.date,
    readTime: n.readTime,
    excerpt: n.excerpt,
    featured: n.featured,
    published: n.status === 'published',
  }))

  return (
    <StudioCollection
      kind="note"
      items={items}
      profile={profile}
      avatarUrl={avatarUrl}
      addAction={createNoteAction}
      addLabel="새 글"
      actions={{ setFeatured: setNoteFeaturedAction, reorder: reorderNotesAction, remove: removeNoteAction }}
    />
  )
}
