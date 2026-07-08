import { cn } from '../lib/cn'

// Знак Budgetly — стилизованная растущая столбиковая диаграмма в квадрате-скруглении.
export function Logo({ size = 28, withWordmark = true, className }: {
  size?: number
  withWordmark?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="rgb(var(--brand))" />
        <rect x="8" y="17" width="4" height="7" rx="1.5" fill="white" opacity="0.85" />
        <rect x="14" y="12" width="4" height="12" rx="1.5" fill="white" opacity="0.92" />
        <rect x="20" y="8" width="4" height="16" rx="1.5" fill="white" />
      </svg>
      {withWordmark && (
        <span className="font-display text-[19px] font-extrabold tracking-tight text-ink">
          Budgetly
        </span>
      )}
    </div>
  )
}
