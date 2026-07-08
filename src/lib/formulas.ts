// Формулы экономиста. Чистые функции — считаются одинаково в БД, в форме и в тестах.
// Web-research по теме: variance = факт − план; % отклонения; исполнение бюджета;
// burn rate; доля департамента (см. NetSuite, Workday, Vena FP&A metrics).

import type { BudgetItem, DraftItem } from './types'

/** Сумма строки: количество × цена за единицу. */
export function lineTotal(item: Pick<DraftItem, 'quantity' | 'unit_cost'>): number {
  return round2(item.quantity * item.unit_cost)
}

/** Итог заявки: сумма всех позиций. */
export function requestTotal(items: Array<Pick<BudgetItem | DraftItem, 'quantity' | 'unit_cost'>>): number {
  return round2(items.reduce((sum, it) => sum + it.quantity * it.unit_cost, 0))
}

/** Абсолютное отклонение факта от плана (лимита). >0 — перерасход. */
export function variance(requested: number, limit: number): number {
  return round2(requested - limit)
}

/** Отклонение в процентах от лимита. */
export function variancePct(requested: number, limit: number): number {
  if (limit <= 0) return requested > 0 ? 100 : 0
  return round1(((requested - limit) / limit) * 100)
}

/** Исполнение лимита: сколько процентов лимита заявлено. */
export function utilization(requested: number, limit: number): number {
  if (limit <= 0) return 0
  return round1((requested / limit) * 100)
}

/** Остаток лимита. Может быть отрицательным при перерасходе. */
export function remaining(requested: number, limit: number): number {
  return round2(limit - requested)
}

/** Превышен ли лимит. */
export function isOverLimit(requested: number, limit: number): boolean {
  return requested > limit + 0.001
}

/** Доля департамента в общей сумме заявок компании, %. */
export function departmentShare(deptRequested: number, companyRequested: number): number {
  if (companyRequested <= 0) return 0
  return round1((deptRequested / companyRequested) * 100)
}

/**
 * Burn rate — скорость расходования: потрачено / прошедшие дни периода.
 * Прогноз до конца периода = burn rate × полная длительность.
 */
export function burnRate(spent: number, dateFrom: string, dateTo: string, asOf = new Date()): {
  perDay: number
  daysElapsed: number
  daysTotal: number
  projectedTotal: number
} {
  const from = new Date(dateFrom).getTime()
  const to = new Date(dateTo).getTime()
  const now = asOf.getTime()
  const dayMs = 86_400_000

  const daysTotal = Math.max(1, Math.round((to - from) / dayMs))
  const daysElapsed = clamp(Math.round((now - from) / dayMs), 1, daysTotal)
  const perDay = round2(spent / daysElapsed)
  const projectedTotal = round2(perDay * daysTotal)

  return { perDay, daysElapsed, daysTotal, projectedTotal }
}

/**
 * Автораспределение общего бюджета по департаментам.
 * weights — необязательные веса; при их отсутствии делим поровну.
 * Последнему департаменту отдаём остаток, чтобы сумма сошлась в копейку.
 */
export function autoAllocate(total: number, count: number, weights?: number[]): number[] {
  if (count <= 0) return []
  const w = normalizeWeights(count, weights)
  const limits: number[] = []
  let assigned = 0
  for (let i = 0; i < count; i++) {
    if (i === count - 1) {
      limits.push(round2(total - assigned))
    } else {
      const part = round2(total * w[i])
      limits.push(part)
      assigned += part
    }
  }
  return limits
}

function normalizeWeights(count: number, weights?: number[]): number[] {
  if (!weights || weights.length !== count) {
    return Array.from({ length: count }, () => 1 / count)
  }
  const sum = weights.reduce((s, x) => s + Math.max(0, x), 0)
  if (sum <= 0) return Array.from({ length: count }, () => 1 / count)
  return weights.map((x) => Math.max(0, x) / sum)
}

// --- вспомогательное ---

export function round1(n: number): number {
  return Math.round(n * 10) / 10
}
export function round2(n: number): number {
  return Math.round(n * 100) / 100
}
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}
