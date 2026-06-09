import { NewGallery } from '@/components/studio/new-gallery'
import { requireUser } from '@/lib/auth'

export default async function NewContentPage() {
  await requireUser()
  return <NewGallery />
}
