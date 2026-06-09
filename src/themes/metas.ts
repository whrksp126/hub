// 갤러리(클라이언트)용 순수 메타 — 테마 컴포넌트를 클라이언트 번들에 끌어오지 않기 위해 분리.
export type ThemeCardMeta = { id: string; name: string; description: string; preview: 'hero' | 'minimal' | 'side' | 'card' | 'dark' }

export const BLOG_THEME_METAS: ThemeCardMeta[] = [
  { id: 'clean', name: '에디토리얼', description: '중앙 세리프 헤드라인 + 드롭캡, 잡지 사설 느낌', preview: 'minimal' },
  { id: 'magazine', name: '매거진', description: '풀블리드 커버 히어로 + 큰 타이틀 오버레이', preview: 'hero' },
  { id: 'devlog', name: '칼럼', description: '좌측 메타 레일(비대칭) + 세리프 헤드라인', preview: 'side' },
  { id: 'card', name: '피처', description: '커버를 품은 큰 피처드 카드 + 부드러운 그림자', preview: 'card' },
  { id: 'notebook', name: '사이드룰', description: '굵은 좌측 악센트 바 + 대형 세리프 헤드라인', preview: 'side' },
]

