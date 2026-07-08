
export type Theme = 'light' | 'dark'

export interface ThemeCtx {
  theme: Theme
  toggle: () => void
}