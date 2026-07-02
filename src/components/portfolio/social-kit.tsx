import { AtSign, Globe, Link2, Mail, MessageCircle, Phone, Rss, Send } from 'lucide-react'
import type { ComponentType } from 'react'
import { GithubIcon } from '@/components/portfolio/pieces'

type IconProps = { size?: number; strokeWidth?: number }

// lucide는 브랜드 아이콘을 제공하지 않아 라인 스타일 인라인 SVG로 직접 둔다.
function svg(children: React.ReactNode) {
  return function Icon({ size = 21, strokeWidth = 1.7 }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {children}
      </svg>
    )
  }
}

const Youtube = svg(
  <>
    <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" />
    <path d="M10 9.3l5 2.7-5 2.7z" />
  </>,
)
const XIcon = svg(<path d="M4 4l16 16M20 4L4 20" />)
const Instagram = svg(
  <>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="3.6" />
    <circle cx="17" cy="7" r="0.5" fill="currentColor" />
  </>,
)
const Linkedin = svg(
  <>
    <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
    <path d="M7 10.5V16M7 7.4v.01M10.7 16v-3.4a2 2 0 0 1 4 0V16" />
  </>,
)
const Facebook = svg(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M13.7 8.6h-1.2a1.5 1.5 0 0 0-1.5 1.5V19M9.7 12.4h3.6" />
  </>,
)

export type SocialPlatform = {
  key: string
  label: string
  icon: ComponentType<IconProps>
  placeholder: string
  href: (v: string) => string
}

const http = (v: string) => (/^https?:\/\//.test(v) ? v : `https://${v}`)

// 미리 확보한 유명 플랫폼들 — 사용자가 종류를 고르면 그 아이콘으로 표시된다.
export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { key: 'email', label: '이메일', icon: Mail, placeholder: 'you@example.com', href: (v) => `mailto:${v}` },
  { key: 'phone', label: '전화', icon: Phone, placeholder: '010-0000-0000', href: (v) => `tel:${v.replace(/[^0-9+]/g, '')}` },
  { key: 'github', label: 'GitHub', icon: GithubIcon, placeholder: 'github.com/username', href: http },
  { key: 'website', label: '웹사이트', icon: Globe, placeholder: 'https://example.com', href: http },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'youtube.com/@handle', href: http },
  { key: 'x', label: 'X (트위터)', icon: XIcon, placeholder: 'x.com/handle', href: http },
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'instagram.com/handle', href: http },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'linkedin.com/in/handle', href: http },
  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'facebook.com/handle', href: http },
  { key: 'threads', label: 'Threads', icon: AtSign, placeholder: 'threads.net/@handle', href: http },
  { key: 'telegram', label: 'Telegram', icon: Send, placeholder: 't.me/handle', href: http },
  { key: 'discord', label: 'Discord', icon: MessageCircle, placeholder: 'discord.gg/invite', href: http },
  { key: 'blog', label: '블로그', icon: Rss, placeholder: 'blog.example.com', href: http },
  { key: 'link', label: '기타 링크', icon: Link2, placeholder: 'https://...', href: http },
]

export const SOCIAL_MAP: Record<string, SocialPlatform> = Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p.key, p]))

export function socialPlatform(kind: string): SocialPlatform {
  return SOCIAL_MAP[kind] ?? SOCIAL_MAP.link
}

// 레거시 필드(email/github/phone)를 social 배열 형태로 변환(아직 social이 비어있을 때).
export function legacyToSocial(p: { email?: string | null; github?: string | null; phone?: string | null }) {
  const out: { kind: string; label: string; url: string }[] = []
  if (p.github) out.push({ kind: 'github', label: 'GitHub', url: p.github })
  if (p.email) out.push({ kind: 'email', label: '이메일', url: p.email })
  if (p.phone) out.push({ kind: 'phone', label: '전화', url: p.phone })
  return out
}
