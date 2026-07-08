// Реальная реализация репозитория на Supabase. Realtime — через postgres_changes.
// Суммы позиций считает БД (generated column line_total), статусы стережёт триггер.

import type { SupabaseClient } from '@supabase/supabase-js'
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

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

export class SupaRepo implements Repo {
  readonly mode = 'supabase' as const
  private sb: SupabaseClient
  // Кэш «в полёте»: два одновременных ensureRequest (StrictMode дважды запускает
  // эффект) делят один промис, поэтому INSERT уходит один раз — без 409 в консоли.
  private ensuring = new Map<string, Promise<BudgetRequest>>()
  constructor(sb: SupabaseClient) {
    this.sb = sb
  }

  async getCompanyByCode(code: string): Promise<Company | null> {
    const { data, error } = await this.sb
      .from('companies')
      .select('*')
      .ilike('access_code', code.trim())
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data
  }

  async createCompany(input: { name: string; access_code: string }): Promise<Company> {
    return unwrap(await this.sb.from('companies').insert(input).select().single())
  }

  async createMember(input: {
    company_id: string
    role: 'economist' | 'department_head'
    full_name: string
    pin: string
  }): Promise<Member> {
    return unwrap(await this.sb.from('members').insert(input).select().single())
  }

  async listMembers(companyId: string): Promise<Member[]> {
    return unwrap(await this.sb.from('members').select('*').eq('company_id', companyId))
  }

  async getPeriod(companyId: string): Promise<BudgetPeriod | null> {
    const { data, error } = await this.sb
      .from('budget_periods')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data
  }

  async upsertPeriod(input: {
    company_id: string
    title: string
    date_from: string
    date_to: string
    total_budget: number
    planned_departments: number
  }): Promise<BudgetPeriod> {
    const existing = await this.getPeriod(input.company_id)
    if (existing) {
      return unwrap(
        await this.sb.from('budget_periods').update(input).eq('id', existing.id).select().single(),
      )
    }
    return unwrap(await this.sb.from('budget_periods').insert(input).select().single())
  }

  async listDepartments(companyId: string): Promise<Department[]> {
    return unwrap(
      await this.sb
        .from('departments')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true }),
    )
  }

  async createDepartment(input: {
    company_id: string
    name: string
    head_member_id: string | null
  }): Promise<Department> {
    return unwrap(await this.sb.from('departments').insert(input).select().single())
  }

  async setDepartmentLimits(updates: Array<{ id: string; auto_limit: number }>): Promise<void> {
    for (const u of updates) {
      const { error } = await this.sb
        .from('departments')
        .update({ auto_limit: u.auto_limit })
        .eq('id', u.id)
      if (error) throw new Error(error.message)
    }
  }

  async getRequest(departmentId: string, periodId: string): Promise<BudgetRequest | null> {
    const { data, error } = await this.sb
      .from('budget_requests')
      .select('*')
      .eq('department_id', departmentId)
      .eq('period_id', periodId)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data
  }

  async ensureRequest(departmentId: string, periodId: string): Promise<BudgetRequest> {
    const key = `${departmentId}:${periodId}`
    const inflight = this.ensuring.get(key)
    if (inflight) return inflight

    const task = (async (): Promise<BudgetRequest> => {
      const found = await this.getRequest(departmentId, periodId)
      if (found) return found
      const { data, error } = await this.sb
        .from('budget_requests')
        .insert({ department_id: departmentId, period_id: periodId, status: 'draft' })
        .select()
        .single()
      if (error) {
        // Кросс-вкладочная гонка: запись создана параллельно. Берём существующую,
        // не трогая её статус. Уникальный индекс защищает от дублей.
        const again = await this.getRequest(departmentId, periodId)
        if (again) return again
        throw new Error(error.message)
      }
      return data
    })()

    this.ensuring.set(key, task)
    try {
      return await task
    } finally {
      this.ensuring.delete(key)
    }
  }

  async listRequests(periodId: string): Promise<BudgetRequest[]> {
    return unwrap(await this.sb.from('budget_requests').select('*').eq('period_id', periodId))
  }

  async setRequestStatus(
    requestId: string,
    status: RequestStatus,
    comment?: string,
  ): Promise<BudgetRequest> {
    const patch: Record<string, unknown> = { status }
    if (comment !== undefined) patch.economist_comment = comment
    return unwrap(
      await this.sb.from('budget_requests').update(patch).eq('id', requestId).select().single(),
    )
  }

  async listItems(requestId: string): Promise<BudgetItem[]> {
    return unwrap(
      await this.sb
        .from('budget_items')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true }),
    )
  }

  async saveItems(requestId: string, items: DraftItem[]): Promise<BudgetItem[]> {
    // Заменяем весь набор позиций заявки: удаляем старые, вставляем новые.
    const del = await this.sb.from('budget_items').delete().eq('request_id', requestId)
    if (del.error) throw new Error(del.error.message)
    if (items.length === 0) return []
    const rows = items.map((it) => ({
      request_id: requestId,
      name: it.name,
      category: it.category,
      quantity: it.quantity,
      unit_cost: it.unit_cost,
      justification: it.justification,
    }))
    return unwrap(await this.sb.from('budget_items').insert(rows).select())
  }

  async notify(input: {
    company_id: string
    recipient_member_id: string | null
    kind: AppNotification['kind']
    title: string
    body?: string
    payload?: Record<string, unknown>
  }): Promise<void> {
    const { error } = await this.sb.from('notifications').insert({
      company_id: input.company_id,
      recipient_member_id: input.recipient_member_id,
      kind: input.kind,
      title: input.title,
      body: input.body ?? '',
      payload: input.payload ?? {},
    })
    if (error) throw new Error(error.message)
  }

  async listNotifications(companyId: string, memberId: string): Promise<AppNotification[]> {
    return unwrap(
      await this.sb
        .from('notifications')
        .select('*')
        .eq('company_id', companyId)
        .or(`recipient_member_id.is.null,recipient_member_id.eq.${memberId}`)
        .order('created_at', { ascending: false }),
    )
  }

  async markNotificationsRead(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    const { error } = await this.sb.from('notifications').update({ read: true }).in('id', ids)
    if (error) throw new Error(error.message)
  }

  subscribe(companyId: string, onChange: () => void): () => void {
    // Уникальное имя канала на каждую подписку: useCompany и useNotifications
    // подписываются одновременно с одним companyId — при одинаковом топике Supabase
    // бросает "cannot add postgres_changes callbacks after subscribe()". Суффикс
    // разводит каналы по разным топикам.
    const topic = `company-${companyId}-${crypto.randomUUID()}`
    let channel: ReturnType<SupabaseClient['channel']> | null = null
    try {
      channel = this.sb
        .channel(topic)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'budget_requests' }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, onChange)
        .subscribe()
    } catch (err) {
      // Сбой realtime не должен рушить приложение: данные грузятся обычными запросами,
      // теряются только живые обновления.
      console.warn('Realtime subscribe failed:', err)
      channel = null
    }
    return () => {
      if (channel) this.sb.removeChannel(channel)
    }
  }
}
