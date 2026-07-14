'use client'

import { Check, FileDown, Loader2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

type Options = {
  hasStats: boolean
  hasSkills: boolean
  hasCards: boolean
  hasHomeProjects: boolean
  hasHomeNotes: boolean
  hasExperience: boolean
  projects: { slug: string; title: string }[]
  notes: { slug: string; title: string }[]
}

type HomeKey = 'hero' | 'stats' | 'services' | 'projects' | 'experience' | 'skills' | 'notes' | 'cta'

const WIDTHS = [
  { label: '세로 1단', px: 800 },
  { label: '기본 (2단)', px: 1080 },
  { label: '넓게', px: 1280 },
  { label: '더 넓게', px: 1440 },
]

// 실제 화면의 다크 디자인 그대로 담는 PDF 내보내기.
// 화면의 섹션(홈 요소별 + 프로젝트/경력/글 상세)을 체크박스로 골라 print 라우트를 새 탭에서 연다.
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
  const [home, setHome] = useState<Record<HomeKey, boolean>>({
    hero: true,
    stats: true,
    services: true,
    projects: true,
    experience: true,
    skills: true,
    notes: true,
    cta: true,
  })
  const [expDetail, setExpDetail] = useState(true)
  const [projSel, setProjSel] = useState<Set<string>>(new Set())
  const [noteSel, setNoteSel] = useState<Set<string>>(new Set())
  const [width, setWidth] = useState(1080)
  const [busy, setBusy] = useState(false)

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
      setOpts({ hasStats: false, hasSkills: false, hasCards: false, hasHomeProjects: false, hasHomeNotes: false, hasExperience: false, projects: [], notes: [] })
    } finally {
      setLoading(false)
    }
  }, [username])

  useEffect(() => {
    if (open && !opts && !loading) load()
  }, [open, opts, loading, load])

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open])

  const toggleHome = (k: HomeKey) => setHome((s) => ({ ...s, [k]: !s[k] }))
  const toggleIn = (set: Set<string>, setSet: (s: Set<string>) => void, slug: string) => {
    const next = new Set(set)
    if (next.has(slug)) next.delete(slug)
    else next.add(slug)
    setSet(next)
  }

  // 그룹별 전체 선택/해제
  const homeKeys = (): HomeKey[] => {
    if (!opts) return []
    const a: HomeKey[] = ['hero']
    if (opts.hasStats) a.push('stats')
    if (opts.hasCards) a.push('services')
    if (opts.hasHomeProjects) a.push('projects')
    if (opts.hasExperience) a.push('experience')
    if (opts.hasSkills) a.push('skills')
    if (opts.hasHomeNotes) a.push('notes')
    a.push('cta')
    return a
  }
  const allHomeOn = homeKeys().every((k) => home[k])
  const toggleAllHome = () =>
    setHome((s) => {
      const next = { ...s }
      for (const k of homeKeys()) next[k] = !allHomeOn
      return next
    })
  const allProjOn = !!opts && opts.projects.length > 0 && projSel.size === opts.projects.length
  const toggleAllProj = () => setProjSel(allProjOn ? new Set() : new Set(opts?.projects.map((p) => p.slug)))
  const allNoteOn = !!opts && opts.notes.length > 0 && noteSel.size === opts.notes.length
  const toggleAllNote = () => setNoteSel(allNoteOn ? new Set() : new Set(opts?.notes.map((n) => n.slug)))

  const generate = () => {
    if (!opts) return
    const params = new URLSearchParams()
    params.set('u', username)
    params.set('w', String(width))
    // 홈 섹션 — 존재하며 켠 것만. 항상 명시(빈 값이어도 전체포함과 구분).
    const avail: Record<HomeKey, boolean> = {
      hero: true,
      stats: opts.hasStats,
      services: opts.hasCards,
      projects: opts.hasHomeProjects,
      experience: opts.hasExperience,
      skills: opts.hasSkills,
      notes: opts.hasHomeNotes,
      cta: true,
    }
    const homeKeys = (Object.keys(home) as HomeKey[]).filter((k) => home[k] && avail[k])
    params.set('home', homeKeys.join(','))
    // 프로젝트 상세
    if (opts.projects.length > 0 && projSel.size === opts.projects.length) params.set('pd', 'all')
    else if (projSel.size > 0) params.set('pd', [...projSel].join(','))
    // 글 상세
    if (opts.notes.length > 0 && noteSel.size === opts.notes.length) params.set('nd', 'all')
    else if (noteSel.size > 0) params.set('nd', [...noteSel].join(','))
    // 경력 상세 페이지
    if (opts.hasExperience && expDetail) params.set('exp', '1')

    // 서버가 실제 브라우저로 렌더 → 픽셀 퍼펙트 PDF. 새 탭에서 열림(생성에 몇 초 소요).
    setBusy(true)
    window.open(`/api/portfolio-pdf?${params.toString()}`, '_blank', 'noopener')
    setTimeout(() => {
      setBusy(false)
      setOpen(false)
    }, 1200)
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="flex max-h-[86vh] w-full max-w-[460px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#17181c] text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-[15px] font-bold">PDF로 내보내기</h2>
                <p className="mt-0.5 text-[12px] text-white/50">화면 그대로 · 담을 섹션을 선택하세요</p>
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
                  <Group title="홈 화면" all={{ checked: allHomeOn, onToggle: toggleAllHome }}>
                    <Row label="소개 (히어로)" checked={home.hero} onClick={() => toggleHome('hero')} />
                    {opts.hasStats && <Row label="핵심 지표" checked={home.stats} onClick={() => toggleHome('stats')} />}
                    {opts.hasCards && <Row label="서비스 카드" checked={home.services} onClick={() => toggleHome('services')} />}
                    {opts.hasHomeProjects && <Row label="프로젝트 요약" checked={home.projects} onClick={() => toggleHome('projects')} />}
                    {opts.hasExperience && <Row label="경력 요약" checked={home.experience} onClick={() => toggleHome('experience')} />}
                    {opts.hasSkills && <Row label="기술 스택" checked={home.skills} onClick={() => toggleHome('skills')} />}
                    {opts.hasHomeNotes && <Row label="최근 글" checked={home.notes} onClick={() => toggleHome('notes')} />}
                    <Row label="CTA (연락 유도)" checked={home.cta} onClick={() => toggleHome('cta')} />
                  </Group>

                  {opts.projects.length > 0 && (
                    <Group title="프로젝트 상세" hint="케이스 스터디 전체" all={{ checked: allProjOn, onToggle: toggleAllProj }}>
                      {opts.projects.map((p) => (
                        <Row key={p.slug} label={p.title} sub checked={projSel.has(p.slug)} onClick={() => toggleIn(projSel, setProjSel, p.slug)} />
                      ))}
                    </Group>
                  )}

                  {opts.hasExperience && (
                    <Group title="경력 상세 페이지">
                      <Row label="경력 카드 + 수상·학력·연락처" sub checked={expDetail} onClick={() => setExpDetail((v) => !v)} />
                    </Group>
                  )}

                  {opts.notes.length > 0 && (
                    <Group title="딥다이브 · 글 상세" hint="본문 전체" all={{ checked: allNoteOn, onToggle: toggleAllNote }}>
                      {opts.notes.map((n) => (
                        <Row key={n.slug} label={n.title} sub checked={noteSel.has(n.slug)} onClick={() => toggleIn(noteSel, setNoteSel, n.slug)} />
                      ))}
                    </Group>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-white/10 px-5 py-4">
              {/* 가로 폭 — 1080 이상이면 2단 데스크톱 레이아웃 */}
              <div className="mb-3">
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-white/40">가로 폭</div>
                <div className="flex flex-wrap gap-1.5">
                  {WIDTHS.map((wd) => (
                    <button
                      key={wd.px}
                      type="button"
                      onClick={() => setWidth(wd.px)}
                      className={[
                        'rounded-md border px-2.5 py-1.5 text-[12px] font-semibold transition-colors',
                        width === wd.px
                          ? 'border-[var(--pf-ac,#f1531b)] bg-[var(--pf-ac,#f1531b)] text-white'
                          : 'border-white/12 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]',
                      ].join(' ')}
                    >
                      {wd.label}
                      <span className="ml-1 text-[10px] opacity-60">{wd.px}</span>
                    </button>
                  ))}
                </div>
              </div>
              <p className="mb-3 text-[11.5px] leading-relaxed text-white/40">
                서버가 실제 화면 그대로 렌더한 <b className="text-white/70">PDF</b>를 새 탭에 엽니다. 생성에 몇 초 걸릴 수 있어요.
              </p>
              <button
                type="button"
                onClick={generate}
                disabled={loading || !opts || busy}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--pf-ac,#f1531b)] py-2.5 text-[14px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {busy ? <Loader2 size={17} className="animate-spin" /> : <FileDown size={17} />}
                {busy ? 'PDF 생성 중…' : 'PDF 만들기'}
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
  hint,
  all,
  children,
}: {
  title: string
  hint?: string
  all?: { checked: boolean; onToggle: () => void }
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">{title}</span>
          {hint && <span className="text-[10.5px] text-white/25">{hint}</span>}
        </div>
        {all && (
          <button
            type="button"
            onClick={all.onToggle}
            className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-[var(--pf-ac,#f1531b)] transition-colors hover:bg-white/[0.06]"
          >
            {all.checked ? '전체 해제' : '전체 선택'}
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function Row({
  label,
  checked,
  onClick,
  sub,
}: {
  label: string
  checked: boolean
  onClick: () => void
  sub?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-center gap-2.5 rounded-md py-1.5 text-left text-[13.5px] text-white/85 transition-colors hover:bg-white/[0.04]',
        sub ? 'pl-6 pr-2' : 'px-2',
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
