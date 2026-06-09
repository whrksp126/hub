import 'server-only'
import { createSlateEditor } from 'platejs'
import { deserializeMd } from '@platejs/markdown'
import { BaseEditorKit } from '@/components/editor/editor-base-kit'

// 에이전트가 보낸 마크다운을 Plate 문서(JSON)로 변환.
export function markdownToPlate(md: string): unknown {
  try {
    const editor = createSlateEditor({ plugins: BaseEditorKit })
    const value = deserializeMd(editor, md)
    if (Array.isArray(value) && value.length > 0) return value
  } catch {
    /* 변환 실패 시 단순 문단으로 폴백 */
  }
  return [{ type: 'p', children: [{ text: md }] }]
}
