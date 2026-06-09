import { redirect } from 'next/navigation'
import { SetupForm } from '@/components/studio/auth-forms'
import { hasAnyUser } from '@/lib/auth'

export default async function SetupPage() {
  if (await hasAnyUser()) redirect('/studio/login')
  return (
    <div className="mx-auto max-w-sm px-5 py-20">
      <h1 className="mb-1 text-2xl font-bold">최초 설정</h1>
      <p className="mb-6 text-sm text-[var(--fg-muted)]">
        관리자 계정을 만듭니다. 이후 이 화면은 비활성화됩니다.
      </p>
      <SetupForm />
    </div>
  )
}
