import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../theme'
import { cn } from '../lib/cn'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Светлая тема' : 'Тёмная тема'}
      title={dark ? 'Светлая тема' : 'Тёмная тема'}
      className={cn(
        'relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface',
        'text-muted transition-colors hover:text-ink hover:border-faint',
      )}
    >
      <Sun
        size={17}
        className={cn(
          'absolute transition-all duration-300',
          dark ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100',
        )}
      />
      <Moon
        size={17}
        className={cn(
          'absolute transition-all duration-300',
          dark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0',
        )}
      />
    </button>
  )
}
