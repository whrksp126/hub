'use client'

import { useActionState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { createApiKeyAction } from '@/lib/studio-actions'

export function ApiKeyForm() {
  const [state, action, pending] = useActionState(createApiKeyAction, null)
  return (
    <div>
      <form action={action} className="flex flex-wrap gap-2">
        <input
          name="name"
          placeholder="키 이름 (예: blog-agent)"
          className="flex-1 rounded-lg border border-[var(--line)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? '생성 중…' : '키 생성'}
        </button>
      </form>
      {state?.error && <p className="mt-2 text-sm text-red-500">{state.error}</p>}
      {state?.key && (
        <div className="mt-3 rounded-lg border border-[var(--brand)] bg-[var(--brand)]/10 p-4">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0" />이 키는 지금 한 번만 보입니다. 안전한 곳에 저장하세요.
          </p>
          <code className="mt-2 block break-all rounded bg-[var(--bg)] px-3 py-2 font-mono text-sm">
            {state.key}
          </code>
          <p className="mt-2 text-xs text-[var(--fg-muted)]">
            사용: <code>Authorization: Bearer {state.key.slice(0, 11)}…</code>
          </p>
        </div>
      )}
    </div>
  )
}
