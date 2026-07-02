import type { ReactNode } from 'react'
import { ProfileCard } from '@/components/portfolio/profile-card'
import type { Profile } from '@/db/schema'

// 포트폴리오 전 페이지 공통 본문 레이아웃:
// ≥1080 = 좌측 스티키 프로필 카드 + 우측 콘텐츠 2단(max-w-1280)
// <1080 = 가운데 정렬 단일 컬럼(max-w-800) — 카드는 콘텐츠 위에 풀폭
// 좌우 여백·정렬을 모든 페이지에서 동일하게 유지하는 단일 소스.
export function PortfolioColumns({
  profile,
  avatarUrl,
  align = 'center',
  card,
  children,
}: {
  profile: Profile
  avatarUrl: string | null
  // 목록/홈은 <1080에서 가운데 정렬, 상세 본문은 항상 좌측 정렬.
  align?: 'center' | 'left'
  // 사이드바 카드 override(편집기에서 편집형 ProfileCard 주입). 없으면 정적 ProfileCard.
  card?: ReactNode
  children: ReactNode
}) {
  const content = align === 'left' ? 'min-w-0 text-left' : 'min-w-0 text-center min-[1080px]:text-left'
  return (
    <div className="mx-auto w-full max-w-[800px] px-[clamp(18px,5vw,40px)] pb-[clamp(72px,10vw,140px)] pt-[clamp(8px,2vw,24px)] min-[1080px]:max-w-[1280px] min-[1080px]:grid min-[1080px]:grid-cols-[320px_minmax(0,1fr)] min-[1080px]:items-start min-[1080px]:gap-[clamp(40px,4vw,72px)] min-[1080px]:px-[clamp(18px,5vw,64px)]">
      {card ?? <ProfileCard profile={profile} avatarUrl={avatarUrl} />}
      <div className={content}>{children}</div>
    </div>
  )
}
