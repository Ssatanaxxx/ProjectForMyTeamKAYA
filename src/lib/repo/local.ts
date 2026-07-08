// Демо-реализация репозитория: данные в localStorage, кросс-вкладочный realtime
// через BroadcastChannel. Позволяет запустить экономиста и департамент в двух окнах
// одного браузера без бэкенда. Логика статусов и суммы совпадают со схемой БД.

import type { Repo } from './types'
import type {
  AppNotification,
  BudgetItem,
  BudgetPeriod,
  BudgetRequest,
  Company,
  Department,
  DraftItem,
  Member,
  RequestStatus,
} from '../types'
import { canTransition } from '../status'
import { lineTotal } from '../formulas'

interface DB {
  companies: Company[]
  members: Member[]
  periods: BudgetPeriod[]
  departments: Department[]
  requests: BudgetRequest[]
  items: BudgetItem[]
  notifications: AppNotification[]
}

const KEY = 'budgetly_db_v1'
const CHANNEL = 'budgetly_sync_v1'

function emptyDB(): DB {
  return {
    companies: [],
    members: [],
    periods: [],
    departments: [],
    requests: [],
    items: [],
    notifications: [],
  }
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyDB()
    return { ...emptyDB(), ...JSON.parse(raw) }
  } catch {
    return emptyDB()
  }
}

