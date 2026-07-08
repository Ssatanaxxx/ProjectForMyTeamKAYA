// Доменные типы приложения. Совпадают со схемой БД (supabase/migrations/001_init.sql).

export type Role = 'economist' | 'department_head'

export type RequestStatus = 'draft' | 'submitted' | 'approved' | 'revision'

export interface Company {
  id: string
  name: string
  access_code: string
  created_at: string
}

export interface Member {
  id: string
  company_id: string
  role: Role
  full_name: string
  pin: string
  created_at: string
}

export interface BudgetPeriod {
  id: string
  company_id: string
  title: string
  date_from: string
  date_to: string
  total_budget: number
  planned_departments: number
  created_at: string
}

export interface Department {
  id: string
  company_id: string
  name: string
  head_member_id: string | null
  auto_limit: number
  created_at: string
}

export interface BudgetRequest {
  id: string
  department_id: string
  period_id: string
  status: RequestStatus
  economist_comment: string | null
  submitted_at: string | null
  decided_at: string | null
  created_at: string
}

export interface BudgetItem {
  id: string
  request_id: string
  name: string
  category: string
  quantity: number
  unit_cost: number
  justification: string
  line_total: number
  created_at: string
}

export type NotificationKind =
  | 'budget_requested'
  | 'department_joined'
  | 'request_submitted'
  | 'request_approved'
  | 'request_revision'
  | 'message'

export interface AppNotification {
  id: string
  company_id: string
  recipient_member_id: string | null
  kind: NotificationKind
  title: string
  body: string
  payload: Record<string, unknown>
  read: boolean
  created_at: string
}

// Черновая позиция заявки в форме (до записи в БД line_total считаем локально)
export interface DraftItem {
  id: string
  name: string
  category: string
  quantity: number
  unit_cost: number
  justification: string
}
