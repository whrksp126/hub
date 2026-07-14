import { ArrowRight, ArrowUpRight, Bot, GitBranch, Palette, Sparkles } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import { JsonLd } from '@/components/json-ld'
import { Thumb } from '@/components/portfolio/pieces'
import { getMediaUrls, getPublishedProfiles } from '@/db/queries'
import { softwareApplicationJsonLd, websiteJsonLd } from '@/lib/jsonld'
import { SITE_NAME, SITE_URL, pfPath } from '@/lib/seo'

export const revalidate = 3600

export const metadata: Metadata = {
  // 이미 사이트명을 포함하므로 template( — HubGmate) 우회.
  title: { absolute: 'HubGmate — AI로 완성하는 개발자 포트폴리오' },
  description:
    'AI 에이전트가 저장소를 읽어 케이스 스터디 초안을 만들고, 워드프레스식 테마로 발행까지. REST·SDK·CLI·MCP로 프로그램 발행하는 개발자 포트폴리오 빌더.',
  alternates: { canonical: SITE_URL },
}

const STEPS = [
  {
    icon: Bot,
    kicker: '01 · INGEST',
    title: 'AI가 저장소를 읽습니다',
    body: '커밋 히스토리·README·디렉터리 구조를 분석해 문제 → 해결 → 결과 구조의 케이스 스터디 초안을 자동 생성합니다.',
  },
  {
    icon: Palette,
    kicker: '02 · THEME',
    title: '테마를 고릅니다',
    body: '워드프레스처럼 완성된 룩앤필을 갤러리에서 선택. 편집 화면과 결과 화면이 완전히 동일한 노션식 편집 경험.',
  },
  {
    icon: GitBranch,
    kicker: '03 · PUBLISH',
    title: '프로그램으로 발행합니다',
    body: 'REST · SDK · CLI · MCP로 조사부터 발행까지 자동화. 사람은 검토·수정만, 반복 작업은 에이전트가.',
  },
]

