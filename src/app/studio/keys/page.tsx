import Link from 'next/link'
import { ApiKeyForm } from '@/components/studio/api-key-form'
import { requireUser } from '@/lib/auth'
import { listMyApiKeys } from '@/lib/studio'
import { revokeApiKeyAction } from '@/lib/studio-actions'

export const metadata = { title: 'API 키 — Studio' }

function fmt(d?: Date | null) {
  return d ? d.toISOString().slice(0, 16).replace('T', ' ') : '—'
}

export default async function ApiKeysPage() {
  const user = await requireUser()
  const keys = await listMyApiKeys(user.id)

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <Link href="/studio" className="text-sm text-[var(--pf-fg-muted)] hover:text-[var(--pf-fg)]">
        ← 대시보드
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-[var(--pf-fg)]">내 API 키</h1>
      <p className="mt-1 text-sm text-[var(--pf-fg-muted)]">
        내 계정의 포트폴리오를 AI 에이전트가 프로그램으로 발행할 때 쓰는 키입니다. REST 호출 시{' '}
        <code className="pf-mono text-[var(--pf-fg-dim)]">Authorization: Bearer &lt;키&gt;</code> 헤더로 인증합니다.
      </p>

      <div className="mt-6">
        <ApiKeyForm />
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-sm font-semibold text-[var(--pf-fg-faint)]">발급된 키</h2>
        {keys.length === 0 ? (
          <p className="text-sm text-[var(--pf-fg-muted)]">아직 발급된 키가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-white/[0.07] rounded-xl border border-white/[0.07]">
            {keys.map((k) => (
              <li key={k.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <code className="pf-mono text-xs text-[var(--pf-fg-faint)]">{k.prefix}…</code>
                <span className="flex-1 font-medium text-[var(--pf-fg)]">{k.name}</span>
                <span className="text-xs text-[var(--pf-fg-faint)]">생성 {fmt(k.createdAt)}</span>
                {k.revokedAt ? (
                  <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-xs text-[var(--pf-fg-faint)]">폐기됨</span>
                ) : (
                  <form action={revokeApiKeyAction}>
                    <input type="hidden" name="id" value={k.id} />
                    <button type="submit" className="rounded-lg px-2 py-1 text-xs text-[var(--pf-fg-faint)] hover:text-red-400">
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
