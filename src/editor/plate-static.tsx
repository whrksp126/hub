import { createSlateEditor } from 'platejs'
import { BaseEditorKit } from '@/components/editor/editor-base-kit'
import { EditorStatic } from '@/components/ui/editor-static'
import { asValue } from './value'

// 공개 페이지용 서버 정적 렌더. 편집기와 같은 Plate 노드 컴포넌트 → "편집=결과".
export function PlateStaticRender({ value, className }: { value: unknown; className?: string }) {
  const editor = createSlateEditor({ plugins: BaseEditorKit, value: asValue(value) })
  return <EditorStatic editor={editor} variant="none" className={className} />
}
