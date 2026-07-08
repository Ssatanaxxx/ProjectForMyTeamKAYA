// ИИ-разбор заявки поверх детерминированных эвристик. Модель по умолчанию gpt-4o-mini
// (быстро и дёшево, достаточно для аналитического текста; имя — в VITE_OPENAI_MODEL).
//
// Принцип: ИИ — помощник-аналитик, а НЕ тот, кто решает за экономиста. Он объясняет
// риски и склонность («скорее одобрить / скорее вернуть»), но финальные кнопки
// «Одобрить/Вернуть» жмёт человек. Без ключа приложение работает на эвристиках.

import type { BudgetItem, BudgetPeriod } from './types'
import type { Advice } from './advisor'
import { requestTotal, utilization } from './formulas'
import { tenge } from './format'

const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined
const model = (import.meta.env.VITE_OPENAI_MODEL as string | undefined) ?? 'gpt-4o-mini'

export const isAiReady = Boolean(apiKey)

export interface AiReview {
  summary: string // 2–3 предложения разбора
  concerns: string[] // конкретные замечания
  leaning: 'approve' | 'revise' | 'review'
  leaningText: string // человеческая формулировка склонности
}

interface Ctx {
  departmentName: string
  limit: number
  items: BudgetItem[]
  period: BudgetPeriod
  baseAdvice: Advice
}

export async function reviewWithAi(ctx: Ctx, signal?: AbortSignal): Promise<AiReview | null> {
  if (!apiKey) return null

  const total = requestTotal(ctx.items)
  const itemsText = ctx.items
    .map(
      (i) =>
        `- ${i.name} (${i.category}): ${i.quantity} × ${tenge(i.unit_cost)} = ${tenge(i.line_total)}. Обоснование: ${
          i.justification.trim() || 'не указано'
        }`,
    )
    .join('\n')

  const system = [
    'Ты — ассистент экономиста в системе планирования бюджета казахстанской компании.',
    'Твоя роль — помочь разобрать заявку департамента: указать на риски, спорные позиции,',
    'достаточность обоснований. Ты НЕ принимаешь решение за экономиста и не отдаёшь команд.',
    'Ты даёшь взвешенный разбор и склонность. Пиши по-русски, деловым тоном, без воды и без эмодзи.',
    'Отвечай строго JSON по схеме: {"summary": string, "concerns": string[], "leaning": "approve"|"revise"|"review", "leaningText": string}.',
  ].join(' ')

  const user = [
    `Департамент: ${ctx.departmentName}`,
    `Период: ${ctx.period.title} (${ctx.period.date_from} — ${ctx.period.date_to})`,
    `Автолимит департамента: ${tenge(ctx.limit)}`,
    `Итог заявки: ${tenge(total)} (${utilization(total, ctx.limit)}% лимита)`,
    '',
    'Позиции заявки:',
    itemsText || '(позиций нет)',
    '',
    'Предварительные замечания автоконтроля:',
    ctx.baseAdvice.flags.map((f) => `- [${f.severity}] ${f.title}: ${f.detail}`).join('\n') || '(нет)',
    '',
    'Дай разбор: 2–3 предложения summary, список concerns (конкретные, по делу),',
    'leaning и короткий leaningText. Не решай за экономиста — предлагай, а не приказывай.',
  ].join('\n')

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    signal,
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })

  if (!resp.ok) {
    throw new Error(`OpenAI ${resp.status}: ${await resp.text()}`)
  }

  const json = await resp.json()
  const content = json.choices?.[0]?.message?.content
  if (!content) return null

  const parsed = JSON.parse(content) as Partial<AiReview>
  return {
    summary: parsed.summary ?? '',
    concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
    leaning: parsed.leaning === 'approve' || parsed.leaning === 'revise' ? parsed.leaning : 'review',
    leaningText: parsed.leaningText ?? '',
  }
}
