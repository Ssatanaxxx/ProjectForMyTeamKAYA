import type {
  AppNotification,
  BudgetItem,
  BudgetPeriod,
  BudgetRequest,
  Company,
  Department,
  DraftItem,
  Member,
  NotificationKind,
  RequestStatus,
  Role,
} from '../types'

// Единый контракт доступа к данным. Реализации: LocalRepo (демо на localStorage +
// BroadcastChannel) и SupaRepo (реальный Supabase). Приложение работает с любой.
export interface Repo {
  readonly mode: 'supabase' | 'local'

  getCompanyByCode(code: string): Promise<Company | null>
  createCompany(input: { name: string; access_code: string }): Promise<Company>

  createMember(input: {
    company_id: string
    role: Role
    full_name: string
    pin: string
  }): Promise<Member>
  listMembers(companyId: string): Promise<Member[]>

  getPeriod(companyId: string): Promise<BudgetPeriod | null>
  upsertPeriod(input: {
    company_id: string
    title: string
    date_from: string
    date_to: string
    total_budget: number
    planned_departments: number
  }): Promise<BudgetPeriod>

  listDepartments(companyId: string): Promise<Department[]>
  createDepartment(input: {
    company_id: string
    name: string
    head_member_id: string | null
  }): Promise<Department>
  setDepartmentLimits(updates: Array<{ id: string; auto_limit: number }>): Promise<void>

  getRequest(departmentId: string, periodId: string): Promise<BudgetRequest | null>
  ensureRequest(departmentId: string, periodId: string): Promise<BudgetRequest>
  listRequests(periodId: string): Promise<BudgetRequest[]>
  setRequestStatus(requestId: string, status: RequestStatus, comment?: string): Promise<BudgetRequest>

  listItems(requestId: string): Promise<BudgetItem[]>
  saveItems(requestId: string, items: DraftItem[]): Promise<BudgetItem[]>

  notify(input: {
    company_id: string
    recipient_member_id: string | null
    kind: NotificationKind
    title: string
    body?: string
    payload?: Record<string, unknown>
  }): Promise<void>
  listNotifications(companyId: string, memberId: string): Promise<AppNotification[]>
  markNotificationsRead(ids: string[]): Promise<void>

  /** Подписка на изменения в компании. Возвращает функцию отписки. */
  subscribe(companyId: string, onChange: () => void): () => void
}
