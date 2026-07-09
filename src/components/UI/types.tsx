import type { ButtonHTMLAttributes } from "react";

export type Tone = "neutral" | "brand" | "positive" | "warning" | "danger";

export const tones: Record<Tone, string> = {
  neutral: "bg-elevated text-muted border-border",
  brand: "bg-brand-soft text-brand-ink border-transparent",
  positive: "bg-positive/12 text-positive border-transparent",
  warning: "bg-warning/14 text-warning border-transparent",
  danger: "bg-danger/12 text-danger border-transparent",
};

export type Variant = "primary" | "secondary" | "ghost" | "danger" | "positive";
export type Size = "sm" | "md" | "lg";

export const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-ink shadow-sm hover:shadow-md disabled:opacity-50",
  secondary:
    "bg-surface text-ink border border-border hover:border-faint hover:bg-elevated disabled:opacity-50",
  ghost: "text-muted hover:text-ink hover:bg-elevated disabled:opacity-40",
  danger:
    "bg-danger text-white hover:brightness-95 shadow-sm disabled:opacity-50",
  positive:
    "bg-positive text-white hover:brightness-95 shadow-sm disabled:opacity-50",
};

export const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-[15px] rounded-xl gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const fieldBase =
  "w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-ink placeholder:text-faint " +
  "transition-colors focus:border-brand focus:outline-none focus:shadow-focus disabled:opacity-60";
