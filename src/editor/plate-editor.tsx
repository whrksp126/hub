'use client'

import { Plate, usePlateEditor } from 'platejs/react'
import { EditorKit } from '@/components/editor/editor-kit'
import { Editor, EditorContainer } from '@/components/ui/editor'
import { TooltipProvider } from '@/components/ui/tooltip'
import { asValue, type Value } from './value'

export function PlateEditor({
  initialValue,
  onChange,
}: {
  initialValue?: unknown
  onChange?: (value: Value) => void
}) {
  const editor = usePlateEditor({ plugins: EditorKit, value: asValue(initialValue) })

  return (
    <TooltipProvider>
      <Plate editor={editor} onChange={({ value }) => onChange?.(value)}>
        <EditorContainer className="rounded-xl border border-[var(--line)]">
          <Editor
            variant="none"
            className="min-h-[60vh] px-4 py-5 pb-32 sm:px-6"
            placeholder="‘/’ 를 입력해 블록을 추가하세요…"
          />
        </EditorContainer>
      </Plate>
    </TooltipProvider>
  )
}
