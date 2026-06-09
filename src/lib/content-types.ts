// 콘텐츠 타입 레지스트리 (studio·테마 공용). 블로그 중심.
export type ContentType = 'posts'

export type ContentTypeMeta = {
  label: string
  publicPath: string // 공개 상세 경로 prefix
  themeKind: 'blog'
  defaultTheme: string
}

export const CONTENT_TYPE_META: Record<ContentType, ContentTypeMeta> = {
  posts: {
    label: '블로그',
    publicPath: '/blog',
    themeKind: 'blog',
    defaultTheme: 'clean',
  },
}

export const CONTENT_TYPES = Object.keys(CONTENT_TYPE_META) as ContentType[]

export function isContentType(x: string): x is ContentType {
  return x in CONTENT_TYPE_META
}

// Plate 빈 문서.
export const EMPTY_PLATE_VALUE = [{ type: 'p', children: [{ text: '' }] }]
