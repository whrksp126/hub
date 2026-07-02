import { InlineText } from '@/components/studio/inline-text'

// 텍스트 1개를 공개=정적 / 편집=인라인으로 동시에 표현하는 단일 소스 프리미티브.
// `edit`가 없으면 정적 <span>, 있으면 InlineText(클릭 그 자리 편집 + 자동저장).
// 공개 페이지(server component)는 edit 없이 쓰므로 함수 prop이 전달되지 않는다.
export type EditableField = {
  onCommit: (next: string) => void
  placeholder?: string
  ariaLabel?: string
}

export function EditableText({
  value,
  edit,
  className = '',
  multiline = false,
  onLight = false,
}: {
  value: string
  edit?: EditableField
  className?: string
  multiline?: boolean
  onLight?: boolean
}) {
  if (edit) {
    return (
      <InlineText
        value={value}
        onCommit={edit.onCommit}
        multiline={multiline}
        onLight={onLight}
        placeholder={edit.placeholder}
        ariaLabel={edit.ariaLabel}
        className={className}
      />
    )
  }
  return <span className={`${multiline ? 'whitespace-pre-wrap ' : ''}${className}`}>{value}</span>
}
