import { Lightbulb } from 'lucide-react'
import type React from 'react'
import type { NoteBlock } from '@/db/schema'
import { isEmbedUrl, toEmbedUrl } from '@/lib/embed'

// 본문 블록의 공통 스타일 — 공개(NoteBody)와 편집(LiveNoteEditor)이 동일하게 쓴다.
export const NOTE_BODY_GAP = 'flex flex-col gap-[clamp(18px,2.2vw,26px)]'

export function noteBlockClass(type: NoteBlock['type']): string {
  switch (type) {
    case 'h2':
      return 'mt-[clamp(16px,2vw,28px)] text-[clamp(24px,3vw,34px)] font-bold leading-[1.25] tracking-[-0.015em] text-[var(--pf-fg)]'
    case 'h3':
      return 'mt-[clamp(8px,1.5vw,16px)] text-[clamp(19px,2.2vw,24px)] font-bold leading-[1.3] text-[var(--pf-fg)]'
    case 'quote':
      return 'border-l-[3px] border-[var(--pf-ac)] pl-5 text-[clamp(17px,2vw,21px)] font-medium leading-[1.6] text-[var(--pf-fg-dim)]'
    default:
      return 'whitespace-pre-wrap text-[clamp(16px,1.5vw,18px)] leading-[1.8] text-[var(--pf-fg-muted)]'
  }
}

// 인라인 강조 — **볼드** 와 `인라인 코드` 를 렌더. (본문·표·리스트 공용)
export function parseInline(text: string): React.ReactNode {
  if (!text) return text
  const re = /(\*\*([^*]+)\*\*|`([^`]+)`)/g
  const out: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[2] != null) out.push(<strong key={k++} className="font-semibold text-[var(--pf-fg)]">{m[2]}</strong>)
    else if (m[3] != null) out.push(<code key={k++} className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[0.86em] text-[var(--pf-ac)]">{m[3]}</code>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

// ── 개별 블록 렌더 (공개·편집 공용으로 export) ─────────────────────────
export function CodeBlock({ text, lang }: { text: string; lang?: string }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-white/[0.08] bg-[#0d1117]">
      {lang && (
        <div className="border-b border-white/[0.06] px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[var(--pf-fg-faint)]">{lang}</div>
      )}
      <pre className="overflow-x-auto px-4 py-3.5">
        <code className="font-mono text-[13px] leading-[1.65] text-[var(--pf-fg-dim)]">{text}</code>
      </pre>
    </div>
  )
}

export function NoteTable({ header, rows }: { header?: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-[12px] border border-white/[0.08]">
      <table className="w-full border-collapse text-[14px]">
        {header && header.length > 0 && (
          <thead>
            <tr>
              {header.map((h, i) => (
                <th key={i} className="border-b border-white/[0.1] bg-white/[0.03] px-3.5 py-2.5 text-left font-semibold text-[var(--pf-fg)]">{parseInline(h)}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-b border-white/[0.05] last:border-0">
              {r.map((c, ci) => (
                <td key={ci} className="px-3.5 py-2.5 align-top leading-[1.6] text-[var(--pf-fg-muted)]">{parseInline(c)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function NoteList({ items, ordered }: { items: string[]; ordered?: boolean }) {
  const cls = `flex flex-col gap-2 pl-5 text-[clamp(16px,1.5vw,18px)] leading-[1.7] text-[var(--pf-fg-muted)] marker:text-[var(--pf-ac)] ${ordered ? 'list-decimal' : 'list-disc'}`
  return ordered ? (
    <ol className={cls}>{items.map((it, i) => <li key={i} className="pl-1">{parseInline(it)}</li>)}</ol>
  ) : (
    <ul className={cls}>{items.map((it, i) => <li key={i} className="pl-1">{parseInline(it)}</li>)}</ul>
  )
}

// 글 본문 블록 렌더러 — 편집(라이브)과 공개가 같은 스타일을 공유한다.
export function NoteBody({ blocks, mediaUrls }: { blocks: NoteBlock[]; mediaUrls: Record<number, string> }) {
  if (!blocks?.length) return null
  return (
    <div className={NOTE_BODY_GAP}>
      {blocks.map((b, i) => {
        if (b.type === 'h2') return <h2 key={i} className={noteBlockClass('h2')}>{parseInline(b.text)}</h2>
        if (b.type === 'h3') return <h3 key={i} className={noteBlockClass('h3')}>{parseInline(b.text)}</h3>
        if (b.type === 'quote') return <blockquote key={i} className={noteBlockClass('quote')}>{parseInline(b.text)}</blockquote>
        if (b.type === 'code') return <CodeBlock key={i} text={b.text} lang={b.lang} />
        if (b.type === 'list') return <NoteList key={i} items={b.items} ordered={b.ordered} />
        if (b.type === 'table') return <NoteTable key={i} header={b.header} rows={b.rows} />
        if (b.type === 'image') {
          const url = b.mediaId ? mediaUrls[b.mediaId] : null
          if (!url) return null
          return (
            <figure key={i} className="my-[clamp(8px,1.5vw,20px)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={b.caption ?? ''} className="w-full rounded-[16px] border border-white/[0.06]" />
              {b.caption && <figcaption className="mt-2.5 text-center text-[13px] text-[var(--pf-fg-faint)]">{parseInline(b.caption)}</figcaption>}
            </figure>
          )
        }
        if (b.type === 'video') {
          const url = b.mediaId ? mediaUrls[b.mediaId] : b.url
          if (!url) return null
          const embed = !b.mediaId && b.url && isEmbedUrl(b.url)
          return (
            <figure key={i} className="my-[clamp(8px,1.5vw,20px)]">
              {embed ? (
                <div className="aspect-video w-full overflow-hidden rounded-[16px] border border-white/[0.08] bg-black">
                  <iframe src={toEmbedUrl(url)} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={b.caption || 'video'} />
                </div>
              ) : (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video src={url} poster={b.poster || undefined} controls muted playsInline className="mx-auto block max-h-[80vh] w-full rounded-[16px] border border-white/[0.08] bg-black object-contain" />
              )}
              {b.caption && <figcaption className="mt-2.5 text-center text-[13px] text-[var(--pf-fg-faint)]">{parseInline(b.caption)}</figcaption>}
            </figure>
          )
        }
        if (b.type === 'callout') {
          return (
            <div key={i} className="flex gap-3 rounded-[16px] border border-[var(--pf-ac)]/25 bg-[var(--pf-ac)]/[0.06] p-[clamp(16px,2.2vw,22px)]">
              <Lightbulb size={18} className="mt-0.5 flex-none text-[var(--pf-ac)]" />
              <p className="m-0 whitespace-pre-wrap text-[clamp(15px,1.5vw,17px)] leading-[1.7] text-[var(--pf-fg-dim)]">{parseInline(b.text)}</p>
            </div>
          )
        }
        if (b.type === 'divider') return <hr key={i} className="my-[clamp(8px,1.5vw,18px)] border-0 border-t border-white/[0.1]" />
        return null
      })}
    </div>
  )
}
