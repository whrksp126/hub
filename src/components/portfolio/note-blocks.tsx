import { Lightbulb } from 'lucide-react'
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

// 글 본문 블록 렌더러 — 편집(라이브)과 공개가 같은 스타일을 공유한다.
export function NoteBody({ blocks, mediaUrls }: { blocks: NoteBlock[]; mediaUrls: Record<number, string> }) {
  if (!blocks?.length) return null
  return (
    <div className={NOTE_BODY_GAP}>
      {blocks.map((b, i) => {
        if (b.type === 'h2') return <h2 key={i} className={noteBlockClass('h2')}>{b.text}</h2>
        if (b.type === 'h3') return <h3 key={i} className={noteBlockClass('h3')}>{b.text}</h3>
        if (b.type === 'quote') return <blockquote key={i} className={noteBlockClass('quote')}>{b.text}</blockquote>
        if (b.type === 'image') {
          const url = b.mediaId ? mediaUrls[b.mediaId] : null
          if (!url) return null
          return (
            <figure key={i} className="my-[clamp(8px,1.5vw,20px)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={b.caption ?? ''} className="w-full rounded-[16px]" />
              {b.caption && <figcaption className="mt-2.5 text-center text-[13px] text-[var(--pf-fg-faint)]">{b.caption}</figcaption>}
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
                <video src={url} controls playsInline className="w-full rounded-[16px] border border-white/[0.08] bg-black" />
              )}
              {b.caption && <figcaption className="mt-2.5 text-center text-[13px] text-[var(--pf-fg-faint)]">{b.caption}</figcaption>}
            </figure>
          )
        }
        if (b.type === 'callout') {
          return (
            <div key={i} className="flex gap-3 rounded-[16px] border border-[var(--pf-ac)]/25 bg-[var(--pf-ac)]/[0.06] p-[clamp(16px,2.2vw,22px)]">
              <Lightbulb size={18} className="mt-0.5 flex-none text-[var(--pf-ac)]" />
              <p className="m-0 whitespace-pre-wrap text-[clamp(15px,1.5vw,17px)] leading-[1.7] text-[var(--pf-fg-dim)]">{b.text}</p>
            </div>
          )
        }
        if (b.type === 'divider') return <hr key={i} className="my-[clamp(8px,1.5vw,18px)] border-0 border-t border-white/[0.1]" />
        return <p key={i} className={noteBlockClass('p')}>{b.text}</p>
      })}
    </div>
  )
}
