import { supabase } from '../supabase'
import type { Repo } from './types'
import { LocalRepo } from './local'
import { SupaRepo } from './supa'

// Один экземпляр репозитория на приложение. Если Supabase сконфигурирован —
// работаем с реальной БД, иначе — демо-режим на localStorage.
export const repo: Repo = supabase ? new SupaRepo(supabase) : new LocalRepo()

export type { Repo } from './types'
