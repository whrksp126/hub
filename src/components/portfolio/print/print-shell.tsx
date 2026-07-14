'use client'

import { Printer, X } from 'lucide-react'
import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react'

const PRESETS = [
  { label: '세로 1단', px: 800 },
  { label: '기본 (2단)', px: 1080 },
  { label: '넓게', px: 1280 },
  { label: '더 넓게', px: 1440 },
]

// PDF 미리보기 셸: 툴바(가로 폭 조절 + 인쇄) + iframe 미리보기.
// iframe은 자체 뷰포트=설정 폭이라, 화면 미리보기와 실제 PDF 출력이 항상 100% 일치한다.
// 인쇄는 iframe 문서를 직접 인쇄(@page 크기는 iframe 안에서 폭에 맞춰 주입됨).
export function PrintShell({
  frameBase,
  baseParams,
  initialWidth,
  auto,
  accent,
}: {
  frameBase: string
  baseParams: string
  initialWidth: number
  auto: boolean
  accent: string
}) {
  const [width, setWidth] = useState(initialWidth)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const printed = useRef(false)
  const src = `${frameBase}?${baseParams}&w=${width}`

  const doPrint = useCallback(() => {
    iframeRef.current?.contentWindow?.print()
  }, [])

  const onLoad = useCallback(async () => {
    const frame = iframeRef.current
    const doc = frame?.contentDocument
    // 미리보기는 콘텐츠 전체 높이로 늘려 바깥에서 연속 스크롤.
    if (frame && doc) frame.style.height = `${doc.documentElement.scrollHeight}px`

    if (!auto || printed.current) return
    printed.current = true
    try {
      const fonts = frame?.contentWindow?.document?.fonts
      if (fonts?.ready) await fonts.ready
    } catch {}
    const imgs = doc ? Array.from(doc.images) : []
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
    setTimeout(doPrint, 500)
  }, [auto, doPrint])

  // 폭이 바뀌면 iframe이 새 w로 리로드 → onLoad에서 높이 재계산.
  useEffect(() => {
    const frame = iframeRef.current
    const doc = frame?.contentDocument
    if (frame && doc) frame.style.height = `${doc.documentElement.scrollHeight}px`
  }, [])

  const isPreset = PRESETS.some((p) => p.px === width)

  return (
    <div className="pfp-shell" style={{ ['--pf-ac']: accent } as CSSProperties}>
      <div className="pfp-toolbar">
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
                onClick={() => setWidth(p.px)}
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
              onChange={(e) => setWidth(Math.min(2400, Math.max(600, Number(e.target.value) || 1080)))}
              className={`pfp-width-input ${isPreset ? '' : 'is-on'}`}
              aria-label="가로 픽셀"
            />
            <span className="pfp-width-unit">px</span>
          </div>
        </div>
        <div className="pfp-toolbar-actions">
          <button type="button" onClick={doPrint} className="pfp-btn pfp-btn-primary">
            <Printer size={16} strokeWidth={2} /> PDF 저장 · 인쇄
          </button>
          <button type="button" onClick={() => window.close()} className="pfp-btn">
            <X size={16} strokeWidth={2} /> 닫기
          </button>
        </div>
      </div>
      <div className="pfp-shell-scroll">
        <iframe
          ref={iframeRef}
          src={src}
          title="PDF 미리보기"
          className="pfp-iframe"
          style={{ width: `${width}px` }}
          onLoad={onLoad}
        />
      </div>
    </div>
  )
}
