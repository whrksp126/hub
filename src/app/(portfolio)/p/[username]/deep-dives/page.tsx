import { ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PortfolioColumns } from '@/components/portfolio/portfolio-columns'
import { PortfolioShell } from '@/components/portfolio/portfolio-shell'
import { getMediaUrl, getNotesByProfile, getProfileByUsername } from '@/db/queries'
import { pfPath, pfUrl } from '@/lib/seo'

export const revalidate = 3600

type Params = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username } = await params
  const profile = await getProfileByUsername(username)
  if (!profile) return {}
  return {
    title: `글 — ${profile.name}`,
    description: `${profile.name}의 기록과 글`,
    alternates: { canonical: pfUrl(username, '/deep-dives') },
  }
}

export default async function NotesPage({ params }: Params) {
  const { username } = await params
  const profile = await getProfileByUsername(username)
  if (!profile) notFound()
  const [notes, avatarUrl] = await Promise.all([getNotesByProfile(profile.id), getMediaUrl(profile.avatarId)])
  const base = pfPath(username)

  return (
    <PortfolioShell profile={profile}>
      <PortfolioColumns profile={profile} avatarUrl={avatarUrl}>
        <div className="pf-reveal mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--pf-fg-faint)]">
          기록 · WRITING
        </div>
        <h1 className="pf-reveal pf-display m-0 mb-[clamp(32px,5vw,56px)] text-[clamp(44px,9vw,120px)]">
          <span className="block text-[var(--pf-fg)]">DEEP</span>
          <span className="block text-[var(--pf-headline-dim)]">DIVES</span>
        </h1>

        {notes.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-white/[0.12] p-12 text-center text-[var(--pf-fg-muted)]">
            아직 작성된 글이 없습니다.
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {notes.map((po) => (
              <Link
                key={po.id}
                href={`${base}/deep-dives/${po.slug}`}
                className="pf-reveal grid grid-cols-[minmax(0,1fr)_24px] items-start gap-[clamp(20px,4vw,40px)] border-b border-white/[0.06] py-[clamp(22px,3vw,30px)] transition-colors hover:opacity-80"
              >
                <div>
                  <div className="mb-3.5 flex gap-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--pf-fg-faint)]">
                    {po.category && <span className="text-[var(--pf-ac)]">{po.category}</span>}
                    {po.date && <span>{po.date}</span>}
                    {po.readTime && <span>{po.readTime}</span>}
                  </div>
                  <h2 className="m-0 mb-3 text-[clamp(20px,2.5vw,30px)] font-bold leading-[1.25] tracking-[-0.015em] text-[var(--pf-fg)]">
                    {po.title}
                  </h2>
                  {po.excerpt && (
                    <p className="m-0 max-w-[680px] text-[15px] leading-[1.6] text-[var(--pf-fg-muted)]">
                      {po.excerpt}
                    </p>
                  )}
                </div>
                <ArrowUpRight size={22} strokeWidth={1.9} className="mt-1 text-[var(--pf-ac)]" />
              </Link>
            ))}
          </div>
        )}
      </PortfolioColumns>
    </PortfolioShell>
  )
}
