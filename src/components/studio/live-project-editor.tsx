'use client'

import { useState } from 'react'
import { ProjectDetailView, type RelatedNote } from '@/components/portfolio/sections/project-detail-view'
import { useAutoSave } from '@/components/portfolio/sections/edit-controls'
import { DetailEditorFrame, SettingInput, SettingsPanel } from '@/components/studio/detail-editor-frame'
import type { Profile, Project } from '@/db/schema'
import { saveProjectPatchAction } from '@/lib/portfolio-actions'
import { pfPath } from '@/lib/seo'

export function LiveProjectEditor({
  profile,
  avatarUrl,
  project,
  coverUrl: c0,
  logoUrl: l0,
  sectionMediaUrls,
  noteOptions,
}: {
  profile: Profile
  avatarUrl: string | null
  project: Project
  coverUrl: string | null
  logoUrl: string | null
  sectionMediaUrls: Record<number, string>
  noteOptions: RelatedNote[]
}) {
  const { data, patch, status, error } = useAutoSave<Project>(project, (p) =>
    saveProjectPatchAction(project.id, p as Parameters<typeof saveProjectPatchAction>[1]),
  )
  const [coverUrl, setCoverUrl] = useState(c0)
  const [logoUrl, setLogoUrl] = useState(l0)
  const base = `/studio/p/${profile.id}`
  const set = (partial: Partial<Project>, debounce = false) => patch(partial, debounce)

  return (
    <DetailEditorFrame
      profile={profile}
      avatarUrl={avatarUrl}
      backHref={`${base}/projects`}
      backLabel="프로젝트 목록"
      publicHref={data.status === 'published' ? pfPath(profile.username, `/projects/${data.slug}`) : undefined}
      status={status}
      error={error}
      settings={
        <SettingsPanel>
          <div className="grid gap-4 sm:grid-cols-2">
            <SettingInput label="주소(slug)" value={data.slug} onSave={(v) => set({ slug: v })} />
            <SettingInput label="정렬 순서" value={String(data.order)} type="number" onSave={(v) => set({ order: Number(v) || 0 } as Partial<Project>)} />
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--pf-fg-dim)]">
              <input type="checkbox" checked={data.featured} onChange={(e) => set({ featured: e.target.checked })} className="h-4 w-4 accent-[var(--pf-ac)]" />
              대표 작업(홈 노출)
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--pf-fg-dim)]">
              <input type="checkbox" checked={data.status === 'published'} onChange={(e) => set({ published: e.target.checked } as Partial<Project>)} className="h-4 w-4 accent-[var(--pf-ac)]" />
              공개(published)
            </label>
          </div>
        </SettingsPanel>
      }
    >
      <ProjectDetailView
        data={{
          title: data.title,
          titleKr: data.titleKr,
          tag: data.tag,
          year: data.year,
          role: data.role,
          url: data.url,
          summary: data.summary,
          metrics: data.metrics ?? [],
          sections: data.sections ?? [],
          stack: data.stack ?? [],
          coverUrl,
          logoUrl,
          sectionMediaUrls,
          relatedNotes: [],
        }}
        edit={{
          field: (key, ph) => ({ onCommit: (v) => set({ [key]: v } as Partial<Project>), placeholder: ph, ariaLabel: key }),
          cover: {
            url: coverUrl,
            onUploaded: (id, url) => {
              setCoverUrl(url)
              set({ coverId: id })
            },
            onRemove: () => {
              setCoverUrl(null)
              set({ coverId: null })
            },
          },
          logo: {
            url: logoUrl,
            onUploaded: (id, url) => {
              setLogoUrl(url)
              set({ logoId: id })
            },
            onRemove: () => {
              setLogoUrl(null)
              set({ logoId: null })
            },
          },
          onMetrics: (n) => set({ metrics: n }, true),
          onSections: (n) => set({ sections: n }, true),
          onStack: (n) => set({ stack: n }, true),
          related: {
            options: noteOptions,
            selectedIds: data.relatedNoteIds ?? [],
            onChange: (ids) => set({ relatedNoteIds: ids } as Partial<Project>, true),
          },
        }}
      />
    </DetailEditorFrame>
  )
}
