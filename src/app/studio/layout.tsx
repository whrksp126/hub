import { StudioHeader } from '@/components/studio/studio-header'
import { getCurrentUser } from '@/lib/auth'

export const metadata = { title: 'Studio', robots: { index: false } }
// 빌드 시 정적 렌더(및 DB 접근) 방지 — 항상 요청 시 렌더
export const dynamic = 'force-dynamic'

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  // 미인증(로그인·최초설정)은 admin 네비 없이 깨끗한 독립 화면.
  if (!user) {
    return <div className="pf min-h-dvh">{children}</div>
  }

  // 인증 후에만 포트폴리오와 동일한 플로팅 알약 네비 + 상단 여백.
  return (
    <div className="pf min-h-dvh">
      <StudioHeader username={user.username} isAdmin={user.role === 'admin'} />
      <main className="pt-[88px]">{children}</main>
    </div>
  )
}
