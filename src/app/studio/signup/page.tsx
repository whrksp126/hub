import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SignupForm } from '@/components/studio/auth-forms'
import { getCurrentUser } from '@/lib/auth'

export const metadata = { title: '회원가입 — Studio' }

export default async function SignupPage() {
  if (await getCurrentUser()) redirect('/studio')
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-16">
      <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--pf-fg-faint)]">
        GHMATE STUDIO
      </div>
      <h1 className="pf-display m-0 mb-3 text-[clamp(32px,6vw,52px)] !leading-[0.95] text-[var(--pf-fg)]">
        포트폴리오를
        <br />
        시작해요
      </h1>
      <p className="mb-8 text-[15px] leading-[1.6] text-[var(--pf-fg-muted)]">
        계정을 만들면 나만의 포트폴리오 주소(<span className="pf-mono text-[var(--pf-fg-dim)]">hub.ghmate.com/아이디</span>)가
        생기고, 사진·프로젝트·경력을 직접 편집할 수 있습니다.
      </p>
      <SignupForm />
      <p className="mt-6 text-sm text-[var(--pf-fg-muted)]">
        이미 계정이 있나요?{' '}
        <Link href="/studio/login" className="font-semibold text-[var(--pf-ac)] hover:underline">
          로그인
        </Link>
      </p>
    </div>
  )
}
