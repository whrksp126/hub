import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AutoPrint } from '@/components/portfolio/print/auto-print'
import '@/components/portfolio/print/print.css'
import { PrintDocument, type PrintInclude, type PrintNote } from '@/components/portfolio/print/print-document'
import {
  getExperiencesByProfile,
  getMediaUrl,
  getMediaUrls,
  getNotesByProfile,
  getProfileByUsername,
  getProjectsByProfile,
} from '@/db/queries'
import type { NoteBlock } from '@/db/schema'

// 인쇄(PDF) 문서 — 발행된 콘텐츠만. 검색엔진에는 노출하지 않는다(정식 페이지가 canonical).
export const metadata: Metadata = { robots: { index: false, follow: false } }

type Params = { params: Promise<{ username: string }>; searchParams: Promise<Record<string, string | undefined>> }

const ALL_SECTIONS = ['intro', 'stats', 'skills', 'awards', 'experience', 'projects', 'notes'] as const

export default async function PortfolioPrint({ params, searchParams }: Params) {
  const { username } = await params
  const sp = await searchParams
  const profile = await getProfileByUsername(username)
  if (!profile) notFound()

  // s 파라미터 없으면 전부 포함. 있으면 해당 키만.
  const sSet = sp.s != null ? new Set(sp.s.split(',').filter(Boolean)) : null
  const on = (k: (typeof ALL_SECTIONS)[number]) => (sSet ? sSet.has(k) : true)
  const include: PrintInclude = {
    intro: on('intro'),
    stats: on('stats'),
    skills: on('skills'),
    awards: on('awards'),
    experience: on('experience'),
    projects: on('projects'),
    notes: on('notes'),
  }

  // 개별 선택: p=slug,slug / n=slug,slug (없으면 전부)
  const pSet = sp.p != null ? new Set(sp.p.split(',').filter(Boolean)) : null
  const nSet = sp.n != null ? new Set(sp.n.split(',').filter(Boolean)) : null

  const [allProjects, allNotes, experiences] = await Promise.all([
    include.projects ? getProjectsByProfile(profile.id) : Promise.resolve([]),
    include.notes ? getNotesByProfile(profile.id) : Promise.resolve([]),
    include.experience ? getExperiencesByProfile(profile.id) : Promise.resolve([]),
  ])

  const projects = pSet ? allProjects.filter((p) => pSet.has(p.slug)) : allProjects
  const notesRaw = nSet ? allNotes.filter((n) => nSet.has(n.slug)) : allNotes

  const notes: PrintNote[] = notesRaw.map((n) => ({
    id: n.id,
    slug: n.slug,
    title: n.title,
    excerpt: n.excerpt,
    category: n.category,
    content: (n.content as NoteBlock[] | null) ?? [],
  }))

  // 필요한 모든 미디어 id 수집(아바타 + 프로젝트 섹션 이미지 + 글 이미지/영상 포스터).
  const mediaIds = new Set<number>()
  for (const p of projects) {
    for (const s of p.sections ?? []) {
      for (const m of s.media ?? []) {
        if (m.kind === 'image' && m.mediaId) mediaIds.add(m.mediaId)
      }
    }
  }
  for (const n of notes) {
    for (const b of n.content) {
      if ((b.type === 'image' || b.type === 'video') && 'mediaId' in b && b.mediaId) mediaIds.add(b.mediaId)
    }
  }

  const [urls, avatarUrl] = await Promise.all([getMediaUrls([...mediaIds]), getMediaUrl(profile.avatarId)])

  return (
    <div className="pfp-screen-bg">
      <AutoPrint auto={sp.preview == null} />
      <PrintDocument
        profile={profile}
        include={include}
        experiences={experiences}
        projects={projects}
        notes={notes}
        urls={urls}
        avatarUrl={avatarUrl}
      />
    </div>
  )
}
