import type { CSSProperties, ReactNode } from 'react'
import type { Profile } from '@/db/schema'
import { PortfolioFooter } from './portfolio-footer'
import { PortfolioNav } from './portfolio-nav'

// 포트폴리오 전 페이지 공통 셸: .pf 루트(다크 토큰) + 강조색 오버라이드 + 플로팅 nav + 푸터.
export function PortfolioShell({ profile, children }: { profile: Profile; children: ReactNode }) {
  const style = { '--pf-ac': profile.accent } as CSSProperties
  return (
    <div className="pf relative min-h-dvh overflow-x-clip" style={style}>
      <PortfolioNav username={profile.username} />
      <main className="pt-24">{children}</main>
      <PortfolioFooter profile={profile} />
    </div>
  )
}
