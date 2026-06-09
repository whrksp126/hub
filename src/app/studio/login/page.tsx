import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/studio/auth-forms'
import { getSession, hasAnyUser } from '@/lib/auth'

export default async function LoginPage() {
  if (await getSession()) redirect('/studio')
  if (!(await hasAnyUser())) redirect('/studio/setup')
  return (
    <div className="mx-auto max-w-sm px-5 py-20">
      <h1 className="mb-1 text-2xl font-bold">로그인</h1>
      <p className="mb-6 text-sm text-[var(--fg-muted)]">관리자만 접근할 수 있습니다.</p>
      <LoginForm />
    </div>
  )
}
