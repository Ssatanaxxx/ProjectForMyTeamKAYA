import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Building2,
  CircleDollarSign,
  Clock,
  FileCheck2,
  Send,
  Settings2,
  SlidersHorizontal,
  UserCheck,
} from 'lucide-react'
import { AppBar, type Tab } from '../components/AppBar'
import { Modal } from '../components/Modal'
import { UIBadge, UIButton, UICard, UICardBody, UIField, UIInput, UIProgress } from '../components/UI/index'

import { useToast } from '../components/Toast'
import { Analytics } from './Analytics'
import { RequestReview } from './RequestReview'
import { useCompany } from '../lib/useCompany'
import { useNotifications } from '../lib/hooks'
import { repo } from '../lib/repo'
import { autoAllocate } from '../lib/formulas'
import { tenge, percent, shortDate } from '../lib/format'
import { STATUS_LABEL, STATUS_TONE } from '../lib/status'
import type { DeptView } from '../lib/aggregate'
import type { Session } from '../lib/session'

const TABS: Tab[] = [
  { id: 'lobby', label: 'Департаменты' },
  { id: 'analytics', label: 'Сводная аналитика' },
]

export function EconomistWorkspace({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const { push } = useToast()
  const data = useCompany(session.company.id)
  const notif = useNotifications(session, (n) =>
    push({ kind: 'notify', title: n.title, body: n.body }),
  )
  const [tab, setTab] = useState('lobby')
  const [reviewing, setReviewing] = useState<DeptView | null>(null)

  return (
    <div className="min-h-svh bg-bg">
      <AppBar
        session={session}
        tabs={TABS}
        active={tab}
        onTab={setTab}
        notifications={notif.items}
        unread={notif.unread}
        onOpenNotifications={notif.markAllRead}
        onLogout={onLogout}
      />

      <main className="mx-auto max-w-7xl px-5 py-7">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {tab === 'lobby' ? (
              <Lobby session={session} data={data} onReview={setReviewing} />
            ) : (
              <Analytics summary={data.summary} period={data.period} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {reviewing && data.period && (
        <RequestReview
          view={reviewing}
          period={data.period}
          session={session}
          onClose={() => setReviewing(null)}
          onDecided={data.reload}
        />
      )}
    </div>
  )
}

/* --------------------------------- Lobby --------------------------------- */

function Lobby({
  session,
  data,
  onReview,
}: {
  session: Session
  data: ReturnType<typeof useCompany>
  onReview: (v: DeptView) => void
}) {
  const { push } = useToast()
  const { period, summary } = data
  const [setupOpen, setSetupOpen] = useState(!period)
  const [limitsOpen, setLimitsOpen] = useState(false)

  const plannedCount = Math.max(period?.planned_departments ?? 0, summary.depts.length)
  const emptySlots = Math.max(0, plannedCount - summary.depts.length)

  const requestBudget = async (deptId: string | null, deptName?: string) => {
    if (!period) {
      push({ kind: 'warning', title: 'Сначала задайте бюджет', body: 'Откройте настройку периода.' })
      return
    }
    const dept = deptId ? summary.depts.find((d) => d.department.id === deptId) : null
    await repo.notify({
      company_id: session.company.id,
      recipient_member_id: dept?.department.head_member_id ?? null,
      kind: 'budget_requested',
      title: deptName ? `Запрос бюджета: ${deptName}` : 'Запрос бюджета',
      body: `Экономист просит сформировать заявку на период «${period.title}».`,
      payload: { period_id: period.id },
    })
    push({ kind: 'success', title: 'Запрос отправлен', body: deptName ?? 'Всем департаментам' })
  }

  return (
    <div className="space-y-6">
      {/* сводка периода */}
      <UICard>
        <UICardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
              <CircleDollarSign size={22} />
            </span>
            <div>
              {period ? (
                <>
                  <p className="font-display text-lg font-bold text-ink">{period.title}</p>
                  <p className="text-[13px] text-muted">
                    {shortDate(period.date_from)} — {shortDate(period.date_to)} · бюджет{' '}
                    <span className="nums font-semibold text-ink">{tenge(period.total_budget)}</span>
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display text-lg font-bold text-ink">Бюджет не задан</p>
                  <p className="text-[13px] text-muted">Задайте период и сумму, чтобы распределить лимиты.</p>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {period && summary.depts.length > 0 && (
              <UIButton variant="secondary" onClick={() => setLimitsOpen(true)}>
                <SlidersHorizontal size={16} /> Лимиты
              </UIButton>
            )}
            <UIButton variant="secondary" onClick={() => setSetupOpen(true)}>
              <Settings2 size={16} /> {period ? 'Настроить период' : 'Задать бюджет'}
            </UIButton>
            {period && (
              <UIButton onClick={() => requestBudget(null)}>
                <Send size={16} /> Запросить бюджет у всех
              </UIButton>
            )}
          </div>
        </UICardBody>
      </UICard>

      {/* панели департаментов */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-ink">
            Департаменты{' '}
            <span className="text-faint">
              {summary.depts.length}
              {plannedCount > summary.depts.length ? ` из ${plannedCount}` : ''}
            </span>
          </h2>
        </div>

        {summary.depts.length === 0 && emptySlots === 0 ? (
          <EmptyLobby />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {summary.depts.map((d) => (
              <DeptPanel key={d.department.id} view={d} onRequest={requestBudget} onReview={onReview} />
            ))}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <WaitingSlot key={`slot-${i}`} index={summary.depts.length + i + 1} />
            ))}
          </div>
        )}
      </div>

      <Modal open={setupOpen} onClose={() => setSetupOpen(false)} title="Настройка бюджета периода">
        <BudgetSetup
          session={session}
          data={data}
          onSaved={() => {
            setSetupOpen(false)
          }}
        />
      </Modal>

      {limitsOpen && <LimitsModal data={data} onClose={() => setLimitsOpen(false)} />}
    </div>
  )
}

function EmptyLobby() {
  return (
    <UICard>
      <UICardBody className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-ink">
          <Building2 size={26} />
        </span>
        <div>
          <p className="font-display text-base font-bold text-ink">Пока нет департаментов</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Задайте бюджет и передайте код компании руководителям департаментов. Как только они
            войдут и назовут свой департамент, панели появятся здесь автоматически.
          </p>
        </div>
      </UICardBody>
    </UICard>
  )
}

function WaitingSlot({ index }: { index: number }) {
  return (
    <div className="flex min-h-[168px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface/40 p-5 text-center">
      <Clock size={20} className="text-faint" />
      <p className="text-sm font-medium text-muted">Департамент {index}</p>
      <p className="text-xs text-faint">Ожидание входа руководителя</p>
    </div>
  )
}

function DeptPanel({
  view,
  onRequest,
  onReview,
}: {
  view: DeptView
  onRequest: (id: string, name: string) => void
  onReview: (v: DeptView) => void
}) {
  const status = view.status === 'none' ? 'draft' : view.status
  return (
    <UICard className="flex flex-col">
      <UICardBody className="flex flex-1 flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-display text-base font-bold text-ink">{view.department.name}</p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-faint">
              <UserCheck size={12} /> Руководитель в системе
            </p>
          </div>
          <UIBadge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</UIBadge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[11px] text-faint">Лимит</p>
            <p className="nums font-semibold text-ink">{tenge(view.limit)}</p>
          </div>
          <div>
            <p className="text-[11px] text-faint">Заявлено</p>
            <p className={`nums font-semibold ${view.overLimit ? 'text-danger' : 'text-ink'}`}>
              {tenge(view.requested)}
            </p>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-faint">
            <span>Исполнение лимита</span>
            <span className="nums">{percent(view.utilization)}</span>
          </div>
          <UIProgress
            value={view.utilization}
            tone={view.overLimit ? 'danger' : view.utilization > 85 ? 'warning' : 'brand'}
          />
        </div>

        <div className="mt-auto flex gap-2">
          {view.status === 'submitted' ? (
            <UIButton size="sm" className="flex-1" onClick={() => onReview(view)}>
              <FileCheck2 size={15} /> Разобрать заявку
            </UIButton>
          ) : (
            <>
              <UIButton
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={() => onRequest(view.department.id, view.department.name)}
              >
                <Send size={15} /> Запросить
              </UIButton>
              {view.items.length > 0 && (
                <UIButton size="sm" variant="ghost" onClick={() => onReview(view)}>
                  Открыть
                </UIButton>
              )}
            </>
          )}
        </div>
      </UICardBody>
    </UICard>
  )
}

/* ----------------------------- Настройка бюджета ----------------------------- */

function BudgetSetup({
  session,
  data,
  onSaved,
}: {
  session: Session
  data: ReturnType<typeof useCompany>
  onSaved: () => void
}) {
  const { push } = useToast()
  const p = data.period
  const [title, setTitle] = useState(p?.title ?? 'Бюджет на 3 квартал 2026')
  const [from, setFrom] = useState(p?.date_from ?? '2026-07-01')
  const [to, setTo] = useState(p?.date_to ?? '2026-09-30')
  const [total, setTotal] = useState(String(p?.total_budget ?? 12_500_000))
  const [planned, setPlanned] = useState(String(p?.planned_departments || 3))
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const totalNum = Number(total)
    const plannedNum = Math.max(1, Number(planned) || 1)
    if (!title.trim() || !Number.isFinite(totalNum) || totalNum <= 0) {
      push({ kind: 'warning', title: 'Проверьте поля', body: 'Название и положительная сумма обязательны.' })
      return
    }
    setBusy(true)
    try {
      await repo.upsertPeriod({
        company_id: session.company.id,
        title: title.trim(),
        date_from: from,
        date_to: to,
        total_budget: totalNum,
        planned_departments: plannedNum,
      })
      // автораспределение лимитов по существующим департаментам
      const depts = data.departments
      if (depts.length > 0) {
        const limits = autoAllocate(totalNum, Math.max(depts.length, plannedNum))
        await repo.setDepartmentLimits(depts.map((d, i) => ({ id: d.id, auto_limit: limits[i] })))
      }
      await data.reload()
      push({ kind: 'success', title: 'Бюджет сохранён', body: 'Лимиты распределены автоматически.' })
      onSaved()
    } catch (err) {
      push({ kind: 'warning', title: 'Не сохранилось', body: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  const perDept = Math.round(Number(total) / Math.max(1, Number(planned) || 1))

  return (
    <form onSubmit={submit} className="space-y-4">
      <UIField label="Название периода">
        <UIInput value={title} onChange={(e) => setTitle(e.target.value)} />
      </UIField>
      <div className="grid grid-cols-2 gap-3">
        <UIField label="Начало">
          <UIInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </UIField>
        <UIField label="Конец">
          <UIInput type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </UIField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <UIField label="Общий бюджет, ₸">
          <UIInput type="number" value={total} onChange={(e) => setTotal(e.target.value)} className="nums" />
        </UIField>
        <UIField label="Департаментов" hint="Ожидаемое число">
          <UIInput type="number" min={1} value={planned} onChange={(e) => setPlanned(e.target.value)} className="nums" />
        </UIField>
      </div>

      <div className="rounded-xl bg-brand-soft px-4 py-3 text-[13px] text-brand-ink">
        Автолимит на департамент при равном делении:{' '}
        <span className="nums font-bold">{tenge(perDept)}</span>
      </div>

      <UIButton type="submit" size="lg" className="w-full" loading={busy}>
        Сохранить и распределить лимиты
      </UIButton>
    </form>
  )
}

/* ------------------------------- Лимиты (веса) ------------------------------- */

function LimitsModal({
  data,
  onClose,
}: {
  data: ReturnType<typeof useCompany>
  onClose: () => void
}) {
  const { push } = useToast()
  const total = data.period?.total_budget ?? 0
  const [limits, setLimits] = useState<Record<string, string>>(
    () => Object.fromEntries(data.departments.map((d) => [d.id, String(d.auto_limit)])),
  )
  const [busy, setBusy] = useState(false)

  const sum = useMemo(
    () => data.departments.reduce((s, d) => s + (Number(limits[d.id]) || 0), 0),
    [limits, data.departments],
  )
  const diff = total - sum

  const equal = () => {
    const parts = autoAllocate(total, data.departments.length)
    setLimits(Object.fromEntries(data.departments.map((d, i) => [d.id, String(parts[i])])))
  }

  const save = async () => {
    setBusy(true)
    try {
      await repo.setDepartmentLimits(
        data.departments.map((d) => ({ id: d.id, auto_limit: Number(limits[d.id]) || 0 })),
      )
      await data.reload()
      push({ kind: 'success', title: 'Лимиты обновлены' })
      onClose()
    } catch (err) {
      push({ kind: 'warning', title: 'Ошибка', body: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Распределение лимитов">
      <p className="mb-4 text-sm text-muted">
        Общий бюджет <span className="nums font-semibold text-ink">{tenge(total)}</span>. Разложите его
        по департаментам вручную или разделите поровну.
      </p>
      <div className="space-y-3">
        {data.departments.map((d) => (
          <div key={d.id} className="flex items-center gap-3">
            <span className="w-40 shrink-0 truncate text-sm font-medium text-ink">{d.name}</span>
            <UIInput
              type="number"
              value={limits[d.id] ?? '0'}
              onChange={(e) => setLimits((prev) => ({ ...prev, [d.id]: e.target.value }))}
              className="nums"
            />
          </div>
        ))}
      </div>
      <div
        className={`mt-4 flex items-center justify-between rounded-xl px-4 py-2.5 text-[13px] ${
          Math.abs(diff) < 1 ? 'bg-positive/12 text-positive' : 'bg-warning/14 text-warning'
        }`}
      >
        <span>Распределено: <span className="nums font-semibold">{tenge(sum)}</span></span>
        <span>{Math.abs(diff) < 1 ? 'Сходится с бюджетом' : `Остаток: ${tenge(diff)}`}</span>
      </div>
      <div className="mt-5 flex gap-3">
        <UIButton variant="secondary" onClick={equal}>Разделить поровну</UIButton>
        <UIButton className="ml-auto" onClick={save} loading={busy}>Сохранить</UIButton>
      </div>
    </Modal>
  )
}
