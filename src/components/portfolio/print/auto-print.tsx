'use client'

import { Printer, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

// print 페이지 진입 시 이미지 로딩을 기다렸다가 자동으로 인쇄 대화상자를 연다.
// 상단 no-print 툴바에 "PDF 저장/인쇄"·"닫기" 버튼 제공.
export function AutoPrint({ auto = true }: { auto?: boolean }) {
  const fired = useRef(false)

  useEffect(() => {
    if (!auto || fired.current) return
    fired.current = true

    let cancelled = false
    const run = async () => {
      // 폰트 + 이미지가 다 뜬 뒤 인쇄해야 레이아웃이 안 깨진다.
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
      if (cancelled) return
      // 렌더 안정화 후 인쇄.
      setTimeout(() => !cancelled && window.print(), 400)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [auto])

  return (
    <div className="no-print pfp-toolbar">
      <span className="pfp-toolbar-hint">
        인쇄 대화상자에서 <b>대상 → PDF로 저장</b>을 선택하세요. (배경 그래픽 켜기 권장)
      </span>
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
