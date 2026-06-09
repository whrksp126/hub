// 갤러리(클라이언트)용 순수 메타 — 테마 컴포넌트를 클라이언트 번들에 끌어오지 않기 위해 분리.
export type ThemeCardMeta = { id: string; name: string; description: string; preview: 'hero' | 'minimal' | 'side' | 'card' | 'dark' }

export const BLOG_THEME_METAS: ThemeCardMeta[] = [
  { id: 'clean', name: '깔끔 텍스트', description: '중앙 정렬·넉넉한 여백, 가독성 최우선', preview: 'minimal' },
  { id: 'magazine', name: '매거진', description: '큰 커버 히어로 + 타이틀 오버레이', preview: 'hero' },
  { id: 'devlog', name: '개발노트', description: '모노 악센트·카테고리 라벨, 기술글에 적합', preview: 'side' },
  { id: 'card', name: '카드형', description: '박스 컨테이너 + 부드러운 그림자', preview: 'card' },
  { id: 'notebook', name: '노트', description: '좌측 악센트 보더, 메모 같은 느낌', preview: 'side' },
]

