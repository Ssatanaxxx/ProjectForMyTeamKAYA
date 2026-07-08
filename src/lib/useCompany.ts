import { useCallback, useEffect, useState } from 'react'
import { repo } from './repo'
import { useRepoSubscription } from './hooks'
import { buildSummary, type CompanySummary } from './aggregate'
import type { BudgetItem, BudgetPeriod, BudgetRequest, Department, Member } from './types'

export interface CompanyData {
  loading: boolean
  period: BudgetPeriod | null
  departments: Department[]
  members: Member[]
  requests: BudgetRequest[]
  itemsByRequest: Record<string, BudgetItem[]>
  summary: CompanySummary
  reload: () => Promise<void>
}

const EMPTY_SUMMARY = buildSummary(0, [], [], {})

// Загружает и держит в актуальном состоянии все данные компании.
// Перечитывает при любом realtime-событии.
export function useCompany(companyId: string): CompanyData {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<BudgetPeriod | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [requests, setRequests] = useState<BudgetRequest[]>([])
  const [itemsByRequest, setItemsByRequest] = useState<Record<string, BudgetItem[]>>({})
  const [summary, setSummary] = useState<CompanySummary>(EMPTY_SUMMARY)

  const reload = useCallback(async () => {
    const [per, depts, mems] = await Promise.all([
      repo.getPeriod(companyId),
      repo.listDepartments(companyId),
      repo.listMembers(companyId),
    ])

    let reqs: BudgetRequest[] = []
    const itemsMap: Record<string, BudgetItem[]> = {}
    if (per) {
      reqs = await repo.listRequests(per.id)
      const lists = await Promise.all(reqs.map((r) => repo.listItems(r.id)))
      reqs.forEach((r, i) => {
        itemsMap[r.id] = lists[i]
      })
    }

    setPeriod(per)
    setDepartments(depts)
    setMembers(mems)
    setRequests(reqs)
    setItemsByRequest(itemsMap)
    setSummary(buildSummary(per?.total_budget ?? 0, depts, reqs, itemsMap))
    setLoading(false)
  }, [companyId])

  useEffect(() => {
    reload()
  }, [reload])

  useRepoSubscription(companyId, reload)

  return { loading, period, departments, members, requests, itemsByRequest, summary, reload }
}
