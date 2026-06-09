import Link from 'next/link'
import { CONTENT_TYPE_META } from '@/lib/content-types'
import { requireUser } from '@/lib/auth'
import { deleteDocAction } from '@/lib/studio-actions'
import { listStudioItems } from '@/lib/studio'

export default async function StudioDashboard() {
  await requireUser()
  const items = await listStudioItems()

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">내 콘텐츠</h1>
        <Link
          href="/studio/new"
          className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          + 새로 만들기
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] p-12 text-center text-sm text-[var(--fg-muted)]">
          아직 콘텐츠가 없습니다. “새로 만들기”로 시작하세요.
        </div>
      ) : (
        <ul className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)]">
          {items.map((it) => (
            <li key={`${it.type}-${it.id}`} className="flex items-center gap-3 px-4 py-3">
              <span className="w-20 shrink-0 text-xs text-[var(--fg-muted)]">
                {CONTENT_TYPE_META[it.type].label}
              </span>
              <Link
                href={`/studio/${it.type}/${it.id}`}
                className="flex-1 truncate font-medium hover:text-[var(--brand)]"
              >
                {it.title}
              </Link>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                  it.status === 'published'
                    ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                    : 'bg-[var(--line)] text-[var(--fg-muted)]'
                }`}
              >
                {it.status === 'published' ? '발행됨' : '초안'}
              </span>
              <form action={deleteDocAction}>
                <input type="hidden" name="type" value={it.type} />
                <input type="hidden" name="id" value={it.id} />
                <button
                  type="submit"
                  className="shrink-0 rounded-lg px-2 py-1 text-xs text-[var(--fg-muted)] hover:text-red-500"
                >
                  삭제
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
