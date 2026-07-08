import { useEffect } from 'react'
import { motion } from 'motion/react'
import { Logo } from './Logo'

// Приветственный экран после входа — вторая (и последняя) витринная анимация.
// Показывается один раз, затем автоматически исчезает.
export function Welcome({ name, onDone }: { name: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1900)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-bg"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Logo size={44} withWordmark={false} />
      </motion.div>
      <motion.p
        className="mt-6 font-display text-2xl font-bold text-ink"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
      >
        С возвращением, {name.split(' ')[0]}
      </motion.p>
      <motion.p
        className="mt-1.5 text-sm text-muted"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        Готовим ваш рабочий стол…
      </motion.p>
    </motion.div>
  )
}
