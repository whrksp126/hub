import { ArrowRight, Plus } from 'lucide-react'
import Link from 'next/link'
import { cardColor, cardIcon, resolveCardHref } from '@/components/portfolio/card-kit'
import { EditableServiceCard } from '@/components/portfolio/sections/service-cards-edit'
import type { ProfileCard } from '@/db/schema'

function cardPattern(color: string) {
  return color === 'lime' ? '/deco/card-zigzag.svg' : '/deco/card-wave.svg'
}

function StaticServiceCard({ card, base }: { card: ProfileCard; base: string }) {
  const Icon = cardIcon(card.icon)
  const col = cardColor(card.color)
  const [l1, l2] = card.title.split('\n')
  const onLight = col.text === '#141414'
  const pattern = cardPattern(card.color)
  return (
    <Link
      href={resolveCardHref(base, card.href)}
      style={{
        backgroundColor: col.bg,
        color: col.text,
        backgroundImage: `url(${pattern})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: '100% 100%',
        imageRendering: 'pixelated',
      }}
      className="flex min-h-[clamp(230px,30vw,280px)] flex-col overflow-hidden rounded-[22px] p-7 text-left transition hover:brightness-105"
    >
      <Icon size={32} strokeWidth={1.8} />
      <div className="mt-auto flex flex-col gap-5">
        <span className="text-[clamp(20px,2.2vw,26px)] font-bold leading-[1.25]">
          {l1}
          {l2 && (
            <>
              <br />
              {l2}
            </>
          )}
        </span>
        <span
          className="flex h-[42px] w-[42px] flex-none items-center justify-center self-end rounded-[13px] border-[1.5px]"
          style={{ borderColor: onLight ? 'rgba(20,20,20,0.35)' : 'rgba(255,255,255,0.3)' }}
        >
          <ArrowRight size={18} strokeWidth={1.9} />
        </span>
      </div>
    </Link>
  )
}

// 서비스(바로가기) 카드 그리드 — 공개=정적 Link, 편집=인라인(피커/추가/삭제). 단일 소스.
export function ServiceCards({
  cards,
  base,
  edit,
}: {
  cards: ProfileCard[]
  base: string
  edit?: { onChange: (next: ProfileCard[]) => void }
}) {
  if (cards.length === 0 && !edit) return null
  return (
    <div className="mx-auto mt-[clamp(32px,4vw,48px)] grid max-w-[360px] grid-cols-1 gap-4 min-[810px]:max-w-none min-[810px]:grid-cols-2">
      {edit
        ? cards.map((c, i) => (
            <EditableServiceCard
              key={i}
              card={c}
              onChange={(next) => edit.onChange(cards.map((x, j) => (j === i ? next : x)))}
              onRemove={() => edit.onChange(cards.filter((_, j) => j !== i))}
            />
          ))
        : cards.map((c, i) => <StaticServiceCard key={i} card={c} base={base} />)}
      {edit && (
        <button
          type="button"
          onClick={() => edit.onChange([...cards, { icon: 'sparkles', title: '새 카드\n설명', href: 'projects', color: 'surface' }])}
          className="flex min-h-[clamp(230px,30vw,280px)] flex-col items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-white/12 text-sm font-semibold text-[var(--pf-fg-muted)] transition-colors hover:border-[var(--pf-ac)] hover:text-[var(--pf-fg)]"
        >
          <Plus size={20} /> 카드 추가
        </button>
      )}
    </div>
  )
}
