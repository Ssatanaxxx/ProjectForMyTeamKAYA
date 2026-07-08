import { createClient } from '@supabase/supabase-js'

// Ключи подставляются в .env.local (не коммитить). Пример — в .env.example.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** true, если Supabase сконфигурирован. Иначе приложение работает в демо-режиме на localStorage. */
export const isSupabaseReady = Boolean(url && anon)

export const supabase = isSupabaseReady
  ? createClient(url as string, anon as string, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 5 } },
    })
  : null
