import { useCallback, useEffect, useRef, useState } from 'react'
import { repo } from './repo'
import type { AppNotification } from './types'
import type { Session } from './session'

/**
 * Подписка на изменения в компании. onChange вызывается при любом realtime-событии
 * (Supabase) или сообщении из другой вкладки (демо-режим).
 */
export function useRepoSubscription(companyId: string | undefined, onChange: () => void) {
  const cb = useRef(onChange)
  cb.current = onChange
  useEffect(() => {
    if (!companyId) return
    const unsub = repo.subscribe(companyId, () => cb.current())
    return unsub
  }, [companyId])
}

/**
 * Уведомления участника. Возвращает список, число непрочитанных, пометку прочитанным
 * и колбэк уведомления о новых (для тоста). refresh перечитывает из репозитория.
 */
export function useNotifications(session: Session | null, onNew?: (n: AppNotification) => void) {
  const [items, setItems] = useState<AppNotification[]>([])
  const known = useRef<Set<string>>(new Set())
  const first = useRef(true)
  const onNewRef = useRef(onNew)
  onNewRef.current = onNew

  const refresh = useCallback(async () => {
    if (!session) return
    const list = await repo.listNotifications(session.company.id, session.member.id)
    // определяем новые уведомления (кроме самой первой загрузки)
    if (!first.current) {
      for (const n of list) {
        if (!known.current.has(n.id)) onNewRef.current?.(n)
      }
    }
    known.current = new Set(list.map((n) => n.id))
    first.current = false
    setItems(list)
  }, [session])

  useEffect(() => {
    refresh()
  }, [refresh])

  useRepoSubscription(session?.company.id, refresh)

  const unread = items.filter((n) => !n.read).length

  const markAllRead = useCallback(async () => {
    const ids = items.filter((n) => !n.read).map((n) => n.id)
    if (ids.length === 0) return
    await repo.markNotificationsRead(ids)
    refresh()
  }, [items, refresh])

  return { items, unread, markAllRead, refresh }
}
