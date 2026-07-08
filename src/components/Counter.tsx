import { useEffect, useRef, useState } from 'react'
import { tenge } from '../lib/format'

// Плавный счётчик суммы. Используется только на приветственном экране —
// в рабочих таблицах числа статичны.
export function Counter({ to, duration = 1100 }: { to: number; duration?: number }) {
  const [value, setValue] = useState(0)
  const raf = useRef<number>(0)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setValue(to)
      return
    }
    const start = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(to * eased)
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [to, duration])

  return <span className="nums">{tenge(value)}</span>
}
