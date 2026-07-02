'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { ZoomPanFrame } from '@/components/portfolio/sections/zoom-pan-frame'

// mermaid는 무겁고 브라우저 전용이라, 다이어그램이 있는 페이지에서만 lazy import.
let mermaidPromise: Promise<typeof import('mermaid').default> | null = null
function loadMermaid() {
  if (!mermaidPromise) mermaidPromise = import('mermaid').then((m) => m.default)
  return mermaidPromise
}

// lucide 스타일 라인 아이콘(노드 라벨에 `@icon:name` 으로 삽입). 속성은 작은따옴표(메르메이드 라벨 호환).
const ICON_PATHS: Record<string, string> = {
  smartphone: "<rect x='5' y='2' width='14' height='20' rx='2'/><path d='M12 18h.01'/>",
  monitor: "<rect x='2' y='3' width='20' height='14' rx='2'/><path d='M8 21h8M12 17v4'/>",
  card: "<rect x='2' y='5' width='20' height='14' rx='2'/><path d='M2 10h20'/>",
  cloud: "<path d='M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.6 1.5A4 4 0 0 0 6 19h11.5Z'/>",
  server: "<rect x='2' y='3' width='20' height='8' rx='2'/><rect x='2' y='13' width='20' height='8' rx='2'/><path d='M6 7h.01M6 17h.01'/>",
  database: "<ellipse cx='12' cy='5' rx='9' ry='3'/><path d='M3 5v14a9 3 0 0 0 18 0V5'/><path d='M3 12a9 3 0 0 0 18 0'/>",
  radio: "<circle cx='12' cy='12' r='2'/><path d='M4.9 4.9a16 16 0 0 0 0 14.2M19.1 4.9a16 16 0 0 1 0 14.2M7.8 7.8a10 10 0 0 0 0 8.4M16.2 7.8a10 10 0 0 1 0 8.4'/>",
  box: "<path d='M21 8 12 3 3 8v8l9 5 9-5V8Z'/><path d='m3 8 9 5 9-5'/><path d='M12 13v8'/>",
  shield: "<path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z'/>",
  zap: "<path d='M13 2 3 14h9l-1 8 10-12h-9l1-8Z'/>",
  globe: "<circle cx='12' cy='12' r='10'/><path d='M2 12h20M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20Z'/>",
}
function iconSvg(name: string): string {
  const p = ICON_PATHS[name]
  if (!p) return ''
  return `<svg viewBox='0 0 24 24' width='15' height='15' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-2px;margin-right:6px'>${p}</svg>`
}
// `@accent` → 프로필 강조색, `@icon:name` → 인라인 SVG 로 치환.
function preprocess(code: string, accent: string): string {
  return code.replace(/@accent\b/g, accent).replace(/@icon:([a-zA-Z][\w-]*)/g, (_, n) => iconSvg(n))
}

