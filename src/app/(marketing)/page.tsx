import { ArrowRight, ArrowUpRight, BarChart3, Bot, Cable, Code, Database, Eye, FileText, Sparkles, UserRound, Workflow } from 'lucide-react'
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
  title: { absolute: 'HubGmate — 에이전트가 발행하는 개발자 포트폴리오' },
  description:
    '프로젝트의 AI 에이전트에 MCP만 연결하면, 저장소를 읽어 케이스 스터디·아키텍처 다이어그램·ERD·기술 글까지 초안으로 만듭니다. 검토 후 공개하는 셀프호스팅 개발자 포트폴리오.',
  alternates: { canonical: SITE_URL },
}

// 실제 흐름: MCP 연결 → 에이전트가 레포 분석·생성 → 검토·공개.
const STEPS = [
  {
    icon: Cable,
    kicker: '01 · CONNECT',
    title: 'MCP를 연결합니다',
    body: '프로젝트 레포에 .mcp.json과 API 키만 넣으면 끝. Claude Code·Cursor 등 MCP를 지원하는 어떤 에이전트든 연결됩니다.',
  },
  {
    icon: Bot,
    kicker: '02 · GENERATE',
    title: '에이전트가 레포를 읽고 만듭니다',
    body: '커밋·README·코드 구조를 분석해 케이스 스터디, 아키텍처 다이어그램, ERD, 기술 글을 HubGmate 스펙대로 초안 생성합니다. 사람이 복붙할 필요 없이.',
  },
  {
    icon: Eye,
    kicker: '03 · REVIEW & PUBLISH',
    title: '검토하고 공개합니다',
    body: '발행물은 모두 초안(draft)으로 들어옵니다. 결과 화면 그대로 인라인 편집(편집=결과)하고, 준비되면 공개하세요.',
  },
]

// 에이전트가 실제로 만들어내는 콘텐츠(전부 렌더러가 구현되어 있음).
const PRODUCES = [
  { icon: FileText, title: '케이스 스터디', body: '문제 → 해결 → 결과 서사, 임팩트 지표, 스택.' },
  { icon: Workflow, title: '아키텍처 다이어그램', body: 'mermaid 흐름도·시퀀스. 다크 테마 + 라인 아이콘.' },
  { icon: Database, title: 'ERD', body: '텍스트 한 벌로 MySQL Workbench 스타일 데이터 모델.' },
  { icon: BarChart3, title: '차트', body: '비율(파이)·추세(막대) 그래프도 텍스트로.' },
  { icon: Code, title: '기술 딥다이브', body: '코드 블록·표·콜아웃을 가진 상세 기술 글.' },
  { icon: UserRound, title: '경력 · 프로필', body: '경력, 스킬, 연락처까지 프로필 전체 구성.' },
]

const MCP_SNIPPET = `// .mcp.json — 프로젝트 레포에 추가
{
  "mcpServers": {
    "hubgmate": {
      "type": "http",
      "url": "https://hub.ghmate.com/api/mcp",
      "headers": {
        "Authorization": "Bearer \${HUBGMATE_API_KEY}"
      }
    }
  }
}`

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
            MCP · 에이전트 자율 발행
          </div>
          <h1 className="pf-display pf-reveal m-0 mt-7 text-[clamp(44px,9vw,150px)] leading-[0.9]">
            <span className="block text-[var(--pf-fg)]">PORTFOLIO,</span>
            <span className="block text-[var(--pf-headline-dim)]">ON AUTOPILOT</span>
          </h1>
          <p className="pf-reveal mt-[clamp(20px,3vw,32px)] max-w-[620px] text-[clamp(16px,1.4vw,19px)] leading-[1.7] text-[var(--pf-fg-muted)]">
            당신 프로젝트의 AI 에이전트에 <span className="text-[var(--pf-fg-dim)]">MCP</span>만 연결하세요. 레포를 읽어
            케이스 스터디·아키텍처 다이어그램·ERD·기술 글까지 초안으로 만들어 올립니다. 당신은 검토하고 공개만 하면 됩니다.
          </p>
          <div className="pf-reveal mt-[clamp(28px,4vw,40px)] flex flex-wrap gap-3">
            <Link
              href="/studio/signup"
              className="inline-flex items-center gap-2.5 rounded-full bg-[var(--pf-ac)] px-7 py-4 text-[14px] font-semibold text-[#141414] transition hover:brightness-110"
            >
              시작하기
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

        {/* ── WHAT IT PRODUCES ── */}
        <section className="mx-auto w-full max-w-[1280px] px-[clamp(18px,5vw,64px)] py-[clamp(48px,7vw,96px)]">
          <div className="pf-reveal mb-[clamp(24px,3vw,40px)] text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--pf-fg-faint)]">
            에이전트가 만드는 것 · OUTPUT
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
            {PRODUCES.map((p) => {
              const Icon = p.icon
              return (
                <div
                  key={p.title}
                  className="pf-reveal flex flex-col gap-3 rounded-[18px] border border-white/[0.07] bg-[var(--pf-surface)] p-6"
                >
                  <Icon size={24} strokeWidth={1.8} className="text-[var(--pf-ac)]" />
                  <h3 className="m-0 text-[17px] font-bold tracking-[-0.01em] text-[var(--pf-fg)]">{p.title}</h3>
                  <p className="m-0 text-[13.5px] leading-[1.6] text-[var(--pf-fg-muted)]">{p.body}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── MCP SETUP ── */}
        <section className="mx-auto w-full max-w-[1280px] px-[clamp(18px,5vw,64px)] py-[clamp(48px,7vw,96px)]">
          <div className="grid items-center gap-[clamp(24px,4vw,56px)] lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <div className="pf-reveal mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--pf-fg-faint)]">
                연결 · SETUP
              </div>
              <h2 className="pf-reveal m-0 text-[clamp(26px,3.5vw,44px)] font-extrabold leading-[1.1] tracking-[-0.02em] text-[var(--pf-fg)]">
                파일 하나면
                <br />
                에이전트가 붙습니다
              </h2>
              <p className="pf-reveal mt-5 max-w-[420px] text-[15px] leading-[1.7] text-[var(--pf-fg-muted)]">
                레포에 <code className="pf-mono text-[var(--pf-fg-dim)]">.mcp.json</code>을 넣고 키를 환경변수로 두면 끝.
                그다음 에이전트에게 이렇게만 말하면 됩니다.
              </p>
              <p className="pf-reveal mt-4 rounded-xl border border-[var(--pf-ac)]/30 bg-[var(--pf-ac)]/[0.08] px-4 py-3 text-[14px] text-[var(--pf-fg-dim)]">
                “이 레포를 HubGmate에 포트폴리오로 발행해줘”
              </p>
            </div>
            <div className="pf-reveal overflow-x-auto rounded-[18px] border border-white/[0.09] bg-[#0E0E0E] p-[clamp(18px,2.5vw,28px)]">
              <pre className="pf-mono m-0 text-[12.5px] leading-[1.75] text-[var(--pf-fg-dim)]">{MCP_SNIPPET}</pre>
            </div>
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
            <p className="mt-6 max-w-[540px] text-[16px] leading-[1.65] text-[var(--pf-fg-muted)]">
              스튜디오에서 포트폴리오를 만들고 API 키를 발급하세요. 프로젝트 에이전트에 MCP를 연결하면, 나머지는
              에이전트가 초안으로 채웁니다.
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
            <span>hub.ghmate.com</span>
          </div>
        </section>
      </main>
    </div>
  )
}
