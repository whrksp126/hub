import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DEFAULT_CARDS } from '@/components/portfolio/card-kit'
import { NoteBody } from '@/components/portfolio/note-blocks'
import { PortfolioColumns } from '@/components/portfolio/portfolio-columns'
import '@/components/portfolio/print/print.css'
import { PrintModeProvider } from '@/components/portfolio/print/print-context'
import { PrintToolbar } from '@/components/portfolio/print/print-toolbar'
import { CtaSection, Hero, SkillGrid, StatList } from '@/components/portfolio/sections/home-sections'
import { ExperienceCardView } from '@/components/portfolio/sections/experience-card-view'
import {
  ExperienceListSection,
  NoteCardGrid,
  ProjectListSection,
} from '@/components/portfolio/sections/list-sections'
import { ProjectDetailView } from '@/components/portfolio/sections/project-detail-view'
import { ServiceCards } from '@/components/portfolio/sections/service-cards'
import {
  getExperiencesByProfile,
  getHomeNotes,
  getHomeProjects,
  getMediaUrl,
  getMediaUrls,
  getNotesByIds,
  getNotesByProfile,
  getProfileByUsername,
  getProjectsByProfile,
} from '@/db/queries'
import type { CSSProperties } from 'react'
import type { NoteBlock } from '@/db/schema'
import { pfPath } from '@/lib/seo'

// 인쇄(PDF) 문서 — 실제 포트폴리오와 동일한 다크 디자인/컴포넌트를 그대로 재사용한다.
// 검색엔진에는 노출하지 않는다(정식 페이지가 canonical).
export const metadata: Metadata = { robots: { index: false, follow: false } }

type Params = { params: Promise<{ username: string }>; searchParams: Promise<Record<string, string | undefined>> }

