'use client'

import { Printer, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const PRESETS = [
  { label: '세로 1단', px: 800 },
  { label: '기본 (2단)', px: 1080 },
  { label: '넓게', px: 1280 },
  { label: '더 넓게', px: 1440 },
]

// 폭 변경 시: 레이아웃 강제 클래스(pfp-wide/narrow) + 종이 폭(--pfw) + PDF 페이지 크기(@page) 동시 갱신.
// 레이아웃을 뷰포트가 아니라 클래스로 강제하므로 화면 미리보기와 실제 인쇄가 항상 일치한다.
function applyWidth(px: number) {
  const root = document.querySelector<HTMLElement>('.pfp-shell')
  if (root) {
    root.classList.toggle('pfp-wide', px >= 1080)
    root.classList.toggle('pfp-narrow', px < 1080)
    root.style.setProperty('--pfw', `${px}px`)
  }
  const wmm = Math.ceil((px / 96) * 25.4 * 10) / 10
  const hmm = Math.ceil(wmm * 1.4142 * 10) / 10
  let st = document.getElementById('pfp-page')
  if (!st) {
    st = document.createElement('style')
    st.id = 'pfp-page'
    document.head.appendChild(st)
  }
  st.textContent = `@page{size:${wmm}mm ${hmm}mm;margin:0}`
}

export function PrintToolbar({ auto = true, initialWidth = 1080 }: { auto?: boolean; initialWidth?: number }) {
  const fired = useRef(false)
  const [width, setWidth] = useState(initialWidth)

  const changeWidth = (px: number) => {
    setWidth(px)
    applyWidth(px)
  }

  useEffect(() => {
    if (!auto || fired.current) return
    fired.current = true
    let cancelled = false
    const run = async () => {
      try {
        if (document.fonts?.ready) await document.fonts.ready
      } catch {}
      const imgs = Array.from(document.images)
      await Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((res) => {
                img.addEventListener('load', () => res(), { once: true })
                img.addEventListener('error', () => res(), { once: true })
              }),
        ),
      )
      if (!cancelled) setTimeout(() => !cancelled && window.print(), 500)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [auto])

  const isPreset = PRESETS.some((p) => p.px === width)

  return (
    <div className="no-print pfp-toolbar">
      <div className="pfp-toolbar-left">
        <span className="pfp-toolbar-hint">
          <b>대상 → PDF로 저장</b> · 옵션 <b>배경 그래픽</b> 켜기
        </span>
        <div className="pfp-width">
          <span className="pfp-width-label">가로</span>
          {PRESETS.map((p) => (
            <button
              key={p.px}
              type="button"
              onClick={() => changeWidth(p.px)}
              className={`pfp-width-btn ${width === p.px ? 'is-on' : ''}`}
            >
              {p.label}
            </button>
          ))}
          <input
            type="number"
            min={600}
            max={2400}
            step={20}
            value={width}
            onChange={(e) => changeWidth(Math.min(2400, Math.max(600, Number(e.target.value) || 1080)))}
            className={`pfp-width-input ${isPreset ? '' : 'is-on'}`}
            aria-label="가로 픽셀"
          />
          <span className="pfp-width-unit">px</span>
        </div>
      </div>
      <div className="pfp-toolbar-actions">
        <button type="button" onClick={() => window.print()} className="pfp-btn pfp-btn-primary">
          <Printer size={16} strokeWidth={2} /> PDF 저장 · 인쇄
        </button>
        <button type="button" onClick={() => window.close()} className="pfp-btn">
          <X size={16} strokeWidth={2} /> 닫기
        </button>
      </div>
    </div>
  )
}
