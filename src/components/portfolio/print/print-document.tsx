import type React from 'react'
import type {
  Experience,
  NoteBlock,
  Profile,
  Project,
  ProjectSection,
  SectionMedia,
} from '@/db/schema'

// ── 인라인 강조(**볼드**·`코드`) — print 밝은 테마용 ──────────────────
function pinline(text: string): React.ReactNode {
  if (!text) return text
  const re = /(\*\*([^*]+)\*\*|`([^`]+)`)/g
  const out: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[2] != null) out.push(<strong key={k++} className="pfp-strong">{m[2]}</strong>)
    else if (m[3] != null) out.push(<code key={k++} className="pfp-code-inline">{m[3]}</code>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

// 여러 줄 본문 → 문단들.
function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className="pfp-p">
            {p.split('\n').map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {pinline(line)}
              </span>
            ))}
          </p>
        ))}
    </>
  )
}

function SectionTitle({ label, title }: { label: string; title?: string }) {
  return (
    <div className="pfp-sec-head">
      <span className="pfp-sec-label">{label}</span>
      {title && <h2 className="pfp-sec-title">{title}</h2>}
    </div>
  )
}

// ── 미디어(이미지만) ────────────────────────────────────────────────
function PrintMedia({ media, urls }: { media?: SectionMedia[]; urls: Record<number, string> }) {
  const imgs = (media ?? []).filter((m) => m.kind === 'image' && m.mediaId && urls[m.mediaId])
  if (!imgs.length) return null
  return (
    <div className={`pfp-media ${imgs.length > 1 ? 'pfp-media-grid' : ''}`}>
      {imgs.map((m, i) => (
        <figure key={i} className="pfp-figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urls[m.mediaId as number]} alt={m.caption ?? ''} className="pfp-img" />
          {m.caption && <figcaption className="pfp-cap">{pinline(m.caption)}</figcaption>}
        </figure>
      ))}
    </div>
  )
}

// ── 프로젝트 케이스 스터디 섹션 ─────────────────────────────────────
function ProjectSectionView({ s, urls }: { s: ProjectSection; urls: Record<number, string> }) {
  const isSpecs = s.kind === 'specs'
  // 다이어그램/ERD는 인쇄 부적합 → 제목/본문 텍스트만.
  return (
    <div className="pfp-psec">
      {s.heading && <h3 className="pfp-h3">{s.heading}</h3>}
      {s.body && <Paragraphs text={s.body} />}
      {s.bullets && s.bullets.length > 0 && (
        <ul className={isSpecs ? 'pfp-tags' : 'pfp-ul'}>
          {s.bullets.map((b, i) =>
            isSpecs ? (
              <li key={i} className="pfp-tag">{b}</li>
            ) : (
              <li key={i}>{pinline(b)}</li>
            ),
          )}
        </ul>
      )}
      {s.kind !== 'diagram' && s.kind !== 'erd' && <PrintMedia media={s.media} urls={urls} />}
    </div>
  )
}

function ProjectView({ p, urls }: { p: Project; urls: Record<number, string> }) {
  const metaBits = [p.tag, p.year, p.role].filter(Boolean)
  return (
    <article className="pfp-project pfp-avoid">
      <div className="pfp-proj-head">
        <h3 className="pfp-proj-title">
          {p.titleKr || p.title}
          {p.titleKr && p.title && <span className="pfp-proj-title-en"> · {p.title}</span>}
        </h3>
        {metaBits.length > 0 && <div className="pfp-proj-meta">{metaBits.join('  ·  ')}</div>}
      </div>
      {p.url && <div className="pfp-proj-url">{p.url}</div>}
      {p.summary && <p className="pfp-p pfp-lead">{pinline(p.summary)}</p>}
      {p.metrics && p.metrics.length > 0 && (
        <div className="pfp-metrics">
          {p.metrics.map((m, i) => (
            <div key={i} className="pfp-metric">
              <div className="pfp-metric-v">{m.value}</div>
              <div className="pfp-metric-l">{m.label}</div>
            </div>
          ))}
        </div>
      )}
      {p.stack && p.stack.length > 0 && (
        <ul className="pfp-tags">
          {p.stack.map((s, i) => (
            <li key={i} className="pfp-tag">{s}</li>
          ))}
        </ul>
      )}
      {p.sections && p.sections.length > 0 && (
        <div className="pfp-psecs">
          {p.sections.map((s, i) => (
            <ProjectSectionView key={i} s={s} urls={urls} />
          ))}
        </div>
      )}
    </article>
  )
}

// ── 딥다이브 글 본문(블록) ──────────────────────────────────────────
function NoteBlocksView({ blocks, urls }: { blocks: NoteBlock[]; urls: Record<number, string> }) {
  return (
    <div className="pfp-note-body">
      {blocks.map((b, i) => {
        if (b.type === 'h2') return <h3 key={i} className="pfp-h3">{pinline(b.text)}</h3>
        if (b.type === 'h3') return <h4 key={i} className="pfp-h4">{pinline(b.text)}</h4>
        if (b.type === 'p') return <Paragraphs key={i} text={b.text} />
        if (b.type === 'quote') return <blockquote key={i} className="pfp-quote">{pinline(b.text)}</blockquote>
        if (b.type === 'callout') return <div key={i} className="pfp-callout">{pinline(b.text)}</div>
        if (b.type === 'code')
          return (
            <pre key={i} className="pfp-code">
              <code>{b.text}</code>
            </pre>
          )
        if (b.type === 'list')
          return b.ordered ? (
            <ol key={i} className="pfp-ol">{b.items.map((it, j) => <li key={j}>{pinline(it)}</li>)}</ol>
          ) : (
            <ul key={i} className="pfp-ul">{b.items.map((it, j) => <li key={j}>{pinline(it)}</li>)}</ul>
          )
        if (b.type === 'table')
          return (
            <table key={i} className="pfp-table">
              {b.header && b.header.length > 0 && (
                <thead>
                  <tr>{b.header.map((h, j) => <th key={j}>{pinline(h)}</th>)}</tr>
                </thead>
              )}
              <tbody>
                {b.rows.map((r, ri) => (
                  <tr key={ri}>{r.map((c, ci) => <td key={ci}>{pinline(c)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          )
        if (b.type === 'image') {
          const url = b.mediaId ? urls[b.mediaId] : null
          if (!url) return null
          return (
            <figure key={i} className="pfp-figure">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={b.caption ?? ''} className="pfp-img" />
              {b.caption && <figcaption className="pfp-cap">{pinline(b.caption)}</figcaption>}
            </figure>
          )
        }
        if (b.type === 'video') {
          // 영상은 인쇄 불가 → 포스터 이미지가 있으면 그걸, 없으면 캡션만.
          const poster = b.poster || (b.mediaId ? urls[b.mediaId] : null)
          return (
            <figure key={i} className="pfp-figure">
              {poster && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={poster} alt={b.caption ?? ''} className="pfp-img" />
              )}
              <figcaption className="pfp-cap">▶ {b.caption || '영상'} (온라인에서 재생)</figcaption>
            </figure>
          )
        }
        if (b.type === 'divider') return <hr key={i} className="pfp-hr" />
        return null
      })}
    </div>
  )
}

export type PrintInclude = {
  intro: boolean
  stats: boolean
  skills: boolean
  awards: boolean
  experience: boolean
  projects: boolean
  notes: boolean
}

export type PrintNote = { id: number; slug: string; title: string; excerpt: string | null; category: string | null; content: NoteBlock[] }

export function PrintDocument({
  profile,
  include,
  experiences,
  projects,
  notes,
  urls,
  avatarUrl,
}: {
  profile: Profile
  include: PrintInclude
  experiences: Experience[]
  projects: Project[]
  notes: PrintNote[]
  urls: Record<number, string>
  avatarUrl: string | null
}) {
  const contact = [
    profile.email,
    profile.phone,
    profile.github ? profile.github.replace(/^https?:\/\//, '') : null,
    profile.location,
  ].filter(Boolean)

  return (
    <div className="pfp" style={{ ['--ac' as string]: profile.accent }}>
      {/* ── 헤더 ── */}
      <header className="pfp-header pfp-avoid">
        {avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={profile.name} className="pfp-avatar" />
        )}
        <div className="pfp-header-main">
          <h1 className="pfp-name">
            {profile.name}
            {profile.nameEn && <span className="pfp-name-en"> {profile.nameEn}</span>}
          </h1>
          {profile.title && <div className="pfp-title">{profile.title}</div>}
          {profile.tagline && <p className="pfp-tagline">{profile.tagline}</p>}
          {contact.length > 0 && (
            <div className="pfp-contact">
              {contact.map((c, i) => (
                <span key={i}>{c}</span>
              ))}
            </div>
          )}
          {(profile.education || profile.business) && (
            <div className="pfp-contact pfp-contact-sub">
              {profile.education && <span>{profile.education}</span>}
              {profile.business && <span>{profile.business}</span>}
            </div>
          )}
        </div>
      </header>

      {/* ── 소개 ── */}
      {include.intro && profile.intro && (
        <section className="pfp-section pfp-avoid">
          <SectionTitle label="ABOUT" title="소개" />
          <Paragraphs text={profile.intro} />
        </section>
      )}

      {/* ── 통계 ── */}
      {include.stats && (profile.stats?.length ?? 0) > 0 && (
        <section className="pfp-section pfp-avoid">
          <div className="pfp-stats">
            {profile.stats!.map((s, i) => (
              <div key={i} className="pfp-stat">
                <div className="pfp-stat-v">{s.value}</div>
                <div className="pfp-stat-l">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 스킬 ── */}
      {include.skills && (profile.skills?.length ?? 0) > 0 && (
        <section className="pfp-section pfp-avoid">
          <SectionTitle label="SKILLS" title="기술 스택" />
          <div className="pfp-skills">
            {profile.skills!.map((g, i) => (
              <div key={i} className="pfp-skill-group">
                <div className="pfp-skill-area">{g.area}</div>
                <ul className="pfp-tags">
                  {g.items.map((it, j) => (
                    <li key={j} className="pfp-tag">{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 수상/자격 ── */}
      {include.awards && (profile.awards?.length ?? 0) > 0 && (
        <section className="pfp-section pfp-avoid">
          <SectionTitle label="AWARDS" title="수상 · 자격" />
          <ul className="pfp-awards">
            {profile.awards!.map((a, i) => (
              <li key={i}>
                <span className="pfp-award-kind">{a.kind}</span>
                {a.title}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── 경력 ── */}
      {include.experience && experiences.length > 0 && (
        <section className="pfp-section">
          <SectionTitle label="EXPERIENCE" title="경력" />
          <div className="pfp-exp-list">
            {experiences.map((e) => (
              <article key={e.id} className="pfp-exp pfp-avoid">
                <div className="pfp-exp-head">
                  <div>
                    <span className="pfp-exp-company">{e.company}</span>
                    {e.role && <span className="pfp-exp-role"> · {e.role}</span>}
                  </div>
                  <div className="pfp-exp-period">
                    {e.period}
                    {e.length && <span className="pfp-exp-len"> ({e.length})</span>}
                  </div>
                </div>
                {e.context && <p className="pfp-p pfp-muted">{pinline(e.context)}</p>}
                {e.points && e.points.length > 0 && (
                  <ul className="pfp-ul">
                    {e.points.map((pt, i) => (
                      <li key={i}>{pinline(pt)}</li>
                    ))}
                  </ul>
                )}
                {e.stack && e.stack.length > 0 && (
                  <ul className="pfp-tags">
                    {e.stack.map((s, i) => (
                      <li key={i} className="pfp-tag">{s}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── 프로젝트 ── */}
      {include.projects && projects.length > 0 && (
        <section className="pfp-section">
          <SectionTitle label="PROJECTS" title="프로젝트" />
          <div className="pfp-proj-list">
            {projects.map((p) => (
              <ProjectView key={p.id} p={p} urls={urls} />
            ))}
          </div>
        </section>
      )}

      {/* ── 딥다이브 글 ── */}
      {include.notes && notes.length > 0 && (
        <section className="pfp-section">
          <SectionTitle label="WRITING" title="딥다이브 · 글" />
          <div className="pfp-note-list">
            {notes.map((n) => (
              <article key={n.id} className="pfp-note">
                <h3 className="pfp-note-title">{n.title}</h3>
                {n.category && <div className="pfp-note-cat">{n.category}</div>}
                {n.excerpt && <p className="pfp-p pfp-muted">{pinline(n.excerpt)}</p>}
                {n.content.length > 0 && <NoteBlocksView blocks={n.content} urls={urls} />}
              </article>
            ))}
          </div>
        </section>
      )}

      <footer className="pfp-footer">
        {profile.name} — 포트폴리오 · hub.ghmate.com/p/{profile.username}
      </footer>
    </div>
  )
}
