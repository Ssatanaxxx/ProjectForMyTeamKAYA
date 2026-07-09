import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";
import { tones, type Tone } from "../types";



export const UIBadge = ({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) => {
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
