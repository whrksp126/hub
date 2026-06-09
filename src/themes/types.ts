import type { ReactNode } from 'react'

export type ThemeMeta = {
  id: string
  name: string
  description: string
  // 갤러리 미리보기용 색/특징(실제 미리보기는 PreviewCard가 렌더)
  accent?: string
}

// 공개 블로그 상세에 들어가는 데이터(+ 렌더된 본문 children)
export type BlogThemeProps = {
  title: string
  excerpt?: string | null
  publishedAt?: Date | null
  category?: string | null
  coverUrl?: string | null
  tags?: string[] | null
  children: ReactNode
}

export type BlogTheme = {
  meta: ThemeMeta
  Layout: (props: BlogThemeProps) => ReactNode
  // 새 글 생성 시 채워줄 예시 Plate 본문
  sample: () => unknown
}
