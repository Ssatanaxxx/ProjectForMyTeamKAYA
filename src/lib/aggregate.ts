// Сведение данных компании: по каждому департаменту считаем заявку, лимит, исполнение,
// а также общие итоги по компании. Основано на формулах экономиста (formulas.ts).

import type { BudgetItem, BudgetRequest, Department, RequestStatus } from './types'
import { requestTotal, utilization, remaining, isOverLimit, departmentShare } from './formulas'

export interface DeptView {
  department: Department
  request: BudgetRequest | null
  items: BudgetItem[]
  requested: number
  limit: number
  utilization: number
  remaining: number
  overLimit: boolean
  share: number
  status: RequestStatus | 'none'
}

export interface CompanySummary {
  totalBudget: number
  totalLimit: number
  totalRequested: number
  totalRemaining: number
  overallUtilization: number
  overBudget: boolean
  pendingCount: number
  approvedCount: number
  overLimitCount: number
  depts: DeptView[]
}

export function buildSummary(
  totalBudget: number,
  departments: Department[],
  requests: BudgetRequest[],
  itemsByRequest: Record<string, BudgetItem[]>,
): CompanySummary {
  const reqByDept = new Map(requests.map((r) => [r.department_id, r]))

  const depts: DeptView[] = departments.map((d) => {
    const request = reqByDept.get(d.id) ?? null
    const items = request ? itemsByRequest[request.id] ?? [] : []
    const requested = requestTotal(items)
    return {
      department: d,
      request,
      items,
      requested,
      limit: d.auto_limit,
      utilization: utilization(requested, d.auto_limit),
      remaining: remaining(requested, d.auto_limit),
      overLimit: isOverLimit(requested, d.auto_limit),
      share: 0, // заполним ниже, когда известна сумма по компании
      status: request?.status ?? 'none',
    }
  })

  const totalRequested = depts.reduce((s, d) => s + d.requested, 0)
  const totalLimit = depts.reduce((s, d) => s + d.limit, 0)
  for (const d of depts) d.share = departmentShare(d.requested, totalRequested)

  return {
    totalBudget,
    totalLimit,
    totalRequested,
    totalRemaining: totalBudget - totalRequested,
    overallUtilization: totalBudget > 0 ? Math.round((totalRequested / totalBudget) * 1000) / 10 : 0,
    overBudget: totalRequested > totalBudget + 0.001,
    pendingCount: depts.filter((d) => d.status === 'submitted').length,
    approvedCount: depts.filter((d) => d.status === 'approved').length,
    overLimitCount: depts.filter((d) => d.overLimit).length,
    depts,
  }
}
