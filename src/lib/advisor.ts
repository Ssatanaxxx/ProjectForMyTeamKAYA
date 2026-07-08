// Детерминированный «советник»: эвристики проверки заявки, работают офлайн без ИИ.
// Это базовый слой автоконтроля. ИИ (aiAdvisor.ts) добавляет текстовый разбор поверх.
// Важно: советник НЕ принимает решение за экономиста — только подсвечивает риски.

import type { BudgetItem } from './types'
import { requestTotal, utilization, variance } from './formulas'

export type Severity = 'info' | 'warning' | 'critical'

export interface Flag {
  severity: Severity
  title: string
  detail: string
  itemId?: string
}

export type Leaning = 'approve' | 'revise' | 'review'

export interface Advice {
  flags: Flag[]
  leaning: Leaning // к чему склоняется проверка — подсказка, не приговор
  headline: string
}

// Пороги эвристик
const DOMINANT_ITEM_SHARE = 40 // одна позиция > 40% заявки — просить обоснование
const THIN_JUSTIFICATION = 12 // обоснование короче 12 символов считаем пустым
const UNDERUSE_PCT = 55 // заявлено < 55% лимита — есть свободный резерв

export function analyzeRequest(items: BudgetItem[], limit: number): Advice {
  const flags: Flag[] = []
  const total = requestTotal(items)

  // 1. Превышение лимита — самый серьёзный сигнал
  if (total > limit + 0.001) {
    flags.push({
      severity: 'critical',
      title: 'Превышен автолимит департамента',
      detail: `Заявка больше лимита на ${fmt(variance(total, limit))} ₸ (${utilization(total, limit)}% лимита).`,
    })
  }

  // 2. Одна позиция забирает слишком большую долю
  for (const it of items) {
    const share = total > 0 ? (it.line_total / total) * 100 : 0
    if (share >= DOMINANT_ITEM_SHARE && items.length > 1) {
      flags.push({
        severity: 'warning',
        title: `Крупная позиция: «${it.name}»`,
        detail: `Забирает ${Math.round(share)}% всей заявки (${fmt(it.line_total)} ₸). Стоит запросить детальное обоснование.`,
        itemId: it.id,
      })
    }
  }

  // 3. Слабое или пустое обоснование
  for (const it of items) {
    if (it.justification.trim().length < THIN_JUSTIFICATION) {
      flags.push({
        severity: 'warning',
        title: `Нет обоснования: «${it.name}»`,
        detail: 'Позиция без внятного обоснования — непонятно, зачем она компании.',
        itemId: it.id,
      })
    }
  }

  // 4. Недоиспользование лимита — резерв можно перераспределить
  if (limit > 0 && total > 0 && utilization(total, limit) < UNDERUSE_PCT) {
    flags.push({
      severity: 'info',
      title: 'Лимит использован не полностью',
      detail: `Заявлено ${utilization(total, limit)}% лимита. Свободный резерв ${fmt(limit - total)} ₸ можно перераспределить между департаментами.`,
    })
  }

  // 5. Пустая заявка
  if (items.length === 0) {
    flags.push({
      severity: 'info',
      title: 'Заявка пустая',
      detail: 'Департамент ещё не добавил ни одной позиции.',
    })
  }

  return { flags, leaning: decideLeaning(flags), headline: headline(flags) }
}

function decideLeaning(flags: Flag[]): Leaning {
  if (flags.some((f) => f.severity === 'critical')) return 'revise'
  if (flags.filter((f) => f.severity === 'warning').length >= 2) return 'revise'
  if (flags.some((f) => f.severity === 'warning')) return 'review'
  return 'approve'
}

function headline(flags: Flag[]): string {
  const crit = flags.filter((f) => f.severity === 'critical').length
  const warn = flags.filter((f) => f.severity === 'warning').length
  if (crit > 0) return 'Есть критические замечания — вероятно, нужна доработка'
  if (warn > 1) return 'Несколько замечаний — стоит уточнить у департамента'
  if (warn === 1) return 'Одно замечание — проверьте перед решением'
  return 'Явных нарушений не видно — заявка выглядит корректной'
}

function fmt(n: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(n))
}
