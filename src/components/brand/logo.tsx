import type { CSSProperties } from 'react'

/**
 * HubGmate 아이덴티티 — "hG" 심볼.
 * 오렌지 오빗 링(= ghmate의 G = 허브/포털)이 소문자 h 노드를 감싼다.
 * 링·노드 = 액센트(var(--pf-ac) = #f1531b), h = currentColor(자리 배경색에 맞춤).
 * 전부 벡터라 어느 크기에서도 동일. 편집=결과 원칙과 동일하게 단일 소스.
 */
export function LogoMark({
  size = 28,
  className,
  style,
  withBead = true,
  title = 'HubGmate',
}: {
  size?: number
  className?: string
  style?: CSSProperties
  /** 링 위 노드(‘G’ 종단) 표시 — 아주 작은 크기(≤20px)에선 끄는 게 깔끔 */
  withBead?: boolean
  title?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      style={style}
      role="img"
      aria-label={title}
    >
      {/* G 링 / 허브 오빗 (오른쪽이 열린 G) */}
      <circle
        cx="60"
        cy="60"
        r="45"
        stroke="var(--pf-ac, #f1531b)"
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="214 69"
        transform="rotate(20 60 60)"
      />
      {/* 소문자 h — 배경색에 맞춰 currentColor */}
      <line x1="47" y1="40" x2="47" y2="83" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
      <path
        d="M47 60 C47 50 72 49 72 66 L72 83"
        stroke="currentColor"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />
      {/* 허브 노드 */}
      <circle cx="47" cy="60" r="6.5" fill="var(--pf-ac, #f1531b)" />
      {/* 링 종단 노드(‘G’ 획) */}
      {withBead && <circle cx="98" cy="74" r="8" fill="var(--pf-ac, #f1531b)" />}
    </svg>
  )
}

/**
 * 로고 락업 — 심볼 + 워드마크.
 * short=true → "HubG"(헤더·모바일), false → "HubGmate"(정식).
 * G만 액센트로 띄워 Hub·G·mate 구조를 즉시 읽히게 한다.
 */
export function Logo({
  size = 24,
  short = false,
  withBead = true,
  className,
}: {
  size?: number
  short?: boolean
  withBead?: boolean
  className?: string
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
      <LogoMark size={size} withBead={withBead} />
      <span
        className="font-bold tracking-[-0.03em] leading-none"
        style={{ fontSize: size * 0.72, fontFamily: 'var(--font-display-en), var(--font-sans)' }}
      >
        Hub
        <span className="text-[var(--pf-ac,#f1531b)]">G</span>
        {!short && <span className="text-[var(--pf-fg-muted,#9a9a9a)]">mate</span>}
      </span>
    </span>
  )
}
