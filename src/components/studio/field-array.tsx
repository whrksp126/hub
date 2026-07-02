'use client'

import { Plus, X } from 'lucide-react'
import { useState } from 'react'

const inputCls =
  'w-full rounded-lg border border-white/10 bg-[var(--pf-surface)] px-3 py-2 text-sm text-[var(--pf-fg)] outline-none transition-colors focus:border-[var(--pf-ac)] placeholder:text-[var(--pf-fg-faint)]'
const addCls =
  'flex items-center gap-1.5 rounded-full border border-dashed border-white/15 px-3.5 py-1.5 text-xs font-semibold text-[var(--pf-fg-muted)] transition-colors hover:border-[var(--pf-ac)] hover:text-[var(--pf-fg)]'
const rmCls = 'shrink-0 rounded-md p-1 text-[var(--pf-fg-faint)] transition-colors hover:text-red-400'

// ── 문자열 배열 (스택·성과 등) ───────────────────────────────────────
// name 지정 시 form 제출용 hidden input, onChange 지정 시 변경마다 콜백(자동저장).
export function StringList({
  name,
  initial,
  placeholder,
  addLabel = '추가',
  onChange,
}: {
  name?: string
  initial?: string[] | null
  placeholder?: string
  addLabel?: string
  onChange?: (value: string[]) => void
}) {
  const [rows, setRows] = useState<string[]>(initial?.length ? initial : [])

  const apply = (next: string[]) => {
    setRows(next)
    onChange?.(next.map((r) => r.trim()).filter(Boolean))
  }

  return (
    <div className="space-y-2">
      {name && <input type="hidden" name={name} value={JSON.stringify(rows.filter((r) => r.trim()))} />}
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={row}
            placeholder={placeholder}
            onChange={(e) => apply(rows.map((r, j) => (j === i ? e.target.value : r)))}
            className={inputCls}
          />
          <button type="button" onClick={() => apply(rows.filter((_, j) => j !== i))} className={rmCls}>
            <X size={16} />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => apply([...rows, ''])} className={addCls}>
        <Plus size={14} /> {addLabel}
      </button>
    </div>
  )
}

// ── 객체 배열 (통계·스킬·수상·글·지표·섹션 등) ────────────────────────
export type FieldDef = {
  key: string
  label: string
  type?: 'text' | 'textarea' | 'list' // list = 줄바꿈으로 구분되는 문자열 배열
  placeholder?: string
}

type Row = Record<string, string | string[]>

export function ObjectList({
  name,
  initial,
  fields,
  addLabel = '항목 추가',
  onChange,
}: {
  name?: string
  initial?: Row[] | null
  fields: FieldDef[]
  addLabel?: string
  onChange?: (value: Row[]) => void
}) {
  const [rows, setRows] = useState<Row[]>(initial?.length ? initial : [])

  const blank = (): Row => Object.fromEntries(fields.map((f) => [f.key, f.type === 'list' ? [] : ''])) as Row

  const apply = (next: Row[]) => {
    setRows(next)
    onChange?.(next)
  }

  const update = (i: number, key: string, value: string | string[]) =>
    apply(rows.map((r, j) => (j === i ? { ...r, [key]: value } : r)))

  return (
    <div className="space-y-3">
      {name && <input type="hidden" name={name} value={JSON.stringify(rows)} />}
      {rows.map((row, i) => (
        <div key={i} className="relative rounded-xl border border-white/[0.08] bg-[var(--pf-surface)] p-3.5">
          <button
            type="button"
            onClick={() => apply(rows.filter((_, j) => j !== i))}
            className="absolute right-2.5 top-2.5 rounded-md p-1 text-[var(--pf-fg-faint)] hover:text-red-400"
          >
            <X size={16} />
          </button>
          <div className="grid gap-2.5 pr-6 sm:grid-cols-2">
            {fields.map((f) => {
              const span = f.type === 'textarea' || f.type === 'list' ? 'sm:col-span-2' : ''
              const val = row[f.key]
              return (
                <div key={f.key} className={span}>
                  <label className="mb-1 block text-[11px] font-medium text-[var(--pf-fg-faint)]">{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea
                      value={(val as string) ?? ''}
                      placeholder={f.placeholder}
                      rows={2}
                      onChange={(e) => update(i, f.key, e.target.value)}
                      className={inputCls}
                    />
                  ) : f.type === 'list' ? (
                    <textarea
                      value={Array.isArray(val) ? val.join('\n') : ''}
                      placeholder={f.placeholder || '한 줄에 하나씩'}
                      rows={3}
                      onChange={(e) => update(i, f.key, e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
                      className={inputCls}
                    />
                  ) : (
                    <input
                      value={(val as string) ?? ''}
                      placeholder={f.placeholder}
                      onChange={(e) => update(i, f.key, e.target.value)}
                      className={inputCls}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
      <button type="button" onClick={() => apply([...rows, blank()])} className={addCls}>
        <Plus size={14} /> {addLabel}
      </button>
    </div>
  )
}
