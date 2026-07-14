import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/studio/auth-forms'
import { getCurrentUser } from '@/lib/auth'

export const metadata = { title: '로그인 — Studio' }

export default async function LoginPage() {
  // 실제 사용자 존재까지 확인(stale 세션 무한 리다이렉트 방지).
  if (await getCurrentUser()) redirect('/studio')
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-16">
      <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--pf-fg-faint)]">
        HUBGMATE STUDIO
      </div>
      <h1 className="pf-display m-0 mb-3 text-[clamp(32px,6vw,52px)] !leading-[0.95] text-[var(--pf-fg)]">
        다시 오셨네요
      </h1>
      <p className="mb-8 text-[15px] leading-[1.6] text-[var(--pf-fg-muted)]">아이디와 비밀번호로 로그인하세요.</p>
      <LoginForm />
      <p className="mt-6 text-sm text-[var(--pf-fg-muted)]">
        계정이 없나요?{' '}
        <Link href="/studio/signup" className="font-semibold text-[var(--pf-ac)] hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  )
}
