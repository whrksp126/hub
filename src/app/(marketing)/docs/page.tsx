import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Logo } from '@/components/brand/logo'
import { JsonLd } from '@/components/json-ld'
import { techArticleJsonLd } from '@/lib/jsonld'
import { SITE_URL } from '@/lib/seo'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Folio SDK 문서',
  description:
    '저장소를 읽어 포트폴리오 케이스 스터디 초안을 만들고, REST·SDK·CLI·MCP로 발행하는 HubGmate 에이전트 발행 문서.',
  alternates: { canonical: `${SITE_URL}/docs` },
}

const TOC = [
  { id: 'intro', label: '소개' },
  { id: 'install', label: '설치' },
  { id: 'quickstart', label: '빠른 시작' },
  { id: 'concepts', label: '핵심 개념' },
  { id: 'ingest', label: 'AI 인제스트' },
  { id: 'api', label: 'API 레퍼런스' },
  { id: 'themes', label: '테마 · 렌더링' },
]

const CONCEPTS = [
  { name: 'Profile', body: '이름·직함·연락처 등 정체성 정보' },
  { name: 'Project', body: '저장소에서 생성된 케이스 스터디' },
  { name: 'Experience', body: '기간·역할 단위의 경력 항목' },
]

const API_ROWS = [
  { fn: 'createFolio(opts)', desc: 'SDK 인스턴스를 생성합니다. apiKey와 locale을 받습니다.' },
  { fn: 'folio.profile(data)', desc: '이름·직함·연락처 등 프로필 정보를 정의합니다.' },
  { fn: 'folio.ingest(opts)', desc: '저장소를 분석해 케이스 스터디 초안을 생성합니다.' },
  { fn: 'folio.render(opts)', desc: '정의된 리소스를 선택한 테마의 정적 사이트로 출력합니다.' },
]

// 코드 토큰 색 (디자인 그대로)
const K = ({ children }: { children: ReactNode }) => <span className="text-[var(--pf-fg-faint)]">{children}</span>
const S = ({ children }: { children: ReactNode }) => <span className="text-[var(--pf-lime-2)]">{children}</span>
const A = ({ children }: { children: ReactNode }) => <span className="text-[var(--pf-ac)]">{children}</span>
const C = ({ children }: { children: ReactNode }) => <span className="text-[#6C6C6C]">{children}</span>

function Pre({ children }: { children: ReactNode }) {
  return (
    <div className="pf-reveal mb-[clamp(40px,5vw,56px)] overflow-x-auto rounded-[16px] border border-white/[0.09] bg-[#141414] px-[22px] py-5">
      <pre className="pf-mono m-0 text-[13px] leading-[1.85] text-[var(--pf-fg-dim)]">{children}</pre>
    </div>
  )
}

function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="pf-reveal m-0 mb-[18px] scroll-mt-[110px] text-[clamp(22px,3vw,32px)] font-bold uppercase tracking-[-0.015em] text-[var(--pf-fg)]"
      style={{ fontFamily: 'var(--font-display-en), var(--font-sans)' }}
    >
      {children}
    </h2>
  )
}

const Inline = ({ children }: { children: ReactNode }) => (
  <code className="pf-mono rounded-[6px] bg-[#1f1f1f] px-[7px] py-[2px] text-[13.5px] text-[var(--pf-fg)]">
    {children}
  </code>
)