function id(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

export class LocalRepo implements Repo {
  readonly mode = 'local' as const
  private channel: BroadcastChannel | null =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null

  private db: DB = load()

  private persist() {
    localStorage.setItem(KEY, JSON.stringify(this.db))
    this.channel?.postMessage('changed')
  }

  private reload() {
    this.db = load()
  }

  async getCompanyByCode(code: string): Promise<Company | null> {
    this.reload()
    const c = this.db.companies.find(
      (x) => x.access_code.trim().toLowerCase() === code.trim().toLowerCase(),
    )
    return c ?? null
  }

  async createCompany(input: { name: string; access_code: string }): Promise<Company> {
    this.reload()
    const exists = this.db.companies.some(
      (x) => x.access_code.trim().toLowerCase() === input.access_code.trim().toLowerCase(),
    )
    if (exists) throw new Error('Компания с таким кодом уже существует')
    const company: Company = {
      id: id(),
      name: input.name,
      access_code: input.access_code,
      created_at: now(),
    }
    this.db.companies.push(company)
    this.persist()
    return company
  }

  async createMember(input: {
    company_id: string
    role: 'economist' | 'department_head'
    full_name: string
    pin: string
  }): Promise<Member> {
    this.reload()
    const member: Member = { id: id(), created_at: now(), ...input }
    this.db.members.push(member)
    this.persist()
    return member
  }

  async listMembers(companyId: string): Promise<Member[]> {
    this.reload()
    return this.db.members.filter((m) => m.company_id === companyId)
  }

  async getPeriod(companyId: string): Promise<BudgetPeriod | null> {
    this.reload()
    const list = this.db.periods
      .filter((p) => p.company_id === companyId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
    return list[0] ?? null
  }

  async upsertPeriod(input: {
    company_id: string
    title: string
    date_from: string
    date_to: string
    total_budget: number
    planned_departments: number
  }): Promise<BudgetPeriod> {
    this.reload()
    const existing = this.db.periods.find((p) => p.company_id === input.company_id)
    if (existing) {
      Object.assign(existing, input)
      this.persist()
      return existing
    }
    const period: BudgetPeriod = { id: id(), created_at: now(), ...input }
    this.db.periods.push(period)
    this.persist()
    return period
  }

  async listDepartments(companyId: string): Promise<Department[]> {
    this.reload()
    return this.db.departments
      .filter((d) => d.company_id === companyId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
  }

  async createDepartment(input: {
    company_id: string
    name: string
    head_member_id: string | null
  }): Promise<Department> {
    this.reload()
    const clash = this.db.departments.some(
      (d) => d.company_id === input.company_id && d.name.trim().toLowerCase() === input.name.trim().toLowerCase(),
    )
    if (clash) throw new Error('Департамент с таким названием уже есть')
    const dept: Department = { id: id(), auto_limit: 0, created_at: now(), ...input }
    this.db.departments.push(dept)
    this.persist()
    return dept
  }

  async setDepartmentLimits(updates: Array<{ id: string; auto_limit: number }>): Promise<void> {
    this.reload()
    for (const u of updates) {
      const d = this.db.departments.find((x) => x.id === u.id)
      if (d) d.auto_limit = u.auto_limit
    }
    this.persist()
  }

  async getRequest(departmentId: string, periodId: string): Promise<BudgetRequest | null> {
    this.reload()
    return (
      this.db.requests.find((r) => r.department_id === departmentId && r.period_id === periodId) ?? null
    )
  }

  async ensureRequest(departmentId: string, periodId: string): Promise<BudgetRequest> {
    const found = await this.getRequest(departmentId, periodId)
    if (found) return found
    const req: BudgetRequest = {
      id: id(),
      department_id: departmentId,
      period_id: periodId,
      status: 'draft',
      economist_comment: null,
      submitted_at: null,
      decided_at: null,
      created_at: now(),
    }
    this.db.requests.push(req)
    this.persist()
    return req
  }

  async listRequests(periodId: string): Promise<BudgetRequest[]> {
    this.reload()
    return this.db.requests.filter((r) => r.period_id === periodId)
  }

  async setRequestStatus(
    requestId: string,
    status: RequestStatus,
    comment?: string,
  ): Promise<BudgetRequest> {
    this.reload()
    const req = this.db.requests.find((r) => r.id === requestId)
    if (!req) throw new Error('Заявка не найдена')
    if (req.status !== status && !canTransition(req.status, status)) {
      throw new Error(`Недопустимый переход статуса: ${req.status} → ${status}`)
    }
    req.status = status
    if (comment !== undefined) req.economist_comment = comment
    if (status === 'submitted') req.submitted_at = now()
    if (status === 'approved' || status === 'revision') req.decided_at = now()
    this.persist()
    return req
  }

  async listItems(requestId: string): Promise<BudgetItem[]> {
    this.reload()
    return this.db.items
      .filter((i) => i.request_id === requestId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
  }

  async saveItems(requestId: string, items: DraftItem[]): Promise<BudgetItem[]> {
    this.reload()
    this.db.items = this.db.items.filter((i) => i.request_id !== requestId)
    const saved: BudgetItem[] = items.map((it, index) => ({
      id: it.id || id(),
      request_id: requestId,
      name: it.name,
      category: it.category,
      quantity: it.quantity,
      unit_cost: it.unit_cost,
      justification: it.justification,
      line_total: lineTotal(it),
      created_at: new Date(Date.now() + index).toISOString(),
    }))
    this.db.items.push(...saved)
    this.persist()
    return saved
  }

  async notify(input: {
    company_id: string
    recipient_member_id: string | null
    kind: AppNotification['kind']
    title: string
    body?: string
    payload?: Record<string, unknown>
  }): Promise<void> {
    this.reload()
    const n: AppNotification = {
      id: id(),
      company_id: input.company_id,
      recipient_member_id: input.recipient_member_id,
      kind: input.kind,
      title: input.title,
      body: input.body ?? '',
      payload: input.payload ?? {},
      read: false,
      created_at: now(),
    }
    this.db.notifications.push(n)
    this.persist()
  }

  async listNotifications(companyId: string, memberId: string): Promise<AppNotification[]> {
    this.reload()
    return this.db.notifications
      .filter(
        (n) =>
          n.company_id === companyId &&
          (n.recipient_member_id === null || n.recipient_member_id === memberId),
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  async markNotificationsRead(ids: string[]): Promise<void> {
    this.reload()
    for (const n of this.db.notifications) {
      if (ids.includes(n.id)) n.read = true
    }
    this.persist()
  }

  subscribe(_companyId: string, onChange: () => void): () => void {
    const handler = () => onChange()
    this.channel?.addEventListener('message', handler)
    // подстраховка на случай отсутствия BroadcastChannel — событие storage
    const storageHandler = (e: StorageEvent) => {
      if (e.key === KEY) onChange()
    }
    window.addEventListener('storage', storageHandler)
    return () => {
      this.channel?.removeEventListener('message', handler)
      window.removeEventListener('storage', storageHandler)
    }
  }
}
