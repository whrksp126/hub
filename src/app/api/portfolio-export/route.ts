import { NextResponse } from 'next/server'
import {
  getExperiencesByProfile,
  getNotesByProfile,
  getProfileByUsername,
  getProjectsByProfile,
} from '@/db/queries'

// PDF 내보내기 다이얼로그가 사용할 "담을 수 있는 콘텐츠" 목록.
// 발행(published)된 콘텐츠만 노출 — 공개 print 라우트와 동일한 범위.
export async function GET(req: Request) {
  const u = new URL(req.url).searchParams.get('u')
  if (!u) return NextResponse.json({ error: 'missing username' }, { status: 400 })

  const profile = await getProfileByUsername(u)
  if (!profile) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const [projects, notes, experiences] = await Promise.all([
    getProjectsByProfile(profile.id),
    getNotesByProfile(profile.id),
    getExperiencesByProfile(profile.id),
  ])

  return NextResponse.json({
    name: profile.name,
    hasStats: (profile.stats?.length ?? 0) > 0,
    hasSkills: (profile.skills?.length ?? 0) > 0,
    hasAwards: (profile.awards?.length ?? 0) > 0,
    hasExperience: experiences.length > 0,
    projects: projects.map((p) => ({ slug: p.slug, title: p.titleKr || p.title })),
    notes: notes.map((n) => ({ slug: n.slug, title: n.title })),
  })
}
