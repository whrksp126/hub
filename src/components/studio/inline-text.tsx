'use client'

import { useRef } from 'react'

// 노션/피그마식 인라인 텍스트. 공개 화면과 똑같이 렌더되다가
// 클릭하면 그 자리에서 편집되고, 포커스가 빠지면(onCommit) 자동저장한다.
export function InlineText({
  value,
  onCommit,
  multiline = false,
  className = '',
  placeholder,
  onLight = false,
  ariaLabel,
}: {
  value: string
  onCommit: (next: string) => void
  multiline?: boolean
  className?: string
  placeholder?: string
  onLight?: boolean
  ariaLabel?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)

  function commit() {
    const el = ref.current
    if (!el) return
    const next = (multiline ? el.innerText : (el.textContent ?? '')).replace(/ /g, ' ').replace(/\n+$/g, '').trim()
    if (next !== value) onCommit(next)
  }

  return (
    <span
      ref={ref}
      role="textbox"
      tabIndex={0}
      aria-label={ariaLabel}
      contentEditable
      suppressContentEditableWarning
      data-ph={placeholder}
      onBlur={commit}
      onKeyDown={(e) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault()
          ref.current?.blur()
        } else if (e.key === 'Escape') {
          // 변경 취소: 원래 값으로 되돌리고 blur
          if (ref.current) ref.current.textContent = value
          ref.current?.blur()
        }
      }}
      onPaste={(e) => {
        e.preventDefault()
        const text = e.clipboardData.getData('text/plain')
        document.execCommand('insertText', false, text)
      }}
      className={`pf-edit ${onLight ? 'pf-edit-on-light' : ''} ${className}`}
    >
      {value}
    </span>
  )
}