export default async function PortfolioPrint({ params, searchParams }: Params) {
  const { username } = await params
  const sp = await searchParams
  const profile = await getProfileByUsername(username)
  if (!profile) notFound()

  // 가로 폭(사용자 설정, 기본 1080). 1080 이상이면 실제 사이트의 2단 데스크톱 레이아웃 그대로.
  const w = Math.min(2400, Math.max(600, Math.round(Number(sp.w) || 1080)))

  // ── 선택 상태 파싱 ────────────────────────────────────────────────
  // 파라미터가 하나도 없으면(직접 방문) 전부 포함. (다이얼로그는 항상 home을 명시 → 빈 선택 구분)
  const noSel = sp.home === undefined && sp.pd === undefined && sp.nd === undefined && sp.exp === undefined
  const homeSet = sp.home != null ? new Set(sp.home.split(',').filter(Boolean)) : null
  const hOn = (k: string) => noSel || (homeSet ? homeSet.has(k) : false)
  const pdAll = noSel || sp.pd === 'all'
  const pdSet = new Set((sp.pd ?? '').split(',').filter((s) => s && s !== 'all'))
  const ndAll = noSel || sp.nd === 'all'
  const ndSet = new Set((sp.nd ?? '').split(',').filter((s) => s && s !== 'all'))
  const expOn = noSel || sp.exp === '1'

  const anyHome = hOn('hero') || hOn('stats') || hOn('services') || hOn('projects') || hOn('experience') || hOn('skills') || hOn('notes') || hOn('cta')

  // ── 데이터 로드 ───────────────────────────────────────────────────
  const [homeProjects, homeNotes, allExperiences, allProjects, allNotes, avatarUrl] = await Promise.all([
    getHomeProjects(profile.id),
    getHomeNotes(profile.id),
    getExperiencesByProfile(profile.id),
    getProjectsByProfile(profile.id),
    getNotesByProfile(profile.id),
    getMediaUrl(profile.avatarId),
  ])

  const selProjects = allProjects.filter((p) => pdAll || pdSet.has(p.slug))
  const selNotes = allNotes.filter((n) => ndAll || ndSet.has(n.slug))
  const base = pfPath(username)

  // ── 필요한 미디어 id 일괄 수집 → 한 번에 조회 ────────────────────
  const ids = new Set<number>()
  const add = (v?: number | null) => {
    if (v) ids.add(v)
  }
  homeProjects.forEach((p) => add(p.logoId))
  if (hOn('projects')) homeProjects.forEach((p) => add(p.logoId))
  for (const p of selProjects) {
    add(p.coverId)
    add(p.logoId)
    for (const s of p.sections ?? []) for (const m of s.media ?? []) add(m.mediaId)
  }
  if (expOn || hOn('experience')) {
    for (const e of allExperiences) {
      add(e.logoId)
      add(e.coverId)
      for (const m of e.media ?? []) add(m.mediaId)
    }
  }
  for (const n of selNotes) {
    add(n.coverId)
    for (const b of (n.content as NoteBlock[] | null) ?? [])
      if ((b.type === 'image' || b.type === 'video') && 'mediaId' in b) add(b.mediaId)
  }
  const urls = await getMediaUrls([...ids])
  const u = (v?: number | null) => (v ? (urls[v] ?? null) : null)

  // ── 홈 요약용 아이템 매핑(실제 홈 페이지와 동일) ─────────────────
  const cards = profile.cards?.length ? profile.cards : DEFAULT_CARDS
  const skills = profile.skills ?? []
  const stats = profile.stats ?? []
  const [headTop, headBottom] = (profile.headline ?? `${profile.name}\n${profile.title ?? ''}`).split('\n')
  const [ctaTop, ctaBottom] = (profile.ctaTitle ?? "LET'S WORK\nTOGETHER").split('\n')

  const projectItems = homeProjects.map((p) => ({
    id: p.id,
    title: p.title,
    titleKr: p.titleKr,
    summary: p.summary,
    slug: p.slug,
    logoUrl: u(p.logoId),
  }))
  const experienceItems = allExperiences.slice(0, 4).map((e) => ({
    id: e.id,
    company: e.company,
    role: e.role,
    context: e.context,
    period: e.period,
    length: e.length,
  }))
  const noteItems = homeNotes.map((n) => ({
    id: n.id,
    slug: n.slug,
    category: n.category,
    readTime: n.readTime,
    title: n.title,
    excerpt: n.excerpt,
  }))

  // ── 선택 프로젝트 상세 데이터 ────────────────────────────────────
  const projectDetails = await Promise.all(
    selProjects.map(async (p) => {
      const relatedRows = await getNotesByIds(profile.id, p.relatedNoteIds ?? [])
      const sectionMediaUrls: Record<number, string> = {}
      for (const s of p.sections ?? [])
        for (const m of s.media ?? []) if (m.mediaId && urls[m.mediaId]) sectionMediaUrls[m.mediaId] = urls[m.mediaId]
      return {
        slug: p.slug,
        data: {
          title: p.title,
          titleKr: p.titleKr,
          tag: p.tag,
          year: p.year,
          role: p.role,
          url: p.url,
          summary: p.summary,
          metrics: p.metrics ?? [],
          sections: p.sections ?? [],
          stack: p.stack ?? [],
          coverUrl: u(p.coverId),
          logoUrl: u(p.logoId),
          sectionMediaUrls,
          relatedNotes: relatedRows.map((n) => ({
            id: n.id,
            slug: n.slug,
            title: n.title,
            category: n.category,
            date: n.date,
            readTime: n.readTime,
            href: `${base}/deep-dives/${n.slug}`,
          })),
        },
      }
    }),
  )

  const awards = profile.awards ?? []

  // PDF 페이지 크기를 콘텐츠 폭(w)에 맞춤 → 좁은 A4로 안 줄고, iframe 뷰포트=w라 레이아웃 정확.
  const wmm = Math.ceil((w / 96) * 25.4 * 10) / 10
  const hmm = Math.ceil(wmm * 1.4142 * 10) / 10
  const pageRule = `@page{size:${wmm}mm ${hmm}mm;margin:0}`
  const style = { '--pf-ac': profile.accent, '--pfw': `${w}px` } as CSSProperties

  // 레이아웃은 뷰포트 미디어쿼리가 아니라 pfp-wide/narrow 클래스로 강제 → 화면=인쇄 일치.
  // (Chrome 인쇄는 @page/창 크기와 무관하게 min-[1080px] 미디어쿼리를 매칭하지 않으므로 강제 필요.)
  return (
    <div className={`pfp-shell pf ${w >= 1080 ? 'pfp-wide' : 'pfp-narrow'}`} style={style}>
      {/* PDF 페이지 크기를 콘텐츠 폭(w)에 맞춰 주입 → 좁은 A4로 안 줄고 미리보기=출력. */}
      <style id="pfp-page" dangerouslySetInnerHTML={{ __html: pageRule }} />
      <PrintToolbar initialWidth={w} auto={sp.preview === undefined} />
      <div className="pfp-paper">
        <PrintModeProvider>
          <PortfolioColumns profile={profile} avatarUrl={avatarUrl}>
          {/* ── 홈 화면 섹션 ── */}
          {anyHome && (
            <div className="pfp-block flex flex-col">
              {hOn('hero') && <Hero headTop={headTop ?? ''} headBottom={headBottom ?? ''} intro={profile.intro ?? ''} />}
              {hOn('stats') && <StatList stats={stats} />}
              {hOn('services') && <ServiceCards cards={cards} base={base} />}
              {hOn('projects') && <ProjectListSection items={projectItems} base={base} />}
              {hOn('experience') && <ExperienceListSection items={experienceItems} base={base} />}
              {hOn('skills') && <SkillGrid skills={skills} />}
              {hOn('notes') && <NoteCardGrid items={noteItems} base={base} />}
              {hOn('cta') && (
                <CtaSection
                  ctaTop={ctaTop ?? ''}
                  ctaBottom={ctaBottom ?? ''}
                  ctaText={profile.ctaText ?? '채용·협업·외주 문의를 환영합니다.'}
                  contactHref={`${base}/contact`}
                />
              )}
            </div>
          )}

          {/* ── 프로젝트 상세(선택) ── */}
          {projectDetails.map((pd) => (
            <div key={pd.slug} className="pfp-block pfp-pagebreak">
              <ProjectDetailView data={pd.data} next={null} />
            </div>
          ))}

          {/* ── 경력 상세 페이지 ── */}
          {expOn && allExperiences.length > 0 && (
            <div className="pfp-block pfp-pagebreak">
              <div className="pf-reveal mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--pf-fg-faint)]">
                경력 · CAREER
              </div>
              <h2 className="pf-reveal pf-display m-0 mb-[clamp(28px,4vw,44px)] text-[clamp(38px,7vw,72px)] leading-[0.95]">
                <span className="block text-[var(--pf-fg)]">WORK</span>
                <span className="block text-[var(--pf-headline-dim)]">EXPERIENCE</span>
              </h2>
              <div className="flex flex-col gap-4">
                {allExperiences.map((e) => (
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
                      mediaUrls: urls,
                      logoUrl: u(e.logoId),
                      coverUrl: u(e.coverId),
                    }}
                  />
                ))}
              </div>
              {awards.length > 0 && (
                <div className="pf-reveal mt-4 rounded-[24px] border border-white/[0.07] bg-[var(--pf-surface)] p-[clamp(20px,3vw,32px)]">
                  <div className="mb-5 text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--pf-ac)]">수상 · 자격 · 활동</div>
                  <div className="flex flex-col">
                    {awards.map((a) => (
                      <div key={a.title} className="flex justify-between gap-4 border-b border-white/[0.06] py-3.5">
                        <span className="text-[14.5px] leading-[1.45] text-[var(--pf-fg-dim)]">{a.title}</span>
                        <span className="whitespace-nowrap text-right text-[11px] text-[var(--pf-fg-fainter)]">{a.kind}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 딥다이브 상세(선택) ── */}
          {selNotes.map((n) => {
            const blocks = (n.content as NoteBlock[] | null) ?? []
            const coverUrl = u(n.coverId)
            return (
              <div key={n.id} className="pfp-block pfp-pagebreak">
                <article className="max-w-[760px]">
                  {coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverUrl} alt={n.title} className="mb-[clamp(20px,3vw,32px)] w-full rounded-[20px]" />
                  )}
                  <div className="mb-4 flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.08em]">
                    <span className="flex flex-wrap gap-3.5">
                      {n.category && <span className="text-[var(--pf-ac)]">{n.category}</span>}
                      {n.date && <span className="text-[var(--pf-fg-faint)]">{n.date}</span>}
                    </span>
                    {n.readTime && <span className="text-[var(--pf-fg-faint)]">{n.readTime}</span>}
                  </div>
                  <h2 className="m-0 mb-[clamp(20px,4vw,36px)] text-[clamp(28px,5vw,48px)] font-extrabold leading-[1.12] tracking-[-0.02em] text-[var(--pf-fg)]">
                    {n.title}
                  </h2>
                  {n.excerpt && (
                    <p className="mb-[clamp(24px,4vw,40px)] text-[clamp(16px,2vw,20px)] leading-[1.6] text-[var(--pf-fg-dim)]">{n.excerpt}</p>
                  )}
                  <NoteBody blocks={blocks} mediaUrls={urls} />
                </article>
              </div>
            )
          })}
          </PortfolioColumns>
        </PrintModeProvider>
      </div>
    </div>
  )
}
