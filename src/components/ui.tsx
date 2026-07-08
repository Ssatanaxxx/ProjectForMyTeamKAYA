import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '../lib/cn'

/* ------------------------------- Button ------------------------------- */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'positive'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary:
    'bg-brand text-white hover:bg-brand-ink shadow-sm hover:shadow-md disabled:opacity-50',
  secondary:
    'bg-surface text-ink border border-border hover:border-faint hover:bg-elevated disabled:opacity-50',
  ghost: 'text-muted hover:text-ink hover:bg-elevated disabled:opacity-40',
  danger: 'bg-danger text-white hover:brightness-95 shadow-sm disabled:opacity-50',
  positive: 'bg-positive text-white hover:brightness-95 shadow-sm disabled:opacity-50',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-[15px] rounded-xl gap-2',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
        'active:scale-[0.985] disabled:cursor-not-allowed disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
})

function Spinner() {
  return (
    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
  )
}

/* -------------------------------- Card -------------------------------- */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-surface shadow-card', className)}>
      {children}
    </div>
  )
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('p-5', className)}>{children}</div>
}

/* ------------------------------- Inputs ------------------------------- */

const fieldBase =
  'w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-ink placeholder:text-faint ' +
  'transition-colors focus:border-brand focus:outline-none focus:shadow-focus disabled:opacity-60'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(fieldBase, 'h-10', className)} {...props} />
  },
)

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(fieldBase, 'min-h-[72px] py-2.5 resize-y', className)} {...props} />
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn(fieldBase, 'h-10 cursor-pointer', className)} {...props}>
        {children}
      </select>
    )
  },
)

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string
  hint?: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <label htmlFor={htmlFor} className="block space-y-1.5">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="block text-xs text-faint">{hint}</span>}
    </label>
  )
}

/* ------------------------------- Badge -------------------------------- */

type Tone = 'neutral' | 'brand' | 'positive' | 'warning' | 'danger'

const tones: Record<Tone, string> = {
  neutral: 'bg-elevated text-muted border-border',
  brand: 'bg-brand-soft text-brand-ink border-transparent',
  positive: 'bg-positive/12 text-positive border-transparent',
  warning: 'bg-warning/14 text-warning border-transparent',
  danger: 'bg-danger/12 text-danger border-transparent',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}

/* ---------------------------- Progress bar ---------------------------- */

export function Progress({ value, tone = 'brand' }: { value: number; tone?: Tone }) {
  const pct = Math.max(0, Math.min(100, value))
  const fill =
    tone === 'danger'
      ? 'bg-danger'
      : tone === 'warning'
      ? 'bg-warning'
      : tone === 'positive'
      ? 'bg-positive'
      : 'bg-brand'
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-elevated">
      <div
        className={cn('h-full rounded-full transition-[width] duration-500 ease-out', fill)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
