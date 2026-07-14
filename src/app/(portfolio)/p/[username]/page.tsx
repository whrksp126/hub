import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/json-ld'
import { DEFAULT_CARDS } from '@/components/portfolio/card-kit'
import { PortfolioColumns } from '@/components/portfolio/portfolio-columns'
import { PortfolioShell } from '@/components/portfolio/portfolio-shell'
import { CtaSection, Hero, SkillGrid, StatList } from '@/components/portfolio/sections/home-sections'
import {
  ExperienceListSection,
  NoteCardGrid,
  ProjectListSection,
} from '@/components/portfolio/sections/list-sections'
import { ServiceCards } from '@/components/portfolio/sections/service-cards'
import {
  getExperiencesByProfile,
  getHomeNotes,
  getHomeProjects,
  getMediaUrl,
  getMediaUrls,
  getProfileByUsername,
} from '@/db/queries'
import { profilePageJsonLd } from '@/lib/jsonld'
import { pfPageMetadata, pfPath } from '@/lib/seo'

export const revalidate = 3600

type Params = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username } = await params
  const profile = await getProfileByUsername(username)
  if (!profile) return {}
  const image = (await getMediaUrl(profile.avatarId)) ?? undefined
  return pfPageMetadata({
    username,
    title: `${profile.name} — ${profile.title ?? '포트폴리오'}`,
    description: profile.tagline ?? undefined,
    image,
    type: 'profile',
  })
}

export default async function PortfolioHome({ params }: Params) {
  const { username } = await params
  const profile = await getProfileByUsername(username)
  if (!profile) notFound()

  const [featured, avatarUrl, recentNotes, allExperiences] = await Promise.all([
    getHomeProjects(profile.id), // 홈 노출(featured)만, 사용자가 선택
    getMediaUrl(profile.avatarId),
    getHomeNotes(profile.id),
    getExperiencesByProfile(profile.id),
  ])
  const experiences = allExperiences.slice(0, 4)
  const logos = await getMediaUrls(featured.map((p) => p.logoId))
  const base = pfPath(username)
  const cards = profile.cards?.length ? profile.cards : DEFAULT_CARDS
  const skills = profile.skills ?? []
  const stats = profile.stats ?? []
  const [headTop, headBottom] = (profile.headline ?? `${profile.name}\n${profile.title ?? ''}`).split('\n')
  const [ctaTop, ctaBottom] = (profile.ctaTitle ?? "LET'S WORK\nTOGETHER").split('\n')

  const projectItems = featured.map((p) => ({
    id: p.id,
    title: p.title,
    titleKr: p.titleKr,
    summary: p.summary,
    slug: p.slug,
    logoUrl: logos[p.logoId ?? -1] ?? null,
  }))
  const experienceItems = experiences.map((e) => ({
    id: e.id,
    company: e.company,
    role: e.role,
    context: e.context,
    period: e.period,
    length: e.length,
  }))
  const noteItems = recentNotes.map((n) => ({
    id: n.id,
    slug: n.slug,
    category: n.category,
    readTime: n.readTime,
    title: n.title,
    excerpt: n.excerpt,
  }))

  return (
    <PortfolioShell profile={profile}>
      <JsonLd
        data={profilePageJsonLd({
          username: profile.username,
          name: profile.name,
          title: profile.title,
          tagline: profile.tagline,
          email: profile.email,
          github: profile.github,
          image: avatarUrl,
          skills: skills.flatMap((g) => g.items),
        })}
      />

      {/* ── 메인 본문: 전 페이지 공통 컬럼(좌 프로필 카드 sticky + 우 콘텐츠) ── */}
      <PortfolioColumns profile={profile} avatarUrl={avatarUrl}>
        <Hero headTop={headTop ?? ''} headBottom={headBottom ?? ''} intro={profile.intro ?? ''} />
        <StatList stats={stats} />
        <ServiceCards cards={cards} base={base} />
        <ProjectListSection items={projectItems} base={base} />
        <ExperienceListSection items={experienceItems} base={base} />
        <SkillGrid skills={skills} />
        <NoteCardGrid items={noteItems} base={base} />
        <CtaSection
          ctaTop={ctaTop ?? ''}
          ctaBottom={ctaBottom ?? ''}
          ctaText={profile.ctaText ?? '채용·협업·외주 문의를 환영합니다. 보통 하루 안에 답장합니다.'}
          contactHref={`${base}/contact`}
        />
      </PortfolioColumns>
    </PortfolioShell>
  )
}
