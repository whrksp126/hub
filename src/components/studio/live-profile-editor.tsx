'use client'

import { ImagePlus, Loader2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { DEFAULT_CARDS } from '@/components/portfolio/card-kit'
import { PortfolioColumns } from '@/components/portfolio/portfolio-columns'
import { PortfolioFooter } from '@/components/portfolio/portfolio-footer'
import { ProfileCard } from '@/components/portfolio/profile-card'
import { SaveBadge, useAutoSave } from '@/components/portfolio/sections/edit-controls'
import { CtaSection, Hero, SkillGrid, StatList } from '@/components/portfolio/sections/home-sections'
import { HomeExperienceRow, HomeNoteCard, HomeProjectRow } from '@/components/portfolio/sections/list-sections'
import { ServiceCards } from '@/components/portfolio/sections/service-cards'
import { legacyToSocial, SOCIAL_PLATFORMS, socialPlatform } from '@/components/portfolio/social-kit'
import { type ColItem, HomeCollection } from '@/components/studio/home-collection'
import { ObjectList } from '@/components/studio/field-array'
import type { Profile, ProfileCard as TCard, ProfileSkillGroup, ProfileSocial } from '@/db/schema'
import {
  createExperienceAction,
  createNoteAction,
  createProjectAction,
  removeExperienceAction,
  removeNoteAction,
  removeProjectAction,
  reorderExperiencesAction,
  reorderNotesAction,
  reorderProjectsAction,
  saveProfilePatchAction,
  setNoteFeaturedAction,
  setProjectFeaturedAction,
} from '@/lib/portfolio-actions'
import { pfPath } from '@/lib/seo'

type Stat = { value: string; label: string }
type ProjectPreview = ColItem & { titleKr: string | null; summary: string | null; logoUrl: string | null }
type NotePreview = ColItem & { category: string | null; readTime: string | null; excerpt: string | null }
type ExperiencePreview = ColItem & {
  company: string
  role: string | null
  context: string | null
  period: string | null
  length: string | null
}

// 노션/피그마식 인라인 편집기 — 공개 홈(/p/[username])과 동일 컴포넌트 위에서 그 자리 편집.
export function LiveProfileEditor({
  profile,
  avatarUrl: initialAvatarUrl,
  projects,
  experiences,
  notes,
}: {
  profile: Profile
  avatarUrl: string | null
  projects: ProjectPreview[]
  experiences: ExperiencePreview[]
  notes: NotePreview[]
}) {
  const { data, patch, status, error } = useAutoSave<Profile>(profile, (partial) =>
    saveProfilePatchAction(profile.id, partial as Parameters<typeof saveProfilePatchAction>[1]),
  )
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)

  const stats: Stat[] = (data.stats as Stat[] | null) ?? []
  const skills: ProfileSkillGroup[] = (data.skills as ProfileSkillGroup[] | null) ?? []
  const cards: TCard[] = (data.cards as TCard[] | null)?.length ? (data.cards as TCard[]) : DEFAULT_CARDS
  const social: ProfileSocial[] = (data.social as ProfileSocial[] | null)?.length
    ? (data.social as ProfileSocial[])
    : legacyToSocial(data)

  const [hTop, hBottom] = (data.headline || `${data.name}\n${data.title ?? ''}`).split('\n')
  const [ctaTop, ctaBottom] = (data.ctaTitle || "LET'S WORK\nTOGETHER").split('\n')
  const base = `/studio/p/${profile.id}`

  const card = (
    <ProfileCard
      profile={data}
      avatarUrl={avatarUrl}
      edit={{ name: { onCommit: (v) => patch({ name: v }), placeholder: '이름' }, bio: { onCommit: (v) => patch({ bio: v }), placeholder: '한 줄 소개', ariaLabel: '카드 소개' } }}
      avatarSlot={
        <AvatarUpload
          url={avatarUrl}
          alt={data.name}
          onUploaded={(id, url) => {
            setAvatarUrl(url)
            patch({ avatarId: id })
          }}
          onRemove={() => {
            setAvatarUrl(null)
            patch({ avatarId: null })
          }}
        />
      }
      socialSlot={<SocialEditor items={social} onChange={(next) => patch({ social: next }, true)} />}
    />
  )

  return (
    <div className="pf pb-24" style={{ '--pf-ac': data.accent } as React.CSSProperties}>
      <PortfolioColumns profile={data} avatarUrl={avatarUrl} card={card}>
        <Hero
          headTop={hTop ?? ''}
          headBottom={hBottom ?? ''}
          intro={data.intro ?? ''}
          edit={{
            headTop: { onCommit: (v) => patch({ headline: `${v}\n${hBottom ?? ''}` }), placeholder: 'HEADLINE', ariaLabel: '헤드라인 1줄' },
            headBottom: { onCommit: (v) => patch({ headline: `${hTop ?? ''}\n${v}` }), placeholder: 'LINE 2', ariaLabel: '헤드라인 2줄' },
            intro: { onCommit: (v) => patch({ intro: v }), placeholder: '히어로 소개 문단을 입력하세요', ariaLabel: '소개 본문' },
          }}
        />
        <StatList stats={stats} edit={{ onChange: (next) => patch({ stats: next }, true) }} />
        <ServiceCards cards={cards} base={base} edit={{ onChange: (next) => patch({ cards: next }, true) }} />

        <HomeCollection
          titleTop="RECENT"
          titleBottom="PROJECTS"
          items={projects}
          profileId={profile.id}
          manageHref={`${base}/projects`}
          manageLabel="전체 보기"
          addLabel="새 프로젝트"
          createAction={createProjectAction}
          editHref={(p) => `${base}/projects/${p.id}`}
          previewClassName="flex flex-col gap-3.5"
          actions={{ setFeatured: setProjectFeaturedAction, reorder: reorderProjectsAction, remove: removeProjectAction }}
          previewCard={(p) => (
            <HomeProjectRow
              key={p.id}
              item={{ id: p.id, title: p.title, titleKr: p.titleKr, summary: p.summary, slug: '', logoUrl: p.logoUrl }}
              href={`${base}/projects/${p.id}`}
            />
          )}
        />

        <HomeCollection
          titleTop="WORK"
          titleBottom="EXPERIENCE"
          items={experiences}
          profileId={profile.id}
          manageHref={`${base}/experience`}
          manageLabel="전체 보기"
          addLabel="새 경력"
          createAction={createExperienceAction}
          editHref={(e) => `${base}/experience/${e.id}`}
          previewClassName="flex flex-col gap-3.5"
          previewLimit={4}
          actions={{ reorder: reorderExperiencesAction, remove: removeExperienceAction }}
          previewCard={(e) => (
            <HomeExperienceRow
              key={e.id}
              item={{ id: e.id, company: e.company, role: e.role, context: e.context, period: e.period, length: e.length }}
              href={`${base}/experience/${e.id}`}
            />
          )}
        />

        <SkillGrid skills={skills} edit={{ onChange: (next) => patch({ skills: next }, true) }} />

        <HomeCollection
          titleTop="DEEP"
          titleBottom="DIVES"
          items={notes}
          profileId={profile.id}
          manageHref={`${base}/notes`}
          manageLabel="전체 글"
          addLabel="새 글"
          createAction={createNoteAction}
          editHref={(n) => `${base}/notes/${n.id}`}
          previewClassName="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4"
          actions={{ setFeatured: setNoteFeaturedAction, reorder: reorderNotesAction, remove: removeNoteAction }}
          previewCard={(n) => (
            <HomeNoteCard
              key={n.id}
              item={{ id: n.id, slug: '', category: n.category, readTime: n.readTime, title: n.title, excerpt: n.excerpt }}
              href={`${base}/notes/${n.id}`}
            />
          )}
        />

        <CtaSection
          ctaTop={ctaTop ?? ''}
          ctaBottom={ctaBottom ?? ''}
          ctaText={data.ctaText ?? ''}
          contactHref="#"
          edit={{
            headline: {
              top: { onCommit: (v) => patch({ ctaTitle: `${v}\n${ctaBottom ?? ''}` }), placeholder: "LET'S WORK", ariaLabel: 'CTA 1줄' },
              bottom: { onCommit: (v) => patch({ ctaTitle: `${ctaTop ?? ''}\n${v}` }), placeholder: 'TOGETHER', ariaLabel: 'CTA 2줄' },
            },
            text: { onCommit: (v) => patch({ ctaText: v }), placeholder: '채용·협업·외주 문의를 환영합니다.', ariaLabel: 'CTA 설명' },
          }}
        />
      </PortfolioColumns>

      {/* 푸터 (공개와 동일) */}
      <div className="mt-[clamp(40px,6vw,72px)]">
        <PortfolioFooter profile={data} />
      </div>

      {/* 세부 정보(속성) — 편집 전용 */}
      <div className="mx-auto w-full max-w-[1280px] px-[clamp(18px,5vw,64px)]">
        <details className="mt-12 rounded-2xl border border-white/[0.08] bg-[var(--pf-surface)]/40">
          <summary className="cursor-pointer select-none px-5 py-4 text-sm font-semibold text-[var(--pf-fg-dim)]">세부 정보 · 수상</summary>
          <div className="grid gap-5 border-t border-white/[0.07] px-5 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <PanelInput label="영문 이름" value={data.nameEn ?? ''} onSave={(v) => patch({ nameEn: v })} placeholder="GEONHO JO" />
              <PanelInput label="직함" value={data.title ?? ''} onSave={(v) => patch({ title: v })} placeholder="풀스택 개발자" />
              <PanelInput label="한 줄 소개 (tagline)" value={data.tagline ?? ''} onSave={(v) => patch({ tagline: v })} className="sm:col-span-2" />
              <PanelInput label="지역" value={data.location ?? ''} onSave={(v) => patch({ location: v })} />
              <PanelInput label="학력" value={data.education ?? ''} onSave={(v) => patch({ education: v })} />
              <PanelInput label="사업체" value={data.business ?? ''} onSave={(v) => patch({ business: v })} />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-[var(--pf-fg-faint)]">강조색</label>
              <div className="flex items-center gap-2">
                <input type="color" value={data.accent || '#F1531B'} onChange={(e) => patch({ accent: e.target.value }, true)} className="h-9 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
                <span className="pf-mono text-sm text-[var(--pf-fg-muted)]">{data.accent}</span>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-medium text-[var(--pf-fg-faint)]">수상 · 활동</label>
              <ObjectList
                initial={(data.awards as Record<string, string | string[]>[] | null) ?? []}
                onChange={(v) => patch({ awards: v } as Partial<Profile>, true)}
                fields={[
                  { key: 'title', label: '제목', placeholder: '○○ 해커톤 대상' },
                  { key: 'kind', label: '종류', placeholder: '수상' },
                ]}
                addLabel="항목 추가"
              />
            </div>
          </div>
        </details>
      </div>

      {/* 하단 툴바 (콘텐츠 폭 정렬, 화면 하단 sticky) */}
      <div className="sticky bottom-3 z-40 mt-8 px-[clamp(18px,5vw,64px)]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.1] bg-[rgba(20,20,20,0.94)] px-4 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <div className="flex items-center gap-2 text-[13px] text-[var(--pf-fg-muted)]">
            <span className="text-[var(--pf-fg-faint)]">hub.ghmate.com/p/</span>
            <input
              defaultValue={data.username}
              onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== data.username && patch({ username: e.target.value.trim() })}
              className="w-[120px] rounded-md border border-white/10 bg-transparent px-2 py-0.5 font-semibold text-[var(--pf-fg)] outline-none focus:border-[var(--pf-ac)]"
              aria-label="공개 주소"
            />
          </div>
          <div className="flex items-center gap-4">
            <SaveBadge status={status} error={error} />
            <a href={pfPath(data.username)} target="_blank" rel="noreferrer" className="text-[13px] text-[var(--pf-fg-muted)] hover:text-[var(--pf-ac)]">공개 페이지 ↗</a>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[var(--pf-fg-dim)]">
              <input type="checkbox" checked={data.status === 'published'} onChange={(e) => patch({ published: e.target.checked } as Partial<Profile>)} className="h-4 w-4 accent-[var(--pf-ac)]" />
              공개
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 세부 패널용 입력 (blur 시 자동저장) ───────────────────────────────
function PanelInput({ label, value, onSave, placeholder, className = '' }: { label: string; value: string; onSave: (v: string) => void; placeholder?: string; className?: string }) {
  const [v, setV] = useState(value)
  return (
    <div className={className}>
      <label className="mb-1.5 block text-[11px] font-medium text-[var(--pf-fg-faint)]">{label}</label>
      <input value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} onBlur={() => v.trim() !== (value ?? '').trim() && onSave(v)} className="w-full rounded-lg border border-white/10 bg-[var(--pf-surface)] px-3 py-2 text-sm text-[var(--pf-fg)] outline-none transition-colors focus:border-[var(--pf-ac)] placeholder:text-[var(--pf-fg-faint)]" />
    </div>
  )
}

