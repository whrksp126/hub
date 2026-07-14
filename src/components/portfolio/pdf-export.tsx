'use client'

import { Check, FileDown, Loader2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

type Options = {
  hasStats: boolean
  hasSkills: boolean
  hasAwards: boolean
  hasExperience: boolean
  projects: { slug: string; title: string }[]
  notes: { slug: string; title: string }[]
}

type SectionKey = 'intro' | 'stats' | 'skills' | 'awards' | 'experience' | 'projects' | 'notes'

// 브라우저 인쇄(PDF 저장) 기반 포트폴리오 내보내기.
// 버튼 클릭 → 담을 섹션/프로젝트/글을 체크 → print 라우트를 새 탭에서 열어 인쇄 대화상자를 띄운다.
export function PdfExportButton({
  username,
  variant = 'floating',
}: {
  username: string
  variant?: 'floating' | 'inline'
}) {
  const [open, setOpen] = useState(false)
  const [opts, setOpts] = useState<Options | null>(null)
  const [loading, setLoading] = useState(false)
  const [sections, setSections] = useState<Record<SectionKey, boolean>>({
    intro: true,
    stats: true,
    skills: true,
    awards: true,
    experience: true,
    projects: true,
    notes: true,
  })
  const [projSel, setProjSel] = useState<Set<string>>(new Set())
  const [noteSel, setNoteSel] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/portfolio-export?u=${encodeURIComponent(username)}`)
      if (!res.ok) throw new Error('failed')
      const data: Options = await res.json()
      setOpts(data)
      setProjSel(new Set(data.projects.map((p) => p.slug)))
      setNoteSel(new Set(data.notes.map((n) => n.slug)))
    } catch {
      setOpts({ hasStats: false, hasSkills: false, hasAwards: false, hasExperience: false, projects: [], notes: [] })
    } finally {
      setLoading(false)
    }
  }, [username])

  useEffect(() => {
    if (open && !opts && !loading) load()
  }, [open, opts, loading, load])

  // esc 닫기
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open])

  const toggle = (k: SectionKey) => setSections((s) => ({ ...s, [k]: !s[k] }))
  const toggleIn = (set: Set<string>, setSet: (s: Set<string>) => void, slug: string) => {
    const next = new Set(set)
    if (next.has(slug)) next.delete(slug)
    else next.add(slug)
    setSet(next)
  }

  const generate = () => {
    const s: SectionKey[] = (Object.keys(sections) as SectionKey[]).filter((k) => sections[k])
    const params = new URLSearchParams()
    params.set('s', s.join(','))
    if (sections.projects && opts && projSel.size < opts.projects.length) params.set('p', [...projSel].join(','))
    if (sections.notes && opts && noteSel.size < opts.notes.length) params.set('n', [...noteSel].join(','))
    const url = `/p/${encodeURIComponent(username)}/print?${params.toString()}`
    window.open(url, '_blank', 'noopener')
    setOpen(false)
  }

  const trigger =
    variant === 'floating' ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="PDF로 내보내기"
        aria-label="PDF로 내보내기"
        className="pointer-events-auto fixed right-4 top-[22px] z-60 flex h-[46px] items-center gap-2 rounded-full border border-white/10 bg-[rgba(20,20,20,0.96)] px-4 text-[var(--pf-fg-faint,#8a8a8a)] shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-colors hover:text-white"
      >
        <FileDown size={19} strokeWidth={1.8} />
        <span className="text-[13px] font-semibold">PDF</span>
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-3.5 py-2 text-[13px] font-semibold text-white/90 transition-colors hover:bg-white/[0.1]"
      >
        <FileDown size={16} strokeWidth={2} /> PDF 내보내기
      </button>
    )

  return (
    <>
      {trigger}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-[440px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#17181c] text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-[15px] font-bold">PDF로 내보내기</h2>
                <p className="mt-0.5 text-[12px] text-white/50">담을 내용을 선택하세요</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1.5 text-white/50 hover:bg-white/10 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {loading || !opts ? (
                <div className="flex items-center justify-center gap-2 py-10 text-white/50">
                  <Loader2 size={18} className="animate-spin" /> 불러오는 중…
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <Group title="기본">
                    <Row label="소개" checked={sections.intro} onClick={() => toggle('intro')} />
                    {opts.hasStats && <Row label="핵심 지표" checked={sections.stats} onClick={() => toggle('stats')} />}
                    {opts.hasSkills && <Row label="기술 스택" checked={sections.skills} onClick={() => toggle('skills')} />}
                    {opts.hasAwards && <Row label="수상 · 자격" checked={sections.awards} onClick={() => toggle('awards')} />}
                    {opts.hasExperience && <Row label="경력" checked={sections.experience} onClick={() => toggle('experience')} />}
                  </Group>

                  {opts.projects.length > 0 && (
                    <Group
                      title="프로젝트"
                      checked={sections.projects}
                      onToggle={() => toggle('projects')}
                    >
                      {sections.projects &&
                        opts.projects.map((p) => (
                          <Row
                            key={p.slug}
                            label={p.title}
                            sub
                            checked={projSel.has(p.slug)}
                            onClick={() => toggleIn(projSel, setProjSel, p.slug)}
                          />
                        ))}
                    </Group>
                  )}

                  {opts.notes.length > 0 && (
                    <Group title="딥다이브 · 글" checked={sections.notes} onToggle={() => toggle('notes')}>
                      {sections.notes &&
                        opts.notes.map((n) => (
                          <Row
                            key={n.slug}
                            label={n.title}
                            sub
                            checked={noteSel.has(n.slug)}
                            onClick={() => toggleIn(noteSel, setNoteSel, n.slug)}
                          />
                        ))}
                    </Group>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-white/10 px-5 py-4">
              <p className="mb-3 text-[11.5px] leading-relaxed text-white/40">
                새 탭에서 인쇄 창이 열립니다. <b className="text-white/70">대상 → PDF로 저장</b>을 선택하고, 옵션에서
                <b className="text-white/70"> 배경 그래픽</b>을 켜면 색이 그대로 나옵니다.
              </p>
              <button
                type="button"
                onClick={generate}
                disabled={loading || !opts}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--pf-ac,#f1531b)] py-2.5 text-[14px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <FileDown size={17} /> PDF 만들기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Group({
  title,
  checked,
  onToggle,
  children,
}: {
  title: string
  checked?: boolean
  onToggle?: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      {onToggle ? (
        <Row label={title} checked={checked!} onClick={onToggle} head />
      ) : (
        <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-white/40">{title}</div>
      )}
      <div className={onToggle ? 'mt-1' : ''}>{children}</div>
    </div>
  )
}

function Row({
  label,
  checked,
  onClick,
  sub,
  head,
}: {
  label: string
  checked: boolean
  onClick: () => void
  sub?: boolean
  head?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-center gap-2.5 rounded-md py-1.5 text-left transition-colors hover:bg-white/[0.04]',
        sub ? 'pl-6 pr-2' : 'px-2',
        head ? 'text-[13px] font-bold uppercase tracking-wider text-white/70' : 'text-[13.5px] text-white/85',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border transition-colors',
          checked ? 'border-[var(--pf-ac,#f1531b)] bg-[var(--pf-ac,#f1531b)]' : 'border-white/25 bg-transparent',
        ].join(' ')}
      >
        {checked && <Check size={13} strokeWidth={3} className="text-white" />}
      </span>
      <span className={sub ? 'truncate' : ''}>{label}</span>
    </button>
  )
}
