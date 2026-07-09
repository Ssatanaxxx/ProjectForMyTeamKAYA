import { useState } from 'react'
import { Bell, LogOut } from 'lucide-react'
import { Logo } from './UI/UILogo/UILogo'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '../lib/cn'
import { timeAgo } from '../lib/format'
import type { AppNotification } from '../lib/types'
import type { Session } from '../lib/session'
import { roleLabel } from '../lib/session'

export interface Tab {
  id: string
  label: string
}

export function AppBar({
  session,
  tabs,
  active,
  onTab,
  notifications,
  unread,
  onOpenNotifications,
  onLogout,
}: {
  session: Session
  tabs: Tab[]
  active: string
  onTab: (id: string) => void
  notifications: AppNotification[]
  unread: number
  onOpenNotifications: () => void
  onLogout: () => void
}) {
  const [openBell, setOpenBell] = useState(false)

  const toggleBell = () => {
    const next = !openBell
    setOpenBell(next)
    if (next) onOpenNotifications()
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-5">
        <Logo />

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => onTab(t.id)}
              className={cn(
                'relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
                active === t.id ? 'text-ink' : 'text-muted hover:text-ink',
              )}
            >
              {t.label}
              {active === t.id && (
                <span className="absolute inset-x-2 -bottom-[13px] h-0.5 rounded-full bg-brand" />
              )}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <div className="relative">
            <button
              onClick={toggleBell}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted transition-colors hover:text-ink hover:border-faint"
              aria-label="Уведомления"
            >
              <Bell size={17} />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </button>
            {openBell && (
              <NotificationPanel notifications={notifications} onClose={() => setOpenBell(false)} />
            )}
          </div>

          <ThemeToggle />

          <div className="hidden items-center gap-2.5 border-l border-border pl-3 sm:flex">
            <div className="text-right leading-tight">
              <p className="text-[13px] font-semibold text-ink">{session.member.full_name}</p>
              <p className="text-[11px] text-faint">{roleLabel(session.member.role)}</p>
            </div>
            <button
              onClick={onLogout}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted transition-colors hover:text-danger hover:border-danger/40"
              aria-label="Выйти"
              title="Выйти"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* мобильные вкладки */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-3 py-2 md:hidden">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onTab(t.id)}
            className={cn(
              'whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              active === t.id ? 'bg-brand-soft text-brand-ink' : 'text-muted',
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  )
}

function NotificationPanel({
  notifications,
  onClose,
}: {
  notifications: AppNotification[]
  onClose: () => void
}) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute right-0 top-11 z-20 w-[min(90vw,340px)] overflow-hidden rounded-2xl border border-border bg-surface shadow-pop animate-[fade-up_0.2s_ease]">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-ink">Уведомления</p>
        </div>
        <div className="max-h-[380px] overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-faint">Пока нет уведомлений</p>
          ) : (
            notifications.slice(0, 20).map((n) => (
              <div
                key={n.id}
                className={cn(
                  'border-b border-border px-4 py-3 last:border-0',
                  !n.read && 'bg-brand-soft/40',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] font-semibold text-ink">{n.title}</p>
                  <span className="shrink-0 text-[11px] text-faint">{timeAgo(n.created_at)}</span>
                </div>
                {n.body && <p className="mt-0.5 text-[13px] leading-snug text-muted">{n.body}</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
