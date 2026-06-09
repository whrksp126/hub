import { notFound } from 'next/navigation'
import { EditorShell } from '@/components/studio/editor-shell'
import { requireUser } from '@/lib/auth'
import { CONTENT_TYPE_META, isContentType } from '@/lib/content-types'
import { getStudioDoc } from '@/lib/studio'

export default async function EditorPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>
}) {
  await requireUser()
  const { type, id } = await params
  if (!isContentType(type)) notFound()
  const doc = await getStudioDoc(type, Number(id))
  if (!doc) notFound()

  return (
    <EditorShell
      type={type}
      id={doc.id}
      initialTitle={doc.title}
      initialSlug={doc.slug}
      initialStatus={doc.status as 'draft' | 'published'}
      initialContent={doc.content}
      publicPath={CONTENT_TYPE_META[type].publicPath}
    />
  )
}
