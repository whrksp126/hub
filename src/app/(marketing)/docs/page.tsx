import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Logo } from '@/components/brand/logo'
import { JsonLd } from '@/components/json-ld'
import { techArticleJsonLd } from '@/lib/jsonld'
import { SITE_URL } from '@/lib/seo'

export const revalidate = 3600

const DESC =
  '프로젝트의 AI 에이전트가 MCP로 저장소를 읽어 포트폴리오·케이스 스터디·다이어그램·ERD·기술 글을 자율 발행하는 방법. Claude Code·Cursor 등 MCP 클라이언트 지원.'

export const metadata: Metadata = {
  title: '에이전트 발행 문서 (MCP)',
  description: DESC,
  alternates: { canonical: `${SITE_URL}/docs` },
}

const TOC = [
  { id: 'intro', label: '소개' },
  { id: 'setup', label: '연결' },
  { id: 'publish', label: '발행하기' },
  { id: 'tools', label: '툴 레퍼런스' },
  { id: 'specs', label: '저작 스펙' },
  { id: 'flow', label: '검토 · 공개' },
]

const TOOLS = [
  { fn: 'whoami', desc: '접근 가능한 프로필과 상태를 확인합니다.' },
  { fn: 'list_content', desc: '기존 프로젝트·경력·딥다이브를 나열합니다(멱등 판단용).' },
  { fn: 'ensure_profile', desc: '포트폴리오 프로필을 생성/갱신합니다. 신규는 draft.' },
  { fn: 'upload_media', desc: '이미지를 저장하고 media id를 반환합니다(url 또는 base64).' },
  { fn: 'upsert_project', desc: '케이스 스터디를 생성/갱신합니다. slug 기준 멱등.' },
  { fn: 'upsert_experience', desc: '경력 항목을 생성/갱신합니다.' },
  { fn: 'upsert_deep_dive', desc: '기술 글을 생성/갱신합니다. slug 기준 멱등.' },
]

const GUIDE_RES = [
  { uri: 'hubgmate://guide/overview', label: '발행 순서 · 원칙' },
  { uri: 'hubgmate://guide/case-study', label: '케이스 스터디 구조 · 섹션 kind' },
  { uri: 'hubgmate://guide/diagrams', label: '다이어그램(mermaid) · @accent/@icon' },
  { uri: 'hubgmate://guide/erd', label: 'ERD(erDiagram) · Workbench 룩' },
  { uri: 'hubgmate://guide/deep-dive', label: '딥다이브 블록 규칙' },
  { uri: 'hubgmate://guide/media', label: '이미지 · 영상 · 로고 · 썸네일' },
  { uri: 'hubgmate://guide/style', label: '디자인 토큰 · 톤 · 정직성' },
]

