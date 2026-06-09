import { blogThemes } from './blog-themes'

export { blogThemes }

export function getBlogTheme(id?: string | null) {
  return (id && blogThemes[id]) || blogThemes.clean
}
