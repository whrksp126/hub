'use client'

import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { usePrintMode } from '@/components/portfolio/print/print-context'
import { PinchZoomControls } from '@/components/portfolio/sections/zoom-controls'

const MIN = 0.6
const MAX = 5

// 다이어그램(이미지/SVG)을 팬·줌으로 보는 프레임.
// - 더블클릭 확대 · 버튼으로 확대/축소/원위치 · 드래그 팬 · 트랙패드 핀치(Ctrl+휠) 줌
// - limitToBounds로 콘텐츠 밖으로 너무 멀리 스크롤되지 않게 제한
// - 일반 휠은 페이지 스크롤로 두고(Ctrl/Cmd 휠만 줌) 스크롤 가로채기 방지
export function ZoomPanFrame({
  children,
  className = '',
  heightClass = 'h-[clamp(360px,56vh,560px)]',
}: {
  children: React.ReactNode
  className?: string
  heightClass?: string
}) {
  const print = usePrintMode()
  // 인쇄(PDF): 줌/팬 프레임 없이 다이어그램 전체를 자연 크기로 펼쳐 "렌더된 이미지"처럼 담는다.
  if (print) return <div className={`pfp-diagram flex w-full justify-center ${className}`}>{children}</div>

  return (
    <div className={`relative overflow-hidden ${heightClass} ${className}`}>
      <TransformWrapper
        minScale={MIN}
        maxScale={MAX}
        initialScale={1}
        centerOnInit
        limitToBounds
        doubleClick={{ step: 0.8 }}
        wheel={{ step: 0.08, activationKeys: ['Control', 'Meta'] }}
        panning={{ velocityDisabled: true }}
      >
        <PinchZoomControls min={MIN} max={MAX} />
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%', cursor: 'grab' }}
          contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {children}
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}
