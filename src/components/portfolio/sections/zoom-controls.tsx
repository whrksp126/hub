'use client'

import { LocateFixed, Minus, Plus } from 'lucide-react'
import { useRef, useState } from 'react'
import { useControls, useTransformEffect } from 'react-zoom-pan-pinch'

// 지도 앱식 줌 컨트롤(공용 UI) — 상단 원위치 버튼 + (확대 / 세로 드래그 슬라이더 / 축소).
// 다이어그램 종류(React Flow / react-zoom-pan-pinch)에 무관하게 콜백만 받아 동작.
export function ZoomSlider({
  scale,
  min,
  max,
  onIn,
  onOut,
  onSet,
  onReset,
}: {
  scale: number
  min: number
  max: number
  onIn: () => void
  onOut: () => void
  onSet: (s: number) => void
  onReset: () => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const frac = Math.max(0, Math.min(1, (scale - min) / (max - min)))

  const apply = (clientY: number) => {
    const r = trackRef.current?.getBoundingClientRect()
    if (!r) return
    let f = 1 - (clientY - r.top) / r.height
    f = Math.max(0, Math.min(1, f))
    onSet(min + f * (max - min))
  }
  const onDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    dragging.current = true
    e.currentTarget.setPointerCapture?.(e.pointerId)
    apply(e.clientY)
  }
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    e.stopPropagation()
    apply(e.clientY)
  }
  const onUp = () => {
    dragging.current = false
  }

  const iconBtn = 'flex h-6 w-6 items-center justify-center rounded-md text-[var(--pf-fg-dim)] transition hover:bg-white/10 hover:text-[var(--pf-fg)]'
  const panel = 'border border-white/12 bg-[rgba(20,20,20,0.88)] shadow-[0_8px_28px_rgba(0,0,0,0.5)] backdrop-blur-md'
  return (
    <div
      data-zoom-slider
      className="nopan nodrag nowheel absolute bottom-3 right-3 z-20 flex flex-col items-center gap-2"
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onReset}
        aria-label="원래 크기"
        className={`flex h-8 w-8 items-center justify-center rounded-[10px] text-[var(--pf-fg-dim)] transition hover:text-[var(--pf-ac)] ${panel}`}
      >
        <LocateFixed size={15} />
      </button>
      <div className={`flex flex-col items-center gap-1.5 rounded-[12px] px-1.5 py-2 ${panel}`}>
        <button type="button" onClick={onIn} aria-label="확대" className={iconBtn}>
          <Plus size={15} />
        </button>
        <div
          ref={trackRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className="relative h-[96px] w-4 cursor-pointer touch-none select-none"
        >
          <span className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 rounded-full bg-white/15" />
          <span className="absolute left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-[var(--pf-ac)]" style={{ bottom: 0, height: `${frac * 100}%` }} />
          <span
            className="absolute left-1/2 h-2.5 w-4 -translate-x-1/2 translate-y-1/2 rounded-[3px] border border-[var(--pf-ac)] bg-[var(--pf-fg)] shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
            style={{ bottom: `${frac * 100}%` }}
          />
        </div>
        <button type="button" onClick={onOut} aria-label="축소" className={iconBtn}>
          <Minus size={15} />
        </button>
      </div>
    </div>
  )
}

// react-zoom-pan-pinch(mermaid 프레임)용 어댑터 — TransformWrapper 안에서만 사용.
// 확대/축소는 항상 콘텐츠 중앙 기준(centerView)으로 동작시켜 시점이 튀지 않게 한다.
export function PinchZoomControls({ min, max }: { min: number; max: number }) {
  const { centerView, resetTransform } = useControls()
  const [scale, setScale] = useState(1)
  const clamp = (s: number) => Math.max(min, Math.min(max, s))
  useTransformEffect(({ state }) => setScale(state.scale))
  return (
    <ZoomSlider
      scale={scale}
      min={min}
      max={max}
      onIn={() => centerView(clamp(scale * 1.3), 0)}
      onOut={() => centerView(clamp(scale / 1.3), 0)}
      onSet={(s) => centerView(clamp(s), 0)}
      onReset={() => resetTransform()}
    />
  )
}
