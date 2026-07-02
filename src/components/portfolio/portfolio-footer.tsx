import Link from 'next/link'
import { legacyToSocial, socialPlatform } from '@/components/portfolio/social-kit'
import type { Profile } from '@/db/schema'
import { pfPath } from '@/lib/seo'

// 디자인의 카드형 푸터.
export function PortfolioFooter({ profile }: { profile: Profile }) {
  const base = pfPath(profile.username)
  const contacts = profile.social?.length ? profile.social : legacyToSocial(profile)
  return (
    <footer className="cv-auto mx-auto w-full max-w-[1280px] px-[clamp(18px,5vw,64px)] pb-[clamp(28px,4vw,40px)]">
      <div className="rounded-[28px] border border-white/[0.07] bg-[var(--pf-surface-2)] p-[clamp(28px,4vw,48px)]">
        <div className="mb-[clamp(32px,4vw,48px)] flex flex-col items-center gap-7 text-center lg:flex-row lg:items-start lg:justify-between lg:text-left">
          <div>
            <div className="mb-2.5 text-[clamp(26px,4vw,44px)] font-extrabold tracking-[-0.02em] text-[var(--pf-fg)]">
              {profile.name}
              {profile.nameEn ? ` / ${profile.nameEn}` : ''}
            </div>
            <div className="text-[13px] leading-relaxed text-[var(--pf-fg-faint)]">
              {profile.title}
              {profile.tagline ? (
                <>
                  <br />
                  {profile.tagline}
                </>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-[clamp(28px,4vw,56px)] text-center lg:justify-start lg:text-left">
            <div className="flex flex-col gap-[11px]">
              <span className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-fg-fainter)]">
                PAGES
              </span>
              <Link href={`${base}/projects`} className="text-sm text-[var(--pf-fg-dim)] hover:text-[var(--pf-ac)]">
                Projects
              </Link>
              <Link
                href={`${base}/experience`}
                className="text-sm text-[var(--pf-fg-dim)] hover:text-[var(--pf-ac)]"
              >
                Experience
              </Link>
              <Link
                href={`${base}/deep-dives`}
                className="text-sm text-[var(--pf-fg-dim)] hover:text-[var(--pf-ac)]"
              >
                Writing
              </Link>
            </div>
            {contacts.length > 0 && (
              <div className="flex flex-col gap-[11px]">
                <span className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-fg-fainter)]">
                  CONTACT
                </span>
                {contacts.map((c, i) => {
                  const pf = socialPlatform(c.kind)
                  return (
                    <a
                      key={i}
                      href={pf.href(c.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--pf-fg-dim)] hover:text-[var(--pf-ac)]"
                    >
                      {c.label || pf.label}
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.07] pt-[22px] text-center sm:flex-row sm:text-left">
          <span className="text-[11px] text-[var(--pf-fg-fainter)]">
            © {new Date().getFullYear()} {profile.nameEn || profile.name}
            {profile.business ? ` · ${profile.business}` : ''}
          </span>
          <Link
            href="/"
            className="text-[11px] font-semibold tracking-[0.06em] text-[var(--pf-fg-fainter)] hover:text-[var(--pf-ac)]"
          >
            POWERED BY GHMATE
          </Link>
        </div>
      </div>
    </footer>
  )
}