// 텍스트(mermaid 문법) → SVG 다이어그램. 다크 디자인 + 프로필 강조색에 맞춰 테마링.
// 모든 프로젝트의 "다이어그램" 섹션이 공유하는 재사용 컴포넌트.
export function MermaidDiagram({ code, className = '' }: { code: string; className?: string }) {
  const host = useRef<HTMLDivElement>(null)
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const [err, setErr] = useState<string | null>(null)
  // ERD는 MySQL Workbench처럼 밝은 테이블이 가독성이 좋아 별도(라이트) 테마로 렌더.
  const isER = /^\s*erDiagram/.test(code)

  useEffect(() => {
    let cancelled = false
    const el = host.current
    if (!el || !code.trim()) {
      if (el) el.innerHTML = ''
      return
    }
    const accent = getComputedStyle(el).getPropertyValue('--pf-ac').trim() || '#F1531B'

    const darkConfig = {
      startOnLoad: false,
      securityLevel: 'loose' as const,
      theme: 'base' as const,
      flowchart: { curve: 'basis' as const, htmlLabels: true, padding: 14, nodeSpacing: 46, rankSpacing: 64, useMaxWidth: true },
      sequence: { useMaxWidth: true, actorMargin: 64, boxMargin: 10, noteMargin: 12, messageMargin: 42, mirrorActors: false },
      themeVariables: {
        background: 'transparent',
        primaryColor: '#1b1b1b',
        primaryBorderColor: 'rgba(255,255,255,0.16)',
        primaryTextColor: '#eaeaea',
        lineColor: 'rgba(255,255,255,0.28)',
        textColor: '#cfcfcf',
        fontFamily: 'var(--font-pretendard, system-ui, sans-serif)',
        fontSize: '14px',
        clusterBkg: 'rgba(255,255,255,0.022)',
        clusterBorder: 'rgba(255,255,255,0.09)',
        edgeLabelBackground: '#141414',
        nodeBorder: 'rgba(255,255,255,0.16)',
        mainBkg: '#1b1b1b',
        primaryColorHover: accent,
        actorBkg: '#1b1b1b',
        actorBorder: accent,
        actorTextColor: '#eaeaea',
        actorLineColor: 'rgba(255,255,255,0.18)',
        signalColor: 'rgba(255,255,255,0.45)',
        signalTextColor: '#cfcfcf',
        labelBoxBkg: '#241a12',
        labelBoxBorderColor: accent,
        labelTextColor: '#f0d7b8',
        loopTextColor: '#cfcfcf',
        noteBkgColor: '#2a2113',
        noteTextColor: '#f4dcbb',
        noteBorderColor: 'rgba(224,160,82,0.5)',
        activationBkgColor: accent,
        activationBorderColor: accent,
        sequenceNumberColor: '#141414',
      },
      themeCSS: `
        .cluster rect { rx: 16px; ry: 16px; filter: drop-shadow(0 6px 16px rgba(0,0,0,0.35)); }
        .cluster .cluster-label, .cluster span { font-size: 11px !important; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; opacity: 0.78; }
        .node .nodeLabel b, .node .nodeLabel strong { font-weight: 800; }
        .node rect, .node polygon, .node path { filter: drop-shadow(0 3px 8px rgba(0,0,0,0.35)); }
        .edgeLabel, .edgeLabel span, .edgeLabel p { font-size: 11px !important; color: #b9b9b9 !important; background: #141414 !important; padding: 1px 5px; border-radius: 6px; }
        .edgePath path { stroke-linecap: round; }
      `,
    }

    const erConfig = {
      startOnLoad: false,
      securityLevel: 'loose' as const,
      theme: 'default' as const,
      // 큰 ERD는 가로 맞춤(useMaxWidth)으로 줄이면 글자가 작아져 안 보임 → 자연 크기로 두고 카드가 가로 스크롤.
      er: { useMaxWidth: false, entityPadding: 12, fontSize: 13 },
      themeVariables: {
        fontFamily: 'var(--font-pretendard, system-ui, sans-serif)',
        fontSize: '13px',
        primaryColor: '#e4ecf7',
        primaryBorderColor: '#9bb3cc',
        primaryTextColor: '#13243a',
        lineColor: '#5f7488',
        textColor: '#1f2d3b',
      },
      // mermaid v11 ER 실제 클래스에 맞춘 스타일(테이블=화이트, 타입=흐림, 키=골드, 관계선 진하게, 라벨 깔끔).
      themeCSS: `
        .nodeLabel, .nodeLabel * { fill: #0f1b2d !important; color: #0f1b2d !important; font-weight: 700 !important; }
        .node rect, .node path, .node polygon { stroke: #9bb3cc !important; filter: drop-shadow(0 8px 20px rgba(0,0,0,0.45)); }
        .row-rect-odd { fill: #ffffff !important; }
        .row-rect-even { fill: #eef3f9 !important; }
        .attribute-type { fill: #5f7080 !important; }
        .attribute-name { fill: #16222f !important; }
        .attribute-keys { fill: #b0760f !important; font-weight: 800 !important; }
        .er.divider, .divider { stroke: #cdd8e6 !important; }
        .relationshipLine { stroke: #5f7488 !important; stroke-width: 1.6px !important; }
        #zeroOrOne *, #onlyOne *, #zeroOrMore *, #oneOrMore * { stroke: #5f7488 !important; fill: #5f7488 !important; }
        .edgeLabel .label, .edgeLabel text, .edgeLabel foreignObject div { fill: #2c3e50 !important; color: #2c3e50 !important; background: transparent !important; font-size: 11.5px !important; font-weight: 600 !important; }
        .edgeLabel .labelBkg, .labelBkg, .edgeLabel rect { fill: #ffffff !important; background: #ffffff !important; opacity: 0.95 !important; }
      `,
    }

    loadMermaid()
      .then((mermaid) => {
        if (cancelled) return
        mermaid.initialize(isER ? erConfig : darkConfig)
        return mermaid.render(`mmd-${rid}`, preprocess(code, accent))
      })
      .then((res) => {
        if (cancelled || !res || !host.current) return
        host.current.innerHTML = res.svg
        setErr(null)
      })
      .catch((e) => {
        if (!cancelled) setErr(String(e?.message ?? e))
      })
    return () => {
      cancelled = true
    }
  }, [code, rid, isER])

  return (
    <div className={className}>
      <ZoomPanFrame className={`rounded-[16px] ${isER ? 'bg-[#f4f7fb]' : 'bg-[var(--pf-surface)]/40'}`}>
        <div ref={host} className="mermaid-host w-full px-3 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full" />
      </ZoomPanFrame>
      {err && (
        <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-[11px] text-red-400">
          다이어그램 문법 오류: {err}
        </pre>
      )}
    </div>
  )
}

// 편집용: mermaid 소스 textarea + 커밋된 코드 미리보기(blur 시 저장 → 키 입력마다 재렌더 방지).
export function DiagramEditor({ code, onCommit }: { code: string; onCommit: (v: string) => void }) {
  const [v, setV] = useState(code)
  useEffect(() => setV(code), [code])
  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => v !== code && onCommit(v)}
        spellCheck={false}
        rows={Math.min(18, Math.max(6, v.split('\n').length + 1))}
        placeholder={'graph TD\n  A["클라이언트"] --> B["서버"]\n  B --> C[("DB")]'}
        className="pf-mono w-full rounded-xl border border-white/10 bg-[#0f0f0f] p-3 text-[12px] leading-[1.6] text-[var(--pf-fg-dim)] outline-none focus:border-[var(--pf-ac)]"
      />
      <div className="rounded-[16px] border border-white/[0.07] bg-[var(--pf-surface)] p-[clamp(14px,2.5vw,24px)]">
        <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--pf-fg-fainter)]">미리보기</div>
        <MermaidDiagram code={code} />
      </div>
    </div>
  )
}
