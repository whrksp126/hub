'use client'

import { useActionState } from 'react'
import { loginAction, setupAction } from '@/lib/studio-actions'

const inputCls =
  'w-full rounded-lg border border-[var(--line)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]'
const btnCls =
  'w-full rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50'

export function LoginForm() {
  const [error, action, pending] = useActionState(loginAction, null)
  return (
    <form action={action} className="space-y-3">
      <input name="email" type="text" placeholder="아이디" autoComplete="username" className={inputCls} />
      <input
        name="password"
        type="password"
        placeholder="비밀번호"
        autoComplete="current-password"
        className={inputCls}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button type="submit" disabled={pending} className={btnCls}>
        {pending ? '로그인 중…' : '로그인'}
      </button>
    </form>
  )
}

export function SetupForm() {
  const [error, action, pending] = useActionState(setupAction, null)
  return (
    <form action={action} className="space-y-3">
      <input name="name" type="text" placeholder="이름(선택)" className={inputCls} />
      <input name="email" type="email" placeholder="이메일" autoComplete="username" className={inputCls} />
      <input
        name="password"
        type="password"
        placeholder="비밀번호 (8자 이상)"
        autoComplete="new-password"
        className={inputCls}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button type="submit" disabled={pending} className={btnCls}>
        {pending ? '생성 중…' : '관리자 계정 만들기'}
      </button>
    </form>
  )
}
