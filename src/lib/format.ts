// Форматирование чисел и дат под казахстанскую локаль.

const kzt = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 0,
})

/** Сумма в тенге: «12 500 000 ₸» (неразрывные пробелы между разрядами). */
export function tenge(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return `${kzt.format(Math.round(value))} ₸`
}

/** Компактная сумма для узких мест: «12,5 млн ₸». */
export function tengeShort(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${round1(value / 1_000_000)} млн ₸`
  if (abs >= 1_000) return `${round1(value / 1_000)} тыс ₸`
  return tenge(value)
}

/** Процент с одним знаком: «68,4%». */
export function percent(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return `${round1(value)}%`.replace('.', ',')
}

/** Число с одним знаком, если он значимый. */
export function round1(value: number): number {
  return Math.round(value * 10) / 10
}

/** Дата «08.07.2026». */
export function shortDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Относительное время: «только что», «5 мин назад», «08.07». */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diff = Date.now() - then
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'только что'
  if (min < 60) return `${min} мин назад`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `${hours} ч назад`
  return shortDate(iso)
}
