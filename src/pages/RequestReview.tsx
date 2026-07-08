import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import { Modal } from '../components/Modal'
import { Badge, Button, Progress, Textarea } from '../components/ui'
import { useToast } from '../components/Toast'
import { repo } from '../lib/repo'
import { analyzeRequest, type Flag } from '../lib/advisor'
import { reviewWithAi, isAiReady, type AiReview } from '../lib/aiAdvisor'
import { variance, variancePct, burnRate } from '../lib/formulas'
import { tenge, percent } from '../lib/format'
import { STATUS_LABEL, STATUS_TONE } from '../lib/status'
import type { DeptView } from '../lib/aggregate'
import type { BudgetPeriod } from '../lib/types'
import type { Session } from '../lib/session'

export function RequestReview({
  view,
  period,
  session,
  onClose,
  onDecided,
}: {
  view: DeptView
  period: BudgetPeriod
  session: Session
  onClose: () => void
  onDecided: () => void
}) {
  const { push } = useToast()
  const [comment, setComment] = useState(view.request?.economist_comment ?? '')
  const [askComment, setAskComment] = useState(false)
  const [busy, setBusy] = useState(false)
  const [ai, setAi] = useState<AiReview | null>(null)
  const [aiBusy, setAiBusy] = useState(false)

  const advice = useMemo(() => analyzeRequest(view.items, view.limit), [view.items, view.limit])
  const varAbs = variance(view.requested, view.limit)
  const varPct = variancePct(view.requested, view.limit)
  const burn = burnRate(view.requested, period.date_from, period.date_to)

  const req = view.request

  const decide = async (status: 'approved' | 'revision') => {
    if (!req) return
    if (status === 'revision' && comment.trim().length < 3) {
      setAskComment(true)
      push({ kind: 'warning', title: 'Нужен комментарий', body: 'Поясните департаменту, что доработать.' })
      return
    }
    setBusy(true)
    try {
      await repo.setRequestStatus(req.id, status, comment.trim() || undefined)
      await repo.notify({
        company_id: session.company.id,
        recipient_member_id: view.department.head_member_id,
        kind: status === 'approved' ? 'request_approved' : 'request_revision',
        title:
          status === 'approved'
            ? `Заявка «${view.department.name}» одобрена`
            : `Заявка «${view.department.name}» отправлена на доработку`,
        body:
          status === 'approved'
            ? 'Экономист утвердил бюджет департамента.'
            : comment.trim() || 'Требуется доработка заявки.',
      })
      push({
        kind: status === 'approved' ? 'success' : 'info',
        title: status === 'approved' ? 'Заявка одобрена' : 'Отправлено на доработку',
      })
      onDecided()
      onClose()
    } catch (err) {
      push({ kind: 'warning', title: 'Не удалось сохранить', body: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  const runAi = async () => {
    setAiBusy(true)
    try {
      const result = await reviewWithAi({
        departmentName: view.department.name,
        limit: view.limit,
        items: view.items,
        period,
        baseAdvice: advice,
      })
      setAi(result)
    } catch (err) {
      push({ kind: 'warning', title: 'ИИ недоступен', body: (err as Error).message })
    } finally {
      setAiBusy(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={`Разбор заявки — ${view.department.name}`} className="max-w-3xl">
      <div className="max-h-[74vh] space-y-5 overflow-y-auto pr-1">
        {/* шапка со статусом */}
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={STATUS_TONE[view.status === 'none' ? 'draft' : view.status]}>
            {STATUS_LABEL[view.status === 'none' ? 'draft' : view.status]}
          </Badge>
          {view.overLimit && (
            <Badge tone="danger">
              <AlertTriangle size={12} /> Превышение лимита
            </Badge>
          )}
          <span className="ml-auto text-sm text-muted">
            Лимит департамента: <span className="nums font-semibold text-ink">{tenge(view.limit)}</span>
          </span>
        </div>

        {/* формулы экономиста */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Заявлено" value={tenge(view.requested)} tone={view.overLimit ? 'danger' : 'default'} />
          <Metric
            label="Отклонение от лимита"
            value={`${varAbs >= 0 ? '+' : ''}${tenge(varAbs)}`}
            sub={`${varPct >= 0 ? '+' : ''}${percent(varPct)}`}
            tone={varAbs > 0 ? 'danger' : 'positive'}
          />
          <Metric label="Исполнение лимита" value={percent(view.utilization)} />
          <Metric
            label="Прогноз к концу периода"
            value={tenge(burn.projectedTotal)}
            sub={`${tenge(burn.perDay)}/день`}
          />
        </section>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
            <span>Использование лимита</span>
            <span className="nums">{percent(view.utilization)}</span>
          </div>
          <Progress value={view.utilization} tone={view.overLimit ? 'danger' : view.utilization > 85 ? 'warning' : 'brand'} />
        </div>

        {/* таблица позиций */}
        <section>
          <h4 className="mb-2 text-sm font-semibold text-ink">Статьи расходов</h4>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-elevated/60 text-left text-xs text-muted">
                  <th className="px-3 py-2 font-medium">Наименование</th>
                  <th className="px-3 py-2 text-right font-medium">Кол-во</th>
                  <th className="px-3 py-2 text-right font-medium">Цена</th>
                  <th className="px-3 py-2 text-right font-medium">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {view.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-faint">
                      В заявке нет позиций
                    </td>
                  </tr>
                ) : (
                  view.items.map((it) => (
                    <tr key={it.id} className="border-b border-border last:border-0 align-top">
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-ink">{it.name}</p>
                        <p className="text-xs text-faint">{it.category}</p>
                        {it.justification && (
                          <p className="mt-1 max-w-md text-xs leading-snug text-muted">{it.justification}</p>
                        )}
                      </td>
                      <td className="nums px-3 py-2.5 text-right text-muted">{it.quantity}</td>
                      <td className="nums px-3 py-2.5 text-right text-muted">{tenge(it.unit_cost)}</td>
                      <td className="nums px-3 py-2.5 text-right font-semibold text-ink">{tenge(it.line_total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-elevated/60">
                  <td colSpan={3} className="px-3 py-2.5 text-right text-sm font-medium text-muted">
                    Итого заявка
                  </td>
                  <td className="nums px-3 py-2.5 text-right font-bold text-ink">{tenge(view.requested)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* автоконтроль (эвристики) */}
        <section>
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp size={16} className="text-brand" />
            <h4 className="text-sm font-semibold text-ink">Автоконтроль</h4>
            <span className="text-xs text-faint">{advice.headline}</span>
          </div>
          {advice.flags.length === 0 ? (
            <FlagRow
              flag={{ severity: 'info', title: 'Замечаний нет', detail: 'Заявка соответствует лимиту и оформлена корректно.' }}
            />
          ) : (
            <div className="space-y-2">
              {advice.flags.map((f, i) => (
                <FlagRow key={i} flag={f} />
              ))}
            </div>
          )}
        </section>

        {/* ИИ-разбор */}
        <section className="rounded-xl border border-border bg-elevated/40 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-brand" />
              <h4 className="text-sm font-semibold text-ink">Разбор ассистента</h4>
            </div>
            {isAiReady ? (
              <Button size="sm" variant="secondary" onClick={runAi} loading={aiBusy} disabled={view.items.length === 0}>
                {ai ? 'Обновить' : 'Разобрать'}
              </Button>
            ) : (
              <span className="text-xs text-faint">ИИ не подключён</span>
            )}
          </div>
          {ai ? (
            <div className="space-y-2.5">
              <p className="text-sm leading-relaxed text-ink">{ai.summary}</p>
              {ai.concerns.length > 0 && (
                <ul className="space-y-1.5">
                  {ai.concerns.map((c, i) => (
                    <li key={i} className="flex gap-2 text-[13px] text-muted">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
                      {c}
                    </li>
                  ))}
                </ul>
              )}
              {ai.leaningText && (
                <p className="rounded-lg bg-brand-soft px-3 py-2 text-[13px] text-brand-ink">
                  {ai.leaningText}
                </p>
              )}
              <p className="text-xs text-faint">
                Это рекомендация ассистента. Решение принимает экономист.
              </p>
            </div>
          ) : (
            <p className="text-[13px] text-muted">
              {isAiReady
                ? 'Нажмите «Разобрать» — ассистент оценит статьи, обоснования и склонность к решению. За вас он не решает.'
                : 'Добавьте ключ OpenAI в .env.local, чтобы получить текстовый разбор. Автоконтроль выше работает и без ИИ.'}
            </p>
          )}
        </section>

        {/* комментарий и решение */}
        {(askComment || comment) && (
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-muted">
              Комментарий департаменту {`(обязателен при возврате)`}
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Например: обоснуйте закупку серверов и снизьте количество лицензий."
            />
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <Button variant="danger" onClick={() => decide('revision')} loading={busy}>
          <XCircle size={17} /> Вернуть на доработку
        </Button>
        <Button variant="positive" onClick={() => decide('approved')} loading={busy}>
          <CheckCircle2 size={17} /> Одобрить
        </Button>
        <Button variant="ghost" onClick={onClose} className="ml-auto">
          Закрыть
        </Button>
      </div>
    </Modal>
  )
}

function Metric({
  label,
  value,
  sub,
  tone = 'default',
}: {
  label: string
  value: string
  sub?: string
  tone?: 'default' | 'danger' | 'positive'
}) {
  const accent = tone === 'danger' ? 'text-danger' : tone === 'positive' ? 'text-positive' : 'text-ink'
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <p className="text-[11px] text-faint">{label}</p>
      <p className={`nums mt-1 font-display text-base font-bold ${accent}`}>{value}</p>
      {sub && <p className="nums text-[11px] text-faint">{sub}</p>}
    </div>
  )
}

function FlagRow({ flag }: { flag: Flag }) {
  const map = {
    critical: { icon: <AlertTriangle size={15} className="text-danger" />, ring: 'border-danger/30 bg-danger/5' },
    warning: { icon: <AlertTriangle size={15} className="text-warning" />, ring: 'border-warning/30 bg-warning/5' },
    info: { icon: <Info size={15} className="text-brand" />, ring: 'border-border bg-elevated/40' },
  }[flag.severity]
  return (
    <div className={`flex gap-2.5 rounded-lg border px-3 py-2.5 ${map.ring}`}>
      <span className="mt-0.5 shrink-0">{map.icon}</span>
      <div>
        <p className="text-[13px] font-semibold text-ink">{flag.title}</p>
        <p className="text-[13px] leading-snug text-muted">{flag.detail}</p>
      </div>
    </div>
  )
}
