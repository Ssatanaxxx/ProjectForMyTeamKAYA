import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

// KPI-плитка. Число статично (без счётчиков) — это рабочий экран.
export function Stat({
  label,
  value,
  sub,
  icon,
  tone = 'default',
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  icon?: ReactNode
  tone?: 'default' | 'positive' | 'warning' | 'danger' | 'brand'
}) {
  const accent = {
    default: 'text-ink',
    brand: 'text-brand',
    positive: 'text-positive',
    warning: 'text-warning',
    danger: 'text-danger',
  }[tone]

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        {icon && <span className="text-faint">{icon}</span>}
      </div>
      <p className={cn('nums mt-2 font-display text-[26px] font-bold leading-none', accent)}>{value}</p>
      {sub && <p className="mt-1.5 text-xs text-faint">{sub}</p>}
    </div>
  )
}
