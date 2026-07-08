import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, Info, AlertTriangle, Bell } from 'lucide-react'
import { cn } from '../lib/cn'

type ToastKind = 'success' | 'info' | 'warning' | 'notify'

interface Toast {
  id: string
  kind: ToastKind
  title: string
  body?: string
}

interface ToastCtx {
  push: (t: Omit<Toast, 'id'>) => void
}

const Ctx = createContext<ToastCtx>({ push: () => {} })

const icons: Record<ToastKind, ReactNode> = {
  success: <CheckCircle2 size={18} className="text-positive" />,
  info: <Info size={18} className="text-brand" />,
  warning: <AlertTriangle size={18} className="text-warning" />,
  notify: <Bell size={18} className="text-brand" />,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { ...t, id }])
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4600)
  }, [])

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[min(92vw,360px)] flex-col gap-2.5">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-surface p-3.5 shadow-pop',
              'animate-[fade-up_0.3s_cubic-bezier(0.22,1,0.36,1)]',
            )}
          >
            <span className="mt-0.5 shrink-0">{icons[t.kind]}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{t.title}</p>
              {t.body && <p className="mt-0.5 text-[13px] leading-snug text-muted">{t.body}</p>}
            </div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  return useContext(Ctx)
}
