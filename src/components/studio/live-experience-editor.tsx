'use client'

import { useState } from 'react'
import { ExperienceCardView } from '@/components/portfolio/sections/experience-card-view'
import { useAutoSave } from '@/components/portfolio/sections/edit-controls'
import { DetailEditorFrame, SettingInput, SettingsPanel } from '@/components/studio/detail-editor-frame'
import type { Experience, Profile } from '@/db/schema'
import { saveExperiencePatchAction } from '@/lib/portfolio-actions'
import { pfPath } from '@/lib/seo'

export function LiveExperienceEditor({
  profile,
  avatarUrl,
  experience,
  logoUrl: l0,
  coverUrl: c0,
  mediaUrls,
}: {
  profile: Profile
  avatarUrl: string | null
  experience: Experience
  logoUrl: string | null
  coverUrl: string | null
  mediaUrls: Record<number, string>
}) {
  const { data, patch, status, error } = useAutoSave<Experience>(experience, (p) =>
    saveExperiencePatchAction(experience.id, p as Parameters<typeof saveExperiencePatchAction>[1]),
  )
  const [logoUrl, setLogoUrl] = useState(l0)
  const [coverUrl, setCoverUrl] = useState(c0)
  const base = `/studio/p/${profile.id}`
  const set = (partial: Partial<Experience>, debounce = false) => patch(partial, debounce)

  return (
    <DetailEditorFrame
      profile={profile}
      avatarUrl={avatarUrl}
      backHref={`${base}/experience`}
      backLabel="경력 목록"
      publicHref={pfPath(profile.username, '/experience')}
      status={status}
      error={error}
      settings={
        <SettingsPanel>
          <SettingInput label="정렬 순서" value={String(data.order)} type="number" onSave={(v) => set({ order: Number(v) || 0 } as Partial<Experience>)} className="sm:max-w-[200px]" />
        </SettingsPanel>
      }
    >
      <ExperienceCardView
        data={{
          company: data.company,
          role: data.role,
          period: data.period,
          length: data.length,
          context: data.context,
          current: data.current,
          points: data.points ?? [],
          stack: data.stack ?? [],
          media: data.media ?? [],
          mediaUrls,
          logoUrl,
          coverUrl,
        }}
        edit={{
          field: (key, ph) => ({ onCommit: (v) => set({ [key]: v } as Partial<Experience>), placeholder: ph, ariaLabel: key }),
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
          current: data.current,
          onCurrent: (v) => set({ current: v }),
          onPoints: (n) => set({ points: n }, true),
          onStack: (n) => set({ stack: n }, true),
          onMedia: (n) => set({ media: n }, true),
        }}
      />
    </DetailEditorFrame>
  )
}