// ── 흰 카드 아바타 인라인 업로드 ──────────────────────────────────────
function AvatarUpload({ url, alt, onUploaded, onRemove }: { url: string | null; alt: string; onUploaded: (id: number, url: string) => void; onRemove: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('alt', alt)
      const res = await fetch('/api/v1/media', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('업로드 실패')
      const d = await res.json()
      onUploaded(d.id, d.url)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="group relative z-1 block aspect-[240/284] w-[240px] max-w-full overflow-hidden rounded-[16px] bg-[linear-gradient(180deg,#a62602,#ce4404)]">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[#999]">
          <ImagePlus size={28} />
        </div>
      )}
      <button type="button" onClick={() => inputRef.current?.click()} className="absolute inset-0 flex items-center justify-center bg-black/0 text-sm font-semibold text-white opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
        {busy ? <Loader2 size={20} className="animate-spin" /> : url ? '사진 변경' : '사진 추가'}
      </button>
      {url && !busy && (
        <button type="button" onClick={onRemove} className="absolute right-2 top-2 z-10 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
          제거
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
    </div>
  )
}

// ── 연락처/SNS 편집기 (플랫폼 선택형) ─────────────────────────────────
function SocialEditor({ items, onChange }: { items: ProfileSocial[]; onChange: (next: ProfileSocial[]) => void }) {
  const [editing, setEditing] = useState(false)

  if (!editing) {
    return (
      <div className="mt-[18px] flex flex-col items-center gap-3">
        {items.length > 0 && (
          <div className="flex flex-wrap justify-center gap-5 text-[var(--pf-ac)]">
            {items.map((c, i) => {
              const Icon = socialPlatform(c.kind).icon
              return <Icon key={i} size={21} strokeWidth={1.7} />
            })}
          </div>
        )}
        <button type="button" onClick={() => setEditing(true)} className="text-[12px] font-semibold text-[#9a9a9a] transition-colors hover:text-[var(--pf-ac)]">
          {items.length ? '연락처 편집' : '+ 연락처 추가'}
        </button>
      </div>
    )
  }

  return (
    <div className="mt-[18px] w-full space-y-2 text-left">
      {items.map((c, i) => (
        <div key={i} className="flex items-center gap-1.5 rounded-lg border border-black/10 bg-[#F6F6F6] px-2 py-1.5">
          <select
            value={c.kind}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, kind: e.target.value, label: socialPlatform(e.target.value).label } : x)))}
            className="shrink-0 bg-transparent text-[12px] font-semibold text-[#101010] outline-none"
          >
            {SOCIAL_PLATFORMS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <input
            value={c.url}
            placeholder={socialPlatform(c.kind).placeholder}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-[#101010] outline-none placeholder:text-[#b5b5b5]"
          />
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="삭제" className="text-[#bbb] hover:text-red-500">
            <X size={14} />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { kind: 'email', label: '이메일', url: '' }])} className="w-full rounded-lg border border-dashed border-black/15 py-1.5 text-[12px] font-semibold text-[#777] transition-colors hover:border-[var(--pf-ac)] hover:text-[var(--pf-ac)]">
        + SNS · 연락처 추가
      </button>
      <button type="button" onClick={() => setEditing(false)} className="w-full rounded-lg bg-[#101010] py-2 text-[12px] font-semibold text-white hover:bg-[#222]">
        완료
      </button>
    </div>
  )
}