export default async function LandingPage() {
  const profiles = await getPublishedProfiles()
  const avatars = await getMediaUrls(profiles.map((p) => p.avatarId))

  return (
    <div className="pf relative min-h-dvh overflow-x-hidden">
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={softwareApplicationJsonLd()} />

      {/* 상단 바 */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-60 flex justify-center px-4 pt-[22px]">
        <nav className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(22,22,22,0.86)] py-2 pl-5 pr-2 shadow-[0_16px_50px_rgba(0,0,0,0.45)] backdrop-blur-[16px]">
          <Link href="/" aria-label="HubGmate" className="px-1 text-[var(--pf-fg)]">
            <Logo size={22} withBead={false} />
          </Link>
          <span className="mx-1 h-5 w-px bg-white/10" />
          <Link
            href="/studio/signup"
            className="flex items-center gap-1.5 rounded-full bg-[var(--pf-ac)] px-4 py-2 text-[13px] font-semibold text-white transition hover:brightness-110"
          >
            시작하기
            <ArrowRight size={14} strokeWidth={2.2} />
          </Link>
        </nav>
      </header>

      <main className="pt-24">
        {/* ── HERO ── */}
        <section className="mx-auto w-full max-w-[1280px] px-[clamp(18px,5vw,64px)] pb-[clamp(48px,7vw,96px)] pt-[clamp(24px,5vw,72px)]">
          <div className="pf-reveal inline-flex items-center gap-2 rounded-full border border-white/[0.12] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--pf-fg-dim)]">
            <Sparkles size={14} className="text-[var(--pf-ac)]" />
            AI 포트폴리오 빌더
          </div>
          <h1 className="pf-display pf-reveal m-0 mt-7 text-[clamp(44px,9vw,150px)] leading-[0.9]">
            <span className="block text-[var(--pf-fg)]">PORTFOLIO,</span>
            <span className="block text-[var(--pf-headline-dim)]">ON AUTOPILOT</span>
          </h1>
          <p className="pf-reveal mt-[clamp(20px,3vw,32px)] max-w-[600px] text-[clamp(16px,1.4vw,19px)] leading-[1.7] text-[var(--pf-fg-muted)]">
            저장소만 연결하면 AI 에이전트가 케이스 스터디를 쓰고, 완성된 테마로 발행합니다. 개발자가 코드를
            짜듯, 포트폴리오도 프로그램으로 관리하세요.
          </p>
          <div className="pf-reveal mt-[clamp(28px,4vw,40px)] flex flex-wrap gap-3">
            <Link
              href="/studio/signup"
              className="inline-flex items-center gap-2.5 rounded-full bg-[var(--pf-ac)] px-7 py-4 text-[14px] font-semibold text-[#141414] transition hover:brightness-110"
            >
              내 포트폴리오 만들기
              <ArrowRight size={16} strokeWidth={2} />
            </Link>
            {profiles[0] && (
              <Link
                href={pfPath(profiles[0].username)}
                className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.16] px-7 py-4 text-[14px] font-semibold text-[var(--pf-fg-dim)] transition hover:border-[var(--pf-fg)] hover:text-[var(--pf-fg)]"
              >
                예시 포트폴리오 보기
                <ArrowUpRight size={16} strokeWidth={2} className="text-[var(--pf-ac)]" />
              </Link>
            )}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="mx-auto w-full max-w-[1280px] px-[clamp(18px,5vw,64px)] py-[clamp(48px,7vw,96px)]">
          <div className="pf-reveal mb-[clamp(24px,3vw,40px)] text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--pf-fg-faint)]">
            작동 방식 · HOW IT WORKS
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
            {STEPS.map((s) => {
              const Icon = s.icon
              return (
                <div
                  key={s.kicker}
                  className="pf-reveal flex flex-col gap-4 rounded-[22px] border border-white/[0.07] bg-[var(--pf-surface)] p-[clamp(24px,3vw,32px)]"
                >
                  <Icon size={30} strokeWidth={1.7} className="text-[var(--pf-ac)]" />
                  <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--pf-fg-faint)]">
                    {s.kicker}
                  </div>
                  <h3 className="m-0 text-[clamp(19px,2vw,24px)] font-bold tracking-[-0.01em] text-[var(--pf-fg)]">
                    {s.title}
                  </h3>
                  <p className="m-0 text-[14.5px] leading-[1.65] text-[var(--pf-fg-muted)]">{s.body}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── SHOWCASE ── */}
        {profiles.length > 0 && (
          <section className="mx-auto w-full max-w-[1280px] px-[clamp(18px,5vw,64px)] py-[clamp(48px,7vw,96px)]">
            <div className="pf-reveal mb-[clamp(28px,4vw,48px)] flex flex-wrap items-end justify-between gap-5">
              <h2 className="pf-display m-0 text-[clamp(40px,7vw,104px)]">
                <span className="block text-[var(--pf-fg)]">MADE WITH</span>
                <span className="block text-[var(--pf-headline-dim)]">HUBGMATE</span>
              </h2>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
              {profiles.map((p) => (
                <Link
                  key={p.id}
                  href={pfPath(p.username)}
                  className="pf-reveal flex flex-col gap-5 rounded-[24px] border border-white/[0.07] bg-[var(--pf-surface)] p-7 transition-colors hover:bg-[#1B1B1B]"
                >
                  <div className="flex items-center justify-between">
                    <Thumb url={avatars[p.avatarId ?? -1]} alt={p.name} className="h-14 w-14 rounded-[14px]" />
                    <ArrowUpRight size={22} strokeWidth={1.9} className="text-[var(--pf-ac)]" />
                  </div>
                  <div>
                    <div className="text-[22px] font-bold tracking-[-0.01em] text-[var(--pf-fg)]">{p.name}</div>
                    {p.title && <div className="mt-1 text-[13px] text-[var(--pf-fg-faint)]">{p.title}</div>}
                  </div>
                  {p.tagline && (
                    <p className="m-0 text-[14px] leading-[1.6] text-[var(--pf-fg-muted)]">{p.tagline}</p>
                  )}
                  <span className="pf-mono mt-auto text-[12px] text-[var(--pf-fg-fainter)]">
                    hub.ghmate.com/{p.username}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── CTA ── */}
        <section className="mx-auto w-full max-w-[1280px] px-[clamp(18px,5vw,64px)] pb-[clamp(72px,10vw,140px)] pt-[clamp(40px,6vw,80px)]">
          <div className="pf-reveal rounded-[28px] border border-white/[0.07] bg-[var(--pf-surface-2)] p-[clamp(32px,5vw,72px)]">
            <h2 className="pf-display m-0 !leading-[0.9] text-[clamp(36px,7vw,96px)] text-[var(--pf-fg)]">
              지금 시작하세요
            </h2>
            <p className="mt-6 max-w-[520px] text-[16px] leading-[1.65] text-[var(--pf-fg-muted)]">
              관리자 계정으로 로그인하면 테마를 고르고, AI로 글을 쓰고, API 키로 자동 발행까지 — 모든 흐름이
              하나로 연결됩니다.
            </p>
            <Link
              href="/studio"
              className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-[var(--pf-ac)] px-7 py-4 text-[14px] font-semibold text-[#141414] transition hover:brightness-110"
            >
              스튜디오 열기
              <ArrowRight size={16} strokeWidth={2} />
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 text-[12px] text-[var(--pf-fg-fainter)]">
            <span>© {new Date().getFullYear()} {SITE_NAME} · 슬기로운 사업</span>
            <div className="flex items-center gap-4">
              <Link href="/docs" className="hover:text-[var(--pf-ac)]">문서</Link>
              <span>hub.ghmate.com</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
