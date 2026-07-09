import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";

export const UICard = ({ className, children }: { className?: string; children: ReactNode }) => {
  return (
    <div className={cn('rounded-2xl border border-border bg-surface shadow-card', className)}>
      {children}
    </div>
  )
}

export const UICardBody = ({ className, children }: { className?: string; children: ReactNode }) => {
  return <div className={cn('p-5', className)}>{children}</div>
}