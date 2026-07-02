import type { ReactNode } from 'react'
import { EditableText, type EditableField } from '@/components/portfolio/editable-text'
import { Thumb } from '@/components/portfolio/pieces'
import { legacyToSocial, socialPlatform } from '@/components/portfolio/social-kit'
import type { Profile } from '@/db/schema'

// 모든 포트폴리오 페이지 공용: 흰 프로필 카드(아크 데코 + 이미지 + 이름 + 소개 + 소셜).
// ≥1080에선 좌측 사이드바로 스크롤 따라오는 sticky, 이하에선 풀폭.
// 공개=정적, 프로필 편집기=슬롯/edit 주입으로 그 자리 편집. 카드 외형은 이 한 곳이 단일 소스.
export function ProfileCard({
  profile,
  avatarUrl,
  edit,
  avatarSlot,
  socialSlot,
}: {
  profile: Profile
  avatarUrl: string | null
  // 이름·소개 인라인 편집(프로필 편집기에서만 주입)
  edit?: { name?: EditableField; bio?: EditableField }
  // 편집기에서 아바타 업로더/소셜 편집기를 주입. 없으면 정적 렌더.
  avatarSlot?: ReactNode
  socialSlot?: ReactNode
}) {
  const contacts = profile.social?.length ? profile.social : legacyToSocial(profile)
  return (
    <div className="pf-reveal relative mb-[clamp(40px,6vw,72px)] flex w-full flex-col items-center overflow-hidden rounded-[16px] bg-white p-5 text-center min-[1080px]:sticky min-[1080px]:top-24 min-[1080px]:mb-0 min-[1080px]:self-start">
      {/* 상단 점선 아크: 카드 좌상단 모서리 고정 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/deco/arc-top.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-2 top-2 z-20 w-[170px]"
      />
      {/* 불꽃 + 하단 점선 아크: 항상 이미지 왼쪽(넘치는 왼쪽은 카드가 클립) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/deco/arc-flame.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-[-110px] top-[200px] z-20 w-[200px]"
      />
      {avatarSlot ?? (
        <Thumb
          url={avatarUrl}
          alt={profile.name}
          className="relative z-1 block aspect-[240/284] w-[240px] max-w-full rounded-[16px] bg-[linear-gradient(180deg,#a62602,#ce4404)]"
        />
      )}
      <EditableText
        value={profile.name}
        edit={edit?.name}
        onLight
        className="mt-[18px] block font-poppins text-[36px] font-bold leading-[1.1] tracking-[-0.04em] text-black"
      />
      {(edit?.bio || profile.bio) && (
        <EditableText
          value={profile.bio ?? ''}
          edit={edit?.bio}
          onLight
          multiline
          className="m-0 mt-4 block max-w-[320px] font-poppins text-[18px] font-medium leading-[1.1] text-[#6a6b6e]"
        />
      )}
      {socialSlot ??
        (contacts.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-5 text-[var(--pf-ac)]">
            {contacts.map((c, i) => {
              const pf = socialPlatform(c.kind)
              const Icon = pf.icon
              return (
                <a
                  key={i}
                  href={pf.href(c.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={c.label || pf.label}
                  className="hover:opacity-60"
                >
                  <Icon size={21} strokeWidth={1.7} />
                </a>
              )
            })}
          </div>
        ))}
    </div>
  )
}