const MCP_JSON = `{
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

// 코드 토큰 색
const C = ({ children }: { children: ReactNode }) => <span className="text-[#6C6C6C]">{children}</span>
const S = ({ children }: { children: ReactNode }) => <span className="text-[var(--pf-lime-2)]">{children}</span>

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
      <JsonLd data={techArticleJsonLd({ headline: '에이전트 발행 문서 (MCP)', description: DESC, path: '/docs' })} />
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
              <div className="mb-5 text-[13px] font-bold uppercase tracking-[0.04em] text-[var(--pf-ac)]">AGENT · MCP</div>
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
              개발자 문서 · MCP 자율 발행
            </div>
            <h1 className="pf-reveal pf-display m-0 mb-6 !leading-[0.95] text-[clamp(40px,7vw,72px)] text-[var(--pf-fg)]">
              AGENT PUBLISHING
            </h1>
            <p className="pf-reveal m-0 mb-[18px] max-w-[680px] text-[clamp(15px,1.5vw,17px)] leading-[1.75] text-[var(--pf-fg-dim)]">
              HubGmate는 <strong className="text-[var(--pf-fg)]">MCP 서버</strong>를 제공합니다. 당신 프로젝트의 AI
              에이전트가 저장소를 읽어 케이스 스터디·아키텍처 다이어그램·ERD·기술 글까지 초안으로 만들어 발행합니다.
              Claude Code·Cursor 등 MCP를 지원하는 어떤 에이전트든 연결됩니다.
            </p>
            <p className="pf-reveal m-0 mb-[clamp(40px,5vw,56px)] max-w-[680px] text-[15px] leading-[1.7] text-[var(--pf-fg-muted)]">
              모든 발행물은 <strong className="text-[var(--pf-fg-dim)]">초안(draft)</strong>으로 들어오며, 소유자가{' '}
              <Link href="/studio" className="text-[var(--pf-ac)] hover:underline">
                스튜디오
              </Link>
              에서 검토·공개하기 전까지 비공개입니다. 키는{' '}
              <Link href="/studio/keys" className="text-[var(--pf-ac)] hover:underline">
                스튜디오 → API 키
              </Link>
              에서 발급·관리합니다.
            </p>

            <H2 id="setup">연결</H2>
            <p className="pf-reveal m-0 mb-[18px] text-[15.5px] leading-[1.7] text-[var(--pf-fg-muted)]">
              <strong className="text-[var(--pf-fg-dim)]">1.</strong> 스튜디오 → API 키에서 키를 발급합니다(특정 프로필에
              묶으면 그 프로필에만 발행되는 하드 격리). <strong className="text-[var(--pf-fg-dim)]">2.</strong> 프로젝트
              레포 루트에 <Inline>.mcp.json</Inline>을 추가합니다(키는 안 들어갑니다 — 커밋해도 안전).
            </p>
            <Pre>{MCP_JSON}</Pre>
            <p className="pf-reveal m-0 mb-[18px] text-[15.5px] leading-[1.7] text-[var(--pf-fg-muted)]">
              <strong className="text-[var(--pf-fg-dim)]">3.</strong> 키는 <Inline>.env</Inline>(gitignore)에 환경변수로
              둡니다.
            </p>
            <Pre>
              <C>{'# .env (gitignore) — 절대 커밋하지 마세요'}</C>
              {'\nHUBGMATE_API_KEY='}
              <S>hub_xxxxxxxxxxxxxxxxxxxxxxxx</S>
            </Pre>

            <H2 id="publish">발행하기</H2>
            <p className="pf-reveal m-0 mb-[18px] text-[15.5px] leading-[1.7] text-[var(--pf-fg-muted)]">
              연결 후 에이전트에게 이렇게 말하면 됩니다. 나머지는 에이전트가 알아서 처리합니다.
            </p>
            <div className="pf-reveal mb-[clamp(24px,3vw,32px)] rounded-[16px] border border-[var(--pf-ac)]/30 bg-[var(--pf-ac)]/[0.08] px-6 py-5 text-[16px] text-[var(--pf-fg-dim)]">
              “이 레포를 HubGmate에 포트폴리오로 발행해줘”
            </div>
            <p className="pf-reveal m-0 mb-[clamp(40px,5vw,56px)] text-[15.5px] leading-[1.7] text-[var(--pf-fg-muted)]">
              에이전트는 <Inline>whoami</Inline>로 상태를 확인하고, 저작 스펙(아래)을 읽은 뒤,{' '}
              <Inline>ensure_profile</Inline> → <Inline>upload_media</Inline> → <Inline>upsert_project</Inline> 순으로
              초안을 발행합니다. 스크린샷·영상 등 이미지 <em className="text-[var(--pf-fg-dim)]">생성</em>은 프로젝트
              에이전트의 몫이고, MCP는 저장·연결과 텍스트 기반 다이어그램·ERD 렌더를 담당합니다.
            </p>

            <H2 id="tools">툴 레퍼런스</H2>
            <div className="pf-reveal mb-[clamp(40px,5vw,56px)] overflow-hidden rounded-[16px] border border-white/[0.08]">
              {TOOLS.map((r) => (
                <div
                  key={r.fn}
                  className="grid grid-cols-[minmax(0,160px)_minmax(0,1fr)] gap-5 border-b border-white/[0.06] px-5 py-4 last:border-b-0"
                >
                  <code className="pf-mono text-[13px] text-[var(--pf-ac)]">{r.fn}</code>
                  <span className="text-[14px] leading-[1.55] text-[var(--pf-fg-muted)]">{r.desc}</span>
                </div>
              ))}
            </div>

            <H2 id="specs">저작 스펙</H2>
            <p className="pf-reveal m-0 mb-[18px] text-[15.5px] leading-[1.7] text-[var(--pf-fg-muted)]">
              HubGmate는 저작 규칙을 <strong className="text-[var(--pf-fg-dim)]">MCP 리소스</strong>로 배포합니다.
              에이전트가 이를 읽고 우리 스펙대로 다이어그램·ERD·글을 작성하므로, 결과물의 완성도와 스타일이 일관됩니다.
              프롬프트 <Inline>hubgmate_content_guide</Inline>가 진입점입니다.
            </p>
            <div className="pf-reveal mb-[clamp(40px,5vw,56px)] overflow-hidden rounded-[16px] border border-white/[0.08]">
              {GUIDE_RES.map((g) => (
                <div
                  key={g.uri}
                  className="grid grid-cols-[minmax(0,260px)_minmax(0,1fr)] gap-5 border-b border-white/[0.06] px-5 py-4 last:border-b-0"
                >
                  <code className="pf-mono text-[12.5px] text-[var(--pf-fg-dim)]">{g.uri}</code>
                  <span className="text-[14px] leading-[1.55] text-[var(--pf-fg-muted)]">{g.label}</span>
                </div>
              ))}
            </div>

            <H2 id="flow">검토 · 공개</H2>
            <p className="pf-reveal m-0 mb-[18px] text-[15.5px] leading-[1.7] text-[var(--pf-fg-muted)]">
              발행물은 모두 초안입니다. 스튜디오에서 <strong className="text-[var(--pf-fg-dim)]">결과 화면 그대로 인라인
              편집</strong>(편집=결과)하고, 준비되면 공개하세요. 에이전트가 발행하면 소유자에게 알림이 갑니다. 같은{' '}
              <Inline>slug</Inline>로 다시 발행하면 새로 만들지 않고 <strong className="text-[var(--pf-fg-dim)]">갱신</strong>
              됩니다(멱등).
            </p>
            <Link
              href="/studio"
              className="pf-reveal inline-flex items-center gap-2 rounded-full bg-[var(--pf-ac)] px-6 py-3 text-[14px] font-semibold text-[#141414] transition hover:brightness-110"
            >
              스튜디오에서 키 발급하기
              <ArrowRight size={16} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
