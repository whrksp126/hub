import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ContactForm } from '@/components/portfolio/contact-form'
import { PortfolioColumns } from '@/components/portfolio/portfolio-columns'
import { PortfolioShell } from '@/components/portfolio/portfolio-shell'
import { getMediaUrl, getProfileByUsername } from '@/db/queries'
import { pfUrl } from '@/lib/seo'

export const revalidate = 3600

type Params = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username } = await params
  const profile = await getProfileByUsername(username)
  if (!profile) return {}
  return {
    title: `연락하기 — ${profile.name}`,
    description: `${profile.name}에게 채용·협업·외주 문의하기`,
    alternates: { canonical: pfUrl(username, '/contact') },
  }
}

const cardCls =
  'flex items-center justify-between rounded-[16px] border border-white/[0.08] bg-[var(--pf-surface)] px-[22px] py-[18px] text-[14px] text-[var(--pf-fg-dim)] transition-colors hover:border-[var(--pf-ac)]'
const labelCls = 'text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--pf-fg-faint)]'

export default async function ContactPage({ params }: Params) {
  const { username } = await params
  const profile = await getProfileByUsername(username)
  if (!profile) notFound()
  const github = profile.github?.replace(/^.*github\.com\//, '')
  const avatarUrl = await getMediaUrl(profile.avatarId)

  return (
    <PortfolioShell profile={profile}>
      <PortfolioColumns profile={profile} avatarUrl={avatarUrl}>
        <div className="pf-reveal mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--pf-fg-faint)]">
          연락 · GET IN TOUCH
        </div>
        <h1 className="pf-reveal pf-display m-0 mb-[clamp(36px,5vw,56px)] !leading-[0.9] text-[clamp(44px,9vw,120px)] text-[var(--pf-fg)]">
          함께 일해요
        </h1>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[clamp(28px,4vw,48px)]">
          <div className="pf-reveal">
            <p className="m-0 mb-7 text-[clamp(16px,1.5vw,18px)] leading-[1.7] text-[var(--pf-fg-dim)]">
              채용·협업·외주 문의를 환영합니다. 보통 하루 안에 답장합니다.
            </p>
            <div className="flex flex-col gap-3">
              {profile.email && (
                <a href={`mailto:${profile.email}`} className={cardCls}>
                  <span className={labelCls}>EMAIL</span>
                  {profile.email}
                </a>
              )}
              {github && (
                <a
                  href={`https://github.com/${github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cardCls}
                >
                  <span className={labelCls}>GITHUB</span>
                  {github}
                </a>
              )}
              {profile.phone && (
                <div className={cardCls}>
                  <span className={labelCls}>PHONE</span>
                  {profile.phone}
                </div>
              )}
            </div>
          </div>
          <div className="pf-reveal">{profile.email && <ContactForm email={profile.email} />}</div>
        </div>
      </PortfolioColumns>
    </PortfolioShell>
  )
}
