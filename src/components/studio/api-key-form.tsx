'use client'

import { AlertTriangle } from 'lucide-react'
import { useActionState } from 'react'
import { createApiKeyAction } from '@/lib/studio-actions'

export function ApiKeyForm() {
  const [state, action, pending] = useActionState(createApiKeyAction, null)
  return (
    <div>
      <form action={action} className="flex flex-wrap gap-2">
        <input
          name="name"
          placeholder="키 이름 (예: portfolio-agent)"
          className="flex-1 rounded-xl border border-white/10 bg-[var(--pf-surface)] px-3.5 py-2.5 text-sm text-[var(--pf-fg)] outline-none transition-colors focus:border-[var(--pf-ac)] placeholder:text-[var(--pf-fg-faint)]"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[var(--pf-ac)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {pending ? '생성 중…' : '키 생성'}
        </button>
      </form>
      {state?.error && <p className="mt-2 text-sm text-red-400">{state.error}</p>}
      {state?.key && (
        <div className="mt-3 rounded-xl border border-[var(--pf-ac)]/40 bg-[var(--pf-ac)]/10 p-4">
          <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--pf-fg)]">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--pf-ac)]" />이 키는 지금 한 번만 보입니다. 안전한 곳에 저장하세요.
          </p>
          <code className="pf-mono mt-2 block break-all rounded-lg bg-[#0E0E0E] px-3 py-2 text-sm text-[var(--pf-fg)]">
            {state.key}
          </code>
        </div>
      )}
    </div>
  )
}
