import { notFound } from 'next/navigation'
import { LiveNoteEditor } from '@/components/studio/live-note-editor'
import { getMediaUrl, getMediaUrls } from '@/db/queries'
import type { NoteBlock } from '@/db/schema'
import { requireUser } from '@/lib/auth'
import { getEditableProfile, getStudioNote } from '@/lib/portfolio-studio'

export const metadata = { title: '글 편집 — Studio' }

type Params = { params: Promise<{ id: string; nid: string }> }

export default async function EditNotePage({ params }: Params) {
  const user = await requireUser()
  const { id, nid } = await params
  const profile = await getEditableProfile(user.id, user.role === 'admin', Number(id))
  if (!profile) notFound()
  const note = await getStudioNote(Number(nid))
  if (!note || note.profileId !== profile.id) notFound()

  const blocks = (note.content as NoteBlock[] | null) ?? []
  const [coverUrl, blockMediaUrls, avatarUrl] = await Promise.all([
    getMediaUrl(note.coverId),
    getMediaUrls(blocks.filter((b) => b.type === 'image' || b.type === 'video').map((b) => (b as { mediaId?: number | null }).mediaId ?? null)),
    getMediaUrl(profile.avatarId),
  ])

  return (
    <div className="py-6">
      <LiveNoteEditor
        note={note}
        profile={profile}
        username={profile.username}
        avatarUrl={avatarUrl}
        coverUrl={coverUrl}
        blockMediaUrls={blockMediaUrls}
      />
    </div>
  )
}
