'use client'

import { createContext, type ReactNode, useContext } from 'react'

// 인쇄(PDF) 모드 신호. print 라우트에서만 Provider로 true를 주입한다.
// 인터랙티브 컴포넌트(ZoomPanFrame·ErdDiagram 등)가 이 값을 읽어 인쇄에 적합한
// 정적/펼침 렌더로 전환한다. 라이브 페이지는 Provider가 없어 기본 false(인터랙티브 유지).
const PrintModeContext = createContext(false)

export function usePrintMode() {
  return useContext(PrintModeContext)
}

export function PrintModeProvider({ children }: { children: ReactNode }) {
  return <PrintModeContext.Provider value={true}>{children}</PrintModeContext.Provider>
}
