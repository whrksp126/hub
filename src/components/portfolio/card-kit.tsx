import {
  Boxes,
  Code2,
  Cpu,
  Database,
  Globe,
  Layers,
  type LucideIcon,
  Radio,
  Rocket,
  Server,
  Smartphone,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react'
import type { ProfileCard } from '@/db/schema'

// 바로가기 카드용 아이콘/색/링크 — 편집기(피커)와 공개 페이지(렌더)가 공유.
export const CARD_ICONS: Record<string, LucideIcon> = {
  layers: Layers,
  radio: Radio,
  code: Code2,
  rocket: Rocket,
  zap: Zap,
  database: Database,
  server: Server,
  globe: Globe,
  cpu: Cpu,
  boxes: Boxes,
  sparkles: Sparkles,
  wrench: Wrench,
  mobile: Smartphone,
}
export const CARD_ICON_KEYS = Object.keys(CARD_ICONS)

export const CARD_COLORS: Record<string, { bg: string; text: string }> = {
  accent: { bg: 'var(--pf-ac)', text: '#ffffff' },
  lime: { bg: 'var(--pf-lime)', text: '#141414' },
  surface: { bg: 'var(--pf-surface)', text: 'var(--pf-fg)' },
}
export const CARD_COLOR_KEYS = Object.keys(CARD_COLORS)

// 내부 링크 세그먼트 옵션 (외부는 직접 URL).
export const CARD_LINKS: { value: string; label: string }[] = [
  { value: 'projects', label: '프로젝트' },
  { value: 'experience', label: '경력' },
  { value: 'deep-dives', label: '글' },
  { value: 'contact', label: '연락하기' },
  { value: 'home', label: '홈' },
]

export const DEFAULT_CARDS: ProfileCard[] = [
  { icon: 'layers', title: '풀스택 단독 개발\n기획 · 런칭 · 운영', href: 'projects', color: 'accent' },
  { icon: 'radio', title: '실시간 · 미디어\n인프라 자가호스팅', href: 'experience', color: 'lime' },
]

export function cardColor(key: string) {
  return CARD_COLORS[key] ?? CARD_COLORS.accent
}

export function cardIcon(key: string): LucideIcon {
  return CARD_ICONS[key] ?? Layers
}

// base(예: /p/geonho)와 href(내부 세그먼트 또는 외부 URL)를 합쳐 최종 링크로.
export function resolveCardHref(base: string, href: string): string {
  if (!href || href === 'home') return base
  if (/^https?:\/\//.test(href)) return href
  // 레거시: 'notes' 세그먼트는 'deep-dives'로 리네임됨.
  const seg = href === 'notes' ? 'deep-dives' : href
  return `${base}/${seg}`
}
