import { describe, it, expect } from 'vitest'
import {
  lineTotal,
  requestTotal,
  variance,
  variancePct,
  utilization,
  remaining,
  isOverLimit,
  departmentShare,
  burnRate,
  autoAllocate,
} from './formulas'
import { canTransition, isEditable } from './status'
import { analyzeRequest } from './advisor'
import type { BudgetItem } from './types'

function item(partial: Partial<BudgetItem>): BudgetItem {
  const quantity = partial.quantity ?? 1
  const unit_cost = partial.unit_cost ?? 0
  return {
    id: partial.id ?? crypto.randomUUID(),
    request_id: 'r',
    name: partial.name ?? 'Позиция',
    category: partial.category ?? 'Прочее',
    quantity,
    unit_cost,
    justification: partial.justification ?? 'обоснование позиции достаточной длины',
    line_total: quantity * unit_cost,
    created_at: new Date().toISOString(),
  }
}

describe('формулы экономиста', () => {
  it('сумма строки = количество × цена', () => {
    expect(lineTotal({ quantity: 3, unit_cost: 150000 })).toBe(450000)
  })

  it('итог заявки складывает позиции', () => {
    expect(requestTotal([{ quantity: 2, unit_cost: 100 }, { quantity: 1, unit_cost: 50 }])).toBe(250)
  })

  it('отклонение и процент отклонения', () => {
    expect(variance(1200, 1000)).toBe(200)
    expect(variancePct(1200, 1000)).toBe(20)
    expect(variancePct(800, 1000)).toBe(-20)
  })

  it('исполнение и остаток лимита', () => {
    expect(utilization(680, 1000)).toBe(68)
    expect(remaining(680, 1000)).toBe(320)
    expect(remaining(1200, 1000)).toBe(-200)
  })

  it('превышение лимита', () => {
    expect(isOverLimit(1000.5, 1000)).toBe(true)
    expect(isOverLimit(1000, 1000)).toBe(false)
  })

  it('доля департамента в компании', () => {
    expect(departmentShare(250, 1000)).toBe(25)
    expect(departmentShare(0, 0)).toBe(0)
  })

  it('деление на нулевой лимит не ломает расчёт', () => {
    expect(utilization(500, 0)).toBe(0)
    expect(variancePct(500, 0)).toBe(100)
  })
})

describe('burn rate и прогноз', () => {
  it('считает скорость расхода и прогноз до конца периода', () => {
    // период 10 дней, прошло 5, потрачено 500 → 100/день, прогноз 1000
    const from = '2026-07-01'
    const to = '2026-07-11'
    const asOf = new Date('2026-07-06')
    const r = burnRate(500, from, to, asOf)
    expect(r.daysTotal).toBe(10)
    expect(r.daysElapsed).toBe(5)
    expect(r.perDay).toBe(100)
    expect(r.projectedTotal).toBe(1000)
  })
})

describe('автораспределение лимитов', () => {
  it('делит поровну и сумма сходится', () => {
    const parts = autoAllocate(1000, 3)
    expect(parts).toHaveLength(3)
    expect(parts.reduce((a, b) => a + b, 0)).toBe(1000)
  })

  it('делит по весам', () => {
    const parts = autoAllocate(1000, 2, [3, 1])
    expect(parts[0]).toBe(750)
    expect(parts[1]).toBe(250)
  })

  it('при некорректных весах откатывается к равному делению', () => {
    const parts = autoAllocate(900, 3, [0, 0, 0])
    expect(parts.reduce((a, b) => a + b, 0)).toBe(900)
  })
})

describe('статусная машина', () => {
  it('разрешает только валидные переходы', () => {
    expect(canTransition('draft', 'submitted')).toBe(true)
    expect(canTransition('submitted', 'approved')).toBe(true)
    expect(canTransition('submitted', 'revision')).toBe(true)
    expect(canTransition('revision', 'submitted')).toBe(true)
  })

  it('блокирует недопустимые переходы', () => {
    expect(canTransition('draft', 'approved')).toBe(false)
    expect(canTransition('approved', 'submitted')).toBe(false)
    expect(canTransition('draft', 'revision')).toBe(false)
  })

  it('редактировать можно только черновик и доработку', () => {
    expect(isEditable('draft')).toBe(true)
    expect(isEditable('revision')).toBe(true)
    expect(isEditable('submitted')).toBe(false)
    expect(isEditable('approved')).toBe(false)
  })
})

describe('советник (эвристики автоконтроля)', () => {
  it('ловит превышение лимита и склоняется к доработке', () => {
    const items = [item({ name: 'Серверы', quantity: 1, unit_cost: 1500 })]
    const advice = analyzeRequest(items, 1000)
    expect(advice.flags.some((f) => f.severity === 'critical')).toBe(true)
    expect(advice.leaning).toBe('revise')
  })

  it('помечает позицию без обоснования', () => {
    const items = [
      item({ name: 'Ноутбуки', quantity: 2, unit_cost: 400, justification: '' }),
      item({ name: 'Мебель', quantity: 1, unit_cost: 100 }),
    ]
    const advice = analyzeRequest(items, 5000)
    expect(advice.flags.some((f) => f.title.includes('Нет обоснования'))).toBe(true)
  })

  it('чистая заявка в пределах лимита — склоняется к одобрению', () => {
    // три сбалансированные позиции по ~33%: нет доминирующей, лимит использован на 90%
    const items = [
      item({ name: 'Лицензии', quantity: 10, unit_cost: 30 }),
      item({ name: 'Обучение', quantity: 5, unit_cost: 60 }),
      item({ name: 'Оборудование', quantity: 3, unit_cost: 100 }),
    ]
    const advice = analyzeRequest(items, 1000)
    expect(advice.leaning).toBe('approve')
    expect(advice.flags.every((f) => f.severity !== 'critical')).toBe(true)
  })

  it('замечает недоиспользование лимита', () => {
    const items = [item({ name: 'Канцелярия', quantity: 1, unit_cost: 100 })]
    const advice = analyzeRequest(items, 1000)
    expect(advice.flags.some((f) => f.title.includes('использован не полностью'))).toBe(true)
  })
})
