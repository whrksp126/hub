import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { createProfileAction, deleteProfileAction } from '@/lib/portfolio-actions'
import { deleteUserAction, markNotificationsReadAction, setUserRoleAction } from '@/lib/studio-actions'
import { countAll, getAdminOverview, getMyProfiles } from '@/lib/portfolio-studio'
import { getMyNotifications } from '@/lib/studio'
import { pfPath } from '@/lib/seo'

const cardCls = 'rounded-2xl border border-white/[0.07] bg-[var(--pf-surface)] p-4 transition-colors hover:border-[var(--pf-ac)]'
const primaryBtn = 'rounded-full bg-[var(--pf-ac)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110'
const ghostBtn =
  'rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-[var(--pf-fg-dim)] transition-colors hover:border-[var(--pf-ac)] hover:text-[var(--pf-fg)]'

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs ${
        published ? 'bg-[var(--pf-lime-2)]/15 text-[var(--pf-lime-2)]' : 'bg-white/[0.08] text-[var(--pf-fg-faint)]'
      }`}
    >
      {published ? '공개' : '초안'}
    </span>
  )
}

function fmtDate(d?: Date | null) {
  return d ? d.toISOString().slice(0, 10) : '—'
}

// 알림: 에이전트 자율 발행 등. 안 읽은 건 강조.
function NotificationsPanel({ items }: { items: Awaited<ReturnType<typeof getMyNotifications>> }) {
  if (items.length === 0) return null
  const unread = items.filter((n) => !n.readAt).length
  return (
    <div className="mt-6 rounded-2xl border border-white/[0.07] bg-[var(--pf-surface)] p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--pf-fg-faint)]">
          알림
          {unread > 0 && (
            <span className="rounded-full bg-[var(--pf-ac)] px-1.5 py-0.5 text-[11px] font-bold text-white">{unread}</span>
          )}
        </h2>
        {unread > 0 && (
          <form action={markNotificationsReadAction}>
            <button type="submit" className="text-xs text-[var(--pf-fg-faint)] hover:text-[var(--pf-fg)]">
              모두 읽음
            </button>
          </form>
        )}
      </div>
      <ul className="flex flex-col gap-1">
        {items.map((n) => {
          const body = (
            <span className="flex items-center gap-2">
              {!n.readAt && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--pf-ac)]" />}
              <span className={n.readAt ? 'text-[var(--pf-fg-muted)]' : 'text-[var(--pf-fg)]'}>{n.message}</span>
              <span className="ml-auto shrink-0 text-[11px] text-[var(--pf-fg-fainter)]">{fmtDate(n.createdAt)}</span>
            </span>
          )
          return (
            <li key={n.id} className="rounded-lg px-2 py-1.5 text-sm hover:bg-white/[0.03]">
              {n.href ? (
                <Link href={n.href} className="block">
                  {body}
                </Link>
              ) : (
                body
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// 내 포트폴리오 카드(여러 개 관리).
function MyPortfolios({ profiles }: { profiles: Awaited<ReturnType<typeof getMyProfiles>> }) {
  return (
    <>
      <div className="mb-3 mt-10 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--pf-fg-faint)]">내 포트폴리오</h2>
        <form action={createProfileAction}>
          <button type="submit" className={primaryBtn}>+ 새 포트폴리오</button>
        </form>
      </div>
      {profiles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.12] p-10 text-center text-sm text-[var(--pf-fg-muted)]">
          아직 포트폴리오가 없습니다. “+ 새 포트폴리오”로 시작하세요.
        </div>
      ) : (
        <div className="grid gap-3">
          {profiles.map((p) => (
            <div key={p.id} className={`${cardCls} flex flex-wrap items-center gap-3`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[var(--pf-fg)]">{p.name}</span>
                  <StatusBadge published={p.status === 'published'} />
                </div>
                <div className="pf-mono mt-0.5 text-xs text-[var(--pf-fg-faint)]">hub.ghmate.com/p/{p.username}</div>
              </div>
              <Link
                href={`/studio/p/${p.id}`}
                className="rounded-full border border-[var(--pf-ac)]/45 px-4 py-2 text-sm font-semibold text-[var(--pf-ac)] transition-colors hover:bg-[var(--pf-ac)]/10"
              >
                편집
              </Link>
              {p.status === 'published' && (
                <Link href={pfPath(p.username)} target="_blank" className={ghostBtn}>보기 ↗</Link>
              )}
              <form action={deleteProfileAction}>
                <input type="hidden" name="id" value={p.id} />
                <button type="submit" className="rounded-lg px-2 py-1 text-xs text-[var(--pf-fg-faint)] hover:text-red-400">
                  삭제
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default async function StudioDashboard() {
  const user = await requireUser()
  const [myProfiles, notifs] = await Promise.all([getMyProfiles(user.id), getMyNotifications(user.id)])
  const isAdmin = user.role === 'admin'

  // ── 운영자: 관리 대시보드 ──────────────────────────────────────────
  if (isAdmin) {
    const [{ users, profiles }, counts] = await Promise.all([getAdminOverview(), countAll()])
    const ownerName = new Map(users.map((u) => [u.id, u.username]))

    return (
      <div className="mx-auto max-w-4xl px-5 py-8">
        <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--pf-fg-faint)]">ADMIN</div>
        <h1 className="text-2xl font-bold text-[var(--pf-fg)]">관리자 대시보드</h1>
        <p className="mt-1 text-sm text-[var(--pf-fg-muted)]">{user.username} · 플랫폼 전체를 관리합니다.</p>

        <NotificationsPanel items={notifs} />

        <div className="mt-6 grid grid-cols-2 gap-3">
          {[
            { k: '사용자', v: counts.users },
            { k: '포트폴리오', v: counts.profiles },
          ].map((c) => (
            <div key={c.k} className="rounded-2xl border border-white/[0.07] bg-[var(--pf-surface)] p-5">
              <div className="text-2xl font-extrabold text-[var(--pf-fg)]">{c.v}</div>
              <div className="mt-1 text-xs text-[var(--pf-fg-faint)]">{c.k}</div>
            </div>
          ))}
        </div>

        <MyPortfolios profiles={myProfiles} />

        {/* 전체 포트폴리오 */}
        <h2 className="mb-3 mt-10 text-sm font-semibold text-[var(--pf-fg-faint)]">전체 포트폴리오</h2>
        <ul className="divide-y divide-white/[0.07] rounded-2xl border border-white/[0.07]">
          {profiles.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
              <span className="font-medium text-[var(--pf-fg)]">{p.name}</span>
              <StatusBadge published={p.status === 'published'} />
              <span className="text-xs text-[var(--pf-fg-faint)]">
                소유자: {p.userId != null ? (ownerName.get(p.userId) ?? '—') : '없음'}
              </span>
              <div className="flex-1" />
              <Link href={pfPath(p.username)} target="_blank" className="pf-mono text-xs text-[var(--pf-fg-muted)] hover:text-[var(--pf-ac)]">
                /p/{p.username} ↗
              </Link>
            </li>
          ))}
        </ul>

        {/* 사용자 · 권한 관리 */}
        <h2 className="mb-3 mt-10 text-sm font-semibold text-[var(--pf-fg-faint)]">사용자 · 권한 관리</h2>
        <ul className="divide-y divide-white/[0.07] rounded-2xl border border-white/[0.07]">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
              <span className="font-medium text-[var(--pf-fg)]">{u.username}</span>
              {u.role === 'admin' && (
                <span className="rounded-full bg-[var(--pf-ac)]/15 px-2 py-0.5 text-xs text-[var(--pf-ac)]">운영자</span>
              )}
              {u.id === user.id && <span className="text-xs text-[var(--pf-fg-faint)]">(나)</span>}
              <div className="flex-1" />
              <span className="text-xs text-[var(--pf-fg-faint)]">가입 {fmtDate(u.createdAt)}</span>
              {u.id !== user.id && (
                <>
                  <form action={setUserRoleAction}>
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="role" value={u.role === 'admin' ? 'user' : 'admin'} />
                    <button type="submit" className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-[var(--pf-fg-dim)] hover:border-[var(--pf-ac)] hover:text-[var(--pf-fg)]">
                      {u.role === 'admin' ? '사용자로' : '운영자로'}
                    </button>
                  </form>
                  <form action={deleteUserAction}>
                    <input type="hidden" name="id" value={u.id} />
                    <button type="submit" className="rounded-lg px-2 py-1 text-xs text-[var(--pf-fg-faint)] hover:text-red-400">삭제</button>
                  </form>
                </>
              )}
            </li>
          ))}
        </ul>

        <ToolLinks />
      </div>
    )
  }

  // ── 일반 사용자: 내 포트폴리오 관리 ────────────────────────────────
  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <h1 className="text-2xl font-bold text-[var(--pf-fg)]">내 스튜디오</h1>
      <p className="mt-1 text-sm text-[var(--pf-fg-muted)]">{user.username} · 포트폴리오를 만들고 관리하세요.</p>
      <NotificationsPanel items={notifs} />
      <MyPortfolios profiles={myProfiles} />
      <ToolLinks />
    </div>
  )
}

// 도구: 에이전트 발행용 API 키 + 발행 문서(에이전트가 읽는 SDK 가이드).
function ToolLinks() {
  return (
    <>
      <h2 className="mb-3 mt-10 text-sm font-semibold text-[var(--pf-fg-faint)]">도구</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/studio/keys" className={`${cardCls} flex items-center justify-between`}>
          <span>
            <span className="block font-bold text-[var(--pf-fg)]">API 키</span>
            <span className="mt-0.5 block text-sm text-[var(--pf-fg-muted)]">에이전트 자동 발행용 키 발급·관리</span>
          </span>
          <span className="text-[var(--pf-ac)]">→</span>
        </Link>
        <Link href="/docs" target="_blank" className={`${cardCls} flex items-center justify-between`}>
          <span>
            <span className="block font-bold text-[var(--pf-fg)]">API · SDK 문서</span>
            <span className="mt-0.5 block text-sm text-[var(--pf-fg-muted)]">AI 에이전트에게 읽혀 발행을 자동화</span>
          </span>
          <span className="text-[var(--pf-ac)]">↗</span>
        </Link>
      </div>
    </>
  )
}
