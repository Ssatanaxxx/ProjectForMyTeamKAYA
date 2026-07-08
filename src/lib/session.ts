// Сессия хранится в sessionStorage (на вкладку), чтобы в одном браузере можно было
// открыть экономиста и руководителя департамента в разных вкладках независимо.

import type { Company, Member, Role } from './types'

export interface Session {
  company: Company
  member: Member
  departmentId?: string // для руководителя — его департамент
}

const KEY = 'budgetly_session_v1'

export function getSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function setSession(session: Session): void {
  sessionStorage.setItem(KEY, JSON.stringify(session))
}

export function patchSession(patch: Partial<Session>): Session | null {
  const current = getSession()
  if (!current) return null
  const next = { ...current, ...patch }
  setSession(next)
  return next
}

export function clearSession(): void {
  sessionStorage.removeItem(KEY)
}

export function roleLabel(role: Role): string {
  return role === 'economist' ? 'Экономист' : 'Руководитель департамента'
}
