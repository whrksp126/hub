import type { Value } from 'platejs'

export type { Value }

export const EMPTY_VALUE: Value = [{ type: 'p', children: [{ text: '' }] }]

// DB에서 온 content(unknown)를 안전한 Plate Value로 정규화.
export function asValue(content: unknown): Value {
  if (Array.isArray(content) && content.length > 0) return content as Value
  return EMPTY_VALUE
}
