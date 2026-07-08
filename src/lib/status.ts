// Статусная машина заявки. Дублирует правила БД-триггера enforce_request_status,
// чтобы UI не предлагал недопустимых действий и не ловил ошибку из БД.

import type { RequestStatus } from './types'

const TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  draft: ['submitted'],
  submitted: ['approved', 'revision'],
  revision: ['submitted'],
  approved: ['revision'], // переоткрытие уже одобренной заявки
}

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false
}

/** Заявку можно редактировать департаменту только в этих статусах. */
export function isEditable(status: RequestStatus): boolean {
  return status === 'draft' || status === 'revision'
}

/** Ждёт решения экономиста. */
export function isPendingReview(status: RequestStatus): boolean {
  return status === 'submitted'
}

export const STATUS_LABEL: Record<RequestStatus, string> = {
  draft: 'Черновик',
  submitted: 'На проверке',
  approved: 'Одобрено',
  revision: 'На доработке',
}

export const STATUS_TONE: Record<RequestStatus, 'neutral' | 'brand' | 'positive' | 'warning'> = {
  draft: 'neutral',
  submitted: 'brand',
  approved: 'positive',
  revision: 'warning',
}
