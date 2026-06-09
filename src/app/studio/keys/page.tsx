import { ApiKeyForm } from '@/components/studio/api-key-form'
import { requireUser } from '@/lib/auth'
import { revokeApiKeyAction } from '@/lib/studio-actions'
import { listApiKeys } from '@/lib/studio'
import { SITE_URL } from '@/lib/seo'

function fmt(d?: Date | null) {
  return d ? d.toISOString().slice(0, 16).replace('T', ' ') : '—'
}

export default async function ApiKeysPage() {
  await requireUser()
  const keys = await listApiKeys()

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <h1 className="text-2xl font-bold">API 키 (에이전트 발행)</h1>
      <p className="mt-1 text-sm text-[var(--fg-muted)]">
        AI 에이전트가 <code>POST {SITE_URL}/api/v1/posts</code> 등으로 자동 발행할 때 쓰는 키입니다.
      </p>

      <div className="mt-6">
        <ApiKeyForm />
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-sm font-semibold text-[var(--fg-muted)]">발급된 키</h2>
        {keys.length === 0 ? (
          <p className="text-sm text-[var(--fg-muted)]">아직 발급된 키가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-[var(--line)] rounded-xl border border-[var(--line)]">
            {keys.map((k) => (
              <li key={k.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <code className="font-mono text-xs text-[var(--fg-muted)]">{k.prefix}…</code>
                <span className="flex-1 font-medium">{k.name}</span>
                <span className="text-xs text-[var(--fg-muted)]">생성 {fmt(k.createdAt)}</span>
                {k.revokedAt ? (
                  <span className="rounded-full bg-[var(--line)] px-2 py-0.5 text-xs text-[var(--fg-muted)]">폐기됨</span>
                ) : (
                  <form action={revokeApiKeyAction}>
                    <input type="hidden" name="id" value={k.id} />
                    <button type="submit" className="rounded-lg px-2 py-1 text-xs text-[var(--fg-muted)] hover:text-red-500">
                      폐기
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
