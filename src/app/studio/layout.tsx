import { StudioHeader } from '@/components/studio/studio-header'
import { getCurrentUser } from '@/lib/auth'

export const metadata = { title: 'Studio', robots: { index: false } }
// 빌드 시 정적 렌더(및 DB 접근) 방지 — 항상 요청 시 렌더
export const dynamic = 'force-dynamic'

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  return (
    <div className="min-h-dvh">
      <StudioHeader email={user?.email} />
      {children}
    </div>
  )
}
