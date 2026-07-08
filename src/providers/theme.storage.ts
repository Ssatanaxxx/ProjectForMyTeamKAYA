import { createContext } from "react";
import type { Theme, ThemeCtx } from "./theme.types";

export const initial = (): Theme => {
  const saved = localStorage.getItem(KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const KEY = "budgetly_theme";
export const Ctx = createContext<ThemeCtx | undefined>(undefined);
