import { cn } from "../../../lib/cn";
import type { Tone } from "../types";

export const UIProgress = ({ value, tone = 'brand' }: { value: number; tone?: Tone }) =>  {
  const pct = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0
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