export default function DocsPage() {
  return (
    <div className="pf relative min-h-dvh overflow-x-hidden">
      <JsonLd
        data={techArticleJsonLd({
          headline: 'Folio SDK 문서',
          description:
            '저장소를 읽어 포트폴리오 케이스 스터디 초안을 만들고, REST·SDK·CLI·MCP로 발행하는 HubGmate 에이전트 발행 문서.',
          path: '/docs',
        })}
      />
      {/* 상단 바 (랜딩과 동일한 플로팅 pill) */}
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
        <div className="mx-auto grid w-full max-w-[1160px] gap-[clamp(24px,5vw,72px)] px-[clamp(18px,5vw,64px)] pb-[clamp(64px,9vw,120px)] pt-[clamp(24px,4vw,56px)] lg:grid-cols-[200px_minmax(0,1fr)]">
          {/* 좌측 TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-[110px]">
              <div className="mb-5 text-[13px] font-bold uppercase tracking-[0.04em] text-[var(--pf-ac)]">
                FOLIO SDK
              </div>
              <nav className="flex flex-col gap-3.5">
                {TOC.map((t) => (
                  <a
                    key={t.id}
                    href={`#${t.id}`}
                    className="text-[14px] text-[var(--pf-fg-muted)] transition-colors hover:text-[var(--pf-fg)]"
                  >
                    {t.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* 본문 */}
          <div className="min-w-0">
            <div
              id="intro"
              className="pf-reveal mb-4 scroll-mt-[110px] text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--pf-fg-faint)]"
            >
              기술 문서 · V0.1.0 (DRAFT)
            </div>
            <h1 className="pf-reveal pf-display m-0 mb-6 !leading-[0.95] text-[clamp(40px,7vw,72px)] text-[var(--pf-fg)]">
              FOLIO SDK
            </h1>
            <p className="pf-reveal m-0 mb-[18px] max-w-[680px] text-[clamp(15px,1.5vw,17px)] leading-[1.75] text-[var(--pf-fg-dim)]">
              개발자가 자신의 저장소·커밋·README를 입력하면, AI가 이를 읽어 포트폴리오용 케이스 스터디 초안을 만들어
              주는 SDK입니다. HubGmate에서 만든 포트폴리오가 Folio SDK로 렌더링되는 레퍼런스 구현입니다.
            </p>
            <p className="pf-reveal m-0 mb-[clamp(40px,5vw,56px)] max-w-[680px] text-[15px] leading-[1.7] text-[var(--pf-fg-muted)]">
              아래 문서는 SDK가 안정화되기 전 초안입니다. 인터페이스는 변경될 수 있습니다. 발급한 API 키는{' '}
              <Link href="/studio/keys" className="text-[var(--pf-ac)] hover:underline">
                스튜디오 → API 키
              </Link>
              에서 관리합니다.
            </p>

            <H2 id="install">설치</H2>
            <p className="pf-reveal m-0 mb-[18px] text-[15.5px] leading-[1.7] text-[var(--pf-fg-muted)]">
              npm 또는 호환 패키지 매니저로 설치합니다. Node 18 이상이 필요합니다.
            </p>
            <Pre>
              <C>$</C> npm install @ghmate/folio
            </Pre>

            <H2 id="quickstart">빠른 시작</H2>
            <p className="pf-reveal m-0 mb-[18px] text-[15.5px] leading-[1.7] text-[var(--pf-fg-muted)]">
              프로필을 정의하고, 저장소를 인제스트한 뒤, 테마를 골라 렌더링합니다.
            </p>
            <Pre>
              <K>import</K> {'{ createFolio } '}
              <K>from</K> <S>{"'@ghmate/folio'"}</S>
              {'\n\n'}
              <K>const</K> folio = createFolio({'({'}
              {'\n  apiKey: process.env.'}
              <A>FOLIO_KEY</A>
              {',\n  locale: '}
              <S>{"'ko'"}</S>
              {',\n})'}
              {'\n\n'}
              <C>{'// 프로필 정의'}</C>
              {'\n'}
              <K>await</K> folio.profile({'({'}
              {'\n  name: '}
              <S>{"'홍길동'"}</S>
              {',\n  title: '}
              <S>{"'풀스택 개발자'"}</S>
              {',\n})'}
              {'\n\n'}
              <C>{'// 저장소를 읽어 케이스 스터디 초안 생성'}</C>
              {'\n'}
              <K>const</K> project = <K>await</K> folio.ingest({'({'}
              {'\n  repo: '}
              <S>{"'github.com/username/my-project'"}</S>
              {',\n})'}
              {'\n\n'}
              <K>await</K> folio.render({'({ theme: '}
              <S>{"'editorial-dark'"}</S>
              {' })'}
            </Pre>

            <H2 id="concepts">핵심 개념</H2>
            <p className="pf-reveal m-0 mb-[22px] text-[15.5px] leading-[1.7] text-[var(--pf-fg-muted)]">
              SDK는 세 가지 리소스를 다룹니다.
            </p>
            <div className="pf-reveal mb-[clamp(40px,5vw,56px)] grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3.5">
              {CONCEPTS.map((c) => (
                <div key={c.name} className="rounded-[18px] border border-white/[0.07] bg-[var(--pf-surface)] p-[22px]">
                  <div className="mb-2.5 text-[13px] font-bold text-[var(--pf-ac)]">{c.name}</div>
                  <div className="text-[14px] leading-[1.6] text-[var(--pf-fg-muted)]">{c.body}</div>
                </div>
              ))}
            </div>

            <H2 id="ingest">AI 인제스트</H2>
            <p className="pf-reveal m-0 mb-[18px] text-[15.5px] leading-[1.7] text-[var(--pf-fg-muted)]">
              <Inline>ingest()</Inline> 는 커밋 히스토리와 README, 디렉터리 구조를 분석해 문제·해결·결과 구조의 초안을
              만듭니다. 초안은 항상 사람이 검토·수정하도록 설계되어 있습니다.
            </p>
            <Pre>
              <K>const</K> draft = <K>await</K> folio.ingest({'({'}
              {'\n  repo: '}
              <S>{"'github.com/username/another-project'"}</S>
              {',\n  emphasis: ['}
              <S>{"'realtime'"}</S>
              {', '}
              <S>{"'infra'"}</S>
              {'],\n  review: '}
              <A>true</A>
              {',   '}
              <C>{'// 사람 검토 단계 강제'}</C>
              {'\n})'}
            </Pre>

            <H2 id="api">API 레퍼런스</H2>
            <div className="pf-reveal mb-[clamp(40px,5vw,56px)] overflow-hidden rounded-[16px] border border-white/[0.08]">
              {API_ROWS.map((r) => (
                <div
                  key={r.fn}
                  className="grid grid-cols-[minmax(0,200px)_minmax(0,1fr)] gap-5 border-b border-white/[0.06] px-5 py-4 last:border-b-0"
                >
                  <code className="pf-mono text-[13px] text-[var(--pf-fg)]">{r.fn}</code>
                  <span className="text-[14px] leading-[1.55] text-[var(--pf-fg-muted)]">{r.desc}</span>
                </div>
              ))}
            </div>

            <H2 id="themes">테마 · 렌더링</H2>
            <p className="pf-reveal m-0 mb-[18px] text-[15.5px] leading-[1.7] text-[var(--pf-fg-muted)]">
              <Inline>render()</Inline> 는 정의된 리소스를 정적 사이트로 출력합니다. <Inline>editorial-dark</Inline> 가
              기본 테마이며, HubGmate 포트폴리오가 그 예시입니다.
            </p>
            <Pre>
              <C>$</C> folio build --theme editorial-dark --out ./site
            </Pre>
          </div>
        </div>
      </main>
    </div>
  )
}
