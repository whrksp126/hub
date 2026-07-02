'use client'

import { useActionState } from 'react'
import { loginAction, signupAction } from '@/lib/studio-actions'

const inputCls =
  'w-full rounded-xl border border-white/10 bg-[var(--pf-surface)] px-3.5 py-3 text-sm text-[var(--pf-fg)] outline-none transition-colors focus:border-[var(--pf-ac)] placeholder:text-[var(--pf-fg-faint)]'
const btnCls =
  'w-full rounded-full bg-[var(--pf-ac)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50'

export function LoginForm() {
  const [error, action, pending] = useActionState(loginAction, null)
  return (
    <form action={action} className="space-y-3">
      <input name="username" type="text" placeholder="아이디" autoComplete="username" className={inputCls} />
      <input
        name="password"
        type="password"
        placeholder="비밀번호"
        autoComplete="current-password"
        className={inputCls}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={pending} className={btnCls}>
        {pending ? '로그인 중…' : '로그인'}
      </button>
    </form>
  )
}

export function SignupForm() {
  const [error, action, pending] = useActionState(signupAction, null)
  return (
    <form action={action} className="space-y-3">
      <input name="name" type="text" placeholder="이름(선택)" className={inputCls} />
      <input name="username" type="text" placeholder="아이디 (= 포트폴리오 주소)" autoComplete="username" className={inputCls} />
      <input
        name="password"
        type="password"
        placeholder="비밀번호 (8자 이상)"
        autoComplete="new-password"
        className={inputCls}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={pending} className={btnCls}>
        {pending ? '가입 중…' : '회원가입'}
      </button>
    </form>
  )
}
