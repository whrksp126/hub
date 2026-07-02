'use client'

import { ArrowRight, X } from 'lucide-react'
import { useState } from 'react'
import {
  CARD_COLOR_KEYS,
  CARD_COLORS,
  CARD_ICON_KEYS,
  CARD_ICONS,
  CARD_LINKS,
  cardColor,
  cardIcon,
} from '@/components/portfolio/card-kit'
import { InlineText } from '@/components/studio/inline-text'
import type { ProfileCard } from '@/db/schema'

function cardPattern(color: string) {
  return color === 'lime' ? '/deco/card-zigzag.svg' : '/deco/card-wave.svg'
}

// 공개 카드와 동일 비주얼(SVG 패턴·min-h·p-7·아이콘32·mt-auto gap-5) + hover 편집 컨트롤.
export function EditableServiceCard({
  card,
  onChange,
  onRemove,
}: {
  card: ProfileCard
  onChange: (next: ProfileCard) => void
  onRemove: () => void
}) {
  const [pickIcon, setPickIcon] = useState(false)
  const col = cardColor(card.color)
  const Icon = cardIcon(card.icon)
  const onLight = col.text === '#141414'
  const isExternal = /^https?:\/\//.test(card.href) || card.href === ''
  const pattern = cardPattern(card.color)

  return (
    <div
      className="group relative flex min-h-[clamp(230px,30vw,280px)] flex-col overflow-hidden rounded-[22px] p-7"
      style={{
        backgroundColor: col.bg,
        color: col.text,
        backgroundImage: `url(${pattern})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: '100% 100%',
        imageRendering: 'pixelated',
      }}
    >
      {/* hover 컨트롤: 색 · 링크 · 삭제 */}
      <div className="absolute right-3 top-3 z-30 flex flex-wrap items-center justify-end gap-1.5 rounded-xl bg-black/20 p-1.5 opacity-0 transition group-hover:opacity-100">
        {CARD_COLOR_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onChange({ ...card, color: k })}
            aria-label={`색 ${k}`}
            className={`h-4 w-4 rounded-full border border-black/25 ${card.color === k ? 'ring-2 ring-white/70' : ''}`}
            style={{ background: CARD_COLORS[k].bg }}
          />
        ))}
        <select
          value={isExternal ? 'external' : card.href || 'home'}
          onChange={(e) => onChange({ ...card, href: e.target.value === 'external' ? 'https://' : e.target.value })}
          className="rounded-md border border-black/15 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-[#141414] outline-none"
        >
          {CARD_LINKS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
          <option value="external">외부 URL</option>
        </select>
        <button type="button" onClick={onRemove} aria-label="카드 삭제" className="rounded p-0.5 text-white hover:text-red-300">
          <X size={15} />
        </button>
      </div>
      {isExternal && (
        <input
          value={card.href}
          placeholder="https://"
          onChange={(e) => onChange({ ...card, href: e.target.value })}
          className="absolute right-3 top-12 z-30 w-[180px] rounded-md border border-black/15 bg-white px-2 py-1 text-[11px] text-[#141414] opacity-0 outline-none transition group-hover:opacity-100"
        />
      )}

      {/* 아이콘 (클릭 → 피커) */}
      <div className="relative w-fit">
        <button type="button" onClick={() => setPickIcon((v) => !v)} title="아이콘 변경" className="-m-1 rounded-lg p-1 hover:bg-black/10">
          <Icon size={32} strokeWidth={1.8} />
        </button>
        {pickIcon && (
          <div className="absolute left-0 top-full z-50 mt-2 grid w-[208px] grid-cols-5 gap-1 rounded-xl border border-white/15 bg-[#161616] p-2 shadow-2xl">
            {CARD_ICON_KEYS.map((k) => {
              const I = CARD_ICONS[k]
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    onChange({ ...card, icon: k })
                    setPickIcon(false)
                  }}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-[var(--pf-fg-dim)] hover:bg-white/10 ${card.icon === k ? 'bg-white/10 text-[var(--pf-ac)]' : ''}`}
                >
                  <I size={18} />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 텍스트 + 화살표 박스 (공개와 동일: mt-auto gap-5, self-end) */}
      <div className="mt-auto flex flex-col gap-5">
        <InlineText
          value={card.title}
          onCommit={(v) => onChange({ ...card, title: v })}
          multiline
          onLight={onLight}
          placeholder="카드 텍스트 (Enter 줄바꿈)"
          ariaLabel="카드 텍스트"
          className="block whitespace-pre-wrap text-[clamp(20px,2.2vw,26px)] font-bold leading-[1.25]"
        />
        <span
          className="flex h-[42px] w-[42px] flex-none items-center justify-center self-end rounded-[13px] border-[1.5px]"
          style={{ borderColor: onLight ? 'rgba(20,20,20,0.35)' : 'rgba(255,255,255,0.3)' }}
        >
          <ArrowRight size={18} strokeWidth={1.9} />
        </span>
      </div>
    </div>
  )
}
