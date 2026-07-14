import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PortfolioColumns } from '@/components/portfolio/portfolio-columns'
import { PortfolioShell } from '@/components/portfolio/portfolio-shell'
import { ExperienceCardView } from '@/components/portfolio/sections/experience-card-view'
import { getExperiencesByProfile, getMediaUrl, getMediaUrls, getProfileByUsername } from '@/db/queries'
import { pfPageMetadata } from '@/lib/seo'

export const revalidate = 3600

type Params = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username } = await params
  const profile = await getProfileByUsername(username)
  if (!profile) return {}
  return pfPageMetadata({
    username,
    sub: '/experience',
    title: `경력 — ${profile.name}`,
    description: `${profile.name}의 경력과 이력`,
  })
}

export default async function ExperiencePage({ params }: Params) {
  const { username } = await params
  const profile = await getProfileByUsername(username)
  if (!profile) notFound()

  const exps = await getExperiencesByProfile(profile.id)
  const mediaIds = exps.flatMap((e) => (e.media ?? []).map((m) => m.mediaId))
  const [logos, covers, avatarUrl, expMediaUrls] = await Promise.all([
    getMediaUrls(exps.map((e) => e.logoId)),
    getMediaUrls(exps.map((e) => e.coverId)),
    getMediaUrl(profile.avatarId),
    getMediaUrls(mediaIds),
  ])
  const awards = profile.awards ?? []

  return (
    <PortfolioShell profile={profile}>
      <PortfolioColumns profile={profile} avatarUrl={avatarUrl}>
        <div className="pf-reveal mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--pf-fg-faint)]">
          경력 · CAREER
        </div>
        <h1 className="pf-reveal pf-display m-0 mb-[clamp(40px,6vw,64px)] text-[clamp(44px,9vw,120px)]">
          <span className="block text-[var(--pf-fg)]">WORK</span>
          <span className="block text-[var(--pf-headline-dim)]">EXPERIENCE</span>
        </h1>

        <div className="flex flex-col gap-4">
          {exps.map((e) => (
            <ExperienceCardView
              key={e.id}
              data={{
                company: e.company,
                role: e.role,
                period: e.period,
                length: e.length,
                context: e.context,
                current: e.current,
                points: e.points ?? [],
                stack: e.stack ?? [],
                media: e.media ?? [],
                mediaUrls: expMediaUrls,
                logoUrl: e.logoId ? (logos[e.logoId] ?? null) : null,
                coverUrl: e.coverId ? (covers[e.coverId] ?? null) : null,
              }}
            />
          ))}
        </div>

        {/* 수상·학력·연락처 */}
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
          {awards.length > 0 && (
            <div className="pf-reveal rounded-[24px] border border-white/[0.07] bg-[var(--pf-surface)] p-[clamp(24px,3vw,36px)]">
              <div className="mb-5 text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--pf-ac)]">
                수상 · 자격 · 활동
              </div>
              <div className="flex flex-col">
                {awards.map((a) => (
                  <div
                    key={a.title}
                    className="flex justify-between gap-4 border-b border-white/[0.06] py-3.5"
                  >
                    <span className="text-[14.5px] leading-[1.45] text-[var(--pf-fg-dim)]">{a.title}</span>
                    <span className="whitespace-nowrap text-right text-[11px] text-[var(--pf-fg-fainter)]">
                      {a.kind}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="pf-reveal rounded-[24px] border border-white/[0.07] bg-[var(--pf-surface)] p-[clamp(24px,3vw,36px)]">
            {profile.education && (
              <>
                <div className="mb-4 text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--pf-ac)]">학력</div>
                <div className="text-[18px] text-[var(--pf-fg)]">{profile.education}</div>
              </>
            )}
            <div className="mb-4 mt-9 text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--pf-ac)]">
              연락처
            </div>
            <div className="flex flex-col gap-2.5 text-[14px] text-[var(--pf-fg-dim)]">
              {profile.email && (
                <a href={`mailto:${profile.email}`} className="hover:text-[var(--pf-ac)]">
                  {profile.email}
                </a>
              )}
              {profile.github && (
                <a
                  href={`https://github.com/${profile.github.replace(/^.*github\.com\//, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--pf-ac)]"
                >
                  github.com/{profile.github.replace(/^.*github\.com\//, '')}
                </a>
              )}
              {profile.phone && <span className="text-[var(--pf-fg-faint)]">{profile.phone}</span>}
            </div>
          </div>
        </div>
      </PortfolioColumns>
    </PortfolioShell>
  )
}
