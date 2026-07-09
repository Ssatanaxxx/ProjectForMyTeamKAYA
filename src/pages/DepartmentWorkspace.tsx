import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Plus,
  Send,
  Trash2,
} from 'lucide-react'
import { AppBar, type Tab } from '../components/AppBar'
import { UIBadge, UIButton, UICard, UICardBody, UIField, UIInput, UIProgress, UISelect, UITextarea } from '../components/UI/index'
import { useToast } from '../components/Toast'
import { useCompany } from '../lib/useCompany'
import { useNotifications } from '../lib/hooks'
import { repo } from '../lib/repo'
import { lineTotal, requestTotal, utilization, remaining, isOverLimit } from '../lib/formulas'
import { tenge, percent } from '../lib/format'
import { STATUS_LABEL, STATUS_TONE, isEditable } from '../lib/status'
import { patchSession, type Session } from '../lib/session'
import type { DraftItem, BudgetRequest, Department } from '../lib/types'

const TABS: Tab[] = [{ id: 'request', label: 'Заявка на бюджет' }]
const CATEGORIES = ['Оборудование', 'Программное обеспечение', 'Услуги', 'Персонал', 'Маркетинг', 'Прочее']

export function DepartmentWorkspace({
  session,
  onSession,
  onLogout,
}: {
  session: Session
  onSession: (s: Session) => void
  onLogout: () => void
}) {
  const { push } = useToast()
  const data = useCompany(session.company.id)
  const notif = useNotifications(session, (n) => push({ kind: 'notify', title: n.title, body: n.body }))

  // Свой департамент — по сохранённому id или по руководителю
  const myDept = useMemo(
    () =>
      data.departments.find(
        (d) => d.id === session.departmentId || d.head_member_id === session.member.id,
      ) ?? null,
    [data.departments, session],
  )

  return (
    <div className="min-h-svh bg-bg">
      <AppBar
        session={session}
        tabs={TABS}
        active="request"
        onTab={() => {}}
        notifications={notif.items}
        unread={notif.unread}
        onOpenNotifications={notif.markAllRead}
        onLogout={onLogout}
      />
      <main className="mx-auto max-w-4xl px-5 py-7">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {!myDept ? (
            <NameDepartment session={session} data={data} onNamed={onSession} />
          ) : (
            <RequestArea session={session} department={myDept} data={data} />
          )}
        </motion.div>
      </main>
    </div>
  )
}

/* ---------------------------- Назвать департамент ---------------------------- */

function NameDepartment({
  session,
  data,
  onNamed,
}: {
  session: Session
  data: ReturnType<typeof useCompany>
  onNamed: (s: Session) => void
}) {
  const { push } = useToast()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      const dept = await repo.createDepartment({
        company_id: session.company.id,
        name: name.trim(),
        head_member_id: session.member.id,
      })
      // если бюджет уже задан — сразу получаем автолимит равной долей
      if (data.period) {
        const count = data.departments.length + 1
        const share = Math.round(data.period.total_budget / Math.max(count, data.period.planned_departments || count))
        await repo.setDepartmentLimits([{ id: dept.id, auto_limit: share }])
      }
      await repo.notify({
        company_id: session.company.id,
        recipient_member_id: null,
        kind: 'department_joined',
        title: `Департамент «${dept.name}» присоединился`,
        body: `${session.member.full_name} создал департамент и готов формировать заявку.`,
      })
      const next = patchSession({ departmentId: dept.id })
      if (next) onNamed(next)
      await data.reload()
      push({ kind: 'success', title: 'Департамент создан', body: dept.name })
    } catch (err) {
      push({ kind: 'warning', title: 'Не удалось создать', body: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md pt-8">
      <UICard className="shadow-pop">
        <UICardBody className="space-y-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
            <Building2 size={22} />
          </span>
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">Ваш департамент</h2>
            <p className="mt-1 text-sm text-muted">
              Назовите департамент — он появится у экономиста в компании «{session.company.name}».
            </p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <UIField label="Название департамента">
              <UIInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Напр. Маркетинг" autoFocus />
            </UIField>
            <UIButton type="submit" size="lg" className="w-full" loading={busy}>
              Создать департамент
            </UIButton>
          </form>
        </UICardBody>
      </UICard>
    </div>
  )
}

/* ------------------------------- Область заявки ------------------------------- */

function RequestArea({
  session,
  department,
  data,
}: {
  session: Session
  department: Department
  data: ReturnType<typeof useCompany>
}) {
  const { push } = useToast()
  const [request, setRequest] = useState<BudgetRequest | null>(null)
  const [items, setItems] = useState<DraftItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  // подготовить заявку под текущий период
  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!data.period) {
        setLoading(false)
        return
      }
      const req = await repo.ensureRequest(department.id, data.period.id)
      const existing = await repo.listItems(req.id)
      if (!alive) return
      setRequest(req)
      setItems(
        existing.length
          ? existing.map((i) => ({
              id: i.id,
              name: i.name,
              category: i.category,
              quantity: i.quantity,
              unit_cost: i.unit_cost,
              justification: i.justification,
            }))
          : [blankItem()],
      )
      setLoading(false)
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.period?.id, department.id])

  // синхронизировать статус заявки при realtime-обновлениях (решение экономиста)
  useEffect(() => {
    if (!request) return
    const fresh = data.requests.find((r) => r.id === request.id)
    if (fresh && fresh.status !== request.status) setRequest(fresh)
  }, [data.requests, request])

  if (!data.period) return <WaitingBudget departmentName={department.name} />
  if (loading || !request) return <p className="py-10 text-center text-muted">Загрузка заявки…</p>

  const editable = isEditable(request.status)
  const total = requestTotal(items)
  const over = isOverLimit(total, department.auto_limit)
  const util = utilization(total, department.auto_limit)

  const update = (id: string, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const addRow = () => setItems((prev) => [...prev, blankItem()])
  const removeRow = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id))

  const cleaned = () =>
    items
      .filter((it) => it.name.trim())
      .map((it) => ({ ...it, quantity: Number(it.quantity) || 0, unit_cost: Number(it.unit_cost) || 0 }))

  const saveDraft = async () => {
    setBusy(true)
    try {
      await repo.saveItems(request.id, cleaned())
      await data.reload()
      push({ kind: 'success', title: 'Черновик сохранён' })
    } catch (err) {
      push({ kind: 'warning', title: 'Не сохранилось', body: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  const submit = async () => {
    const list = cleaned()
    if (list.length === 0) {
      push({ kind: 'warning', title: 'Добавьте позиции', body: 'В заявке нет ни одной статьи расходов.' })
      return
    }
    setBusy(true)
    try {
      await repo.saveItems(request.id, list)
      const updated = await repo.setRequestStatus(request.id, 'submitted')
      setRequest(updated)
      await repo.notify({
        company_id: session.company.id,
        recipient_member_id: null,
        kind: 'request_submitted',
        title: `Заявка «${department.name}» отправлена`,
        body: `${department.name} подал бюджет на проверку: ${tenge(requestTotal(list))}.`,
        payload: { department_id: department.id },
      })
      await data.reload()
      push({ kind: 'success', title: 'Заявка отправлена', body: 'Экономист получит уведомление.' })
    } catch (err) {
      push({ kind: 'warning', title: 'Не отправилось', body: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* шапка */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{department.name}</h1>
          <p className="text-sm text-muted">Заявка на период «{data.period.title}»</p>
        </div>
        <UIBadge tone={STATUS_TONE[request.status]}>{STATUS_LABEL[request.status]}</UIBadge>
      </div>

      {/* решение экономиста */}
      {request.status === 'approved' && (
        <Banner tone="positive" icon={<CheckCircle2 size={18} />} title="Заявка одобрена">
          Экономист утвердил бюджет департамента.
        </Banner>
      )}
      {request.status === 'revision' && request.economist_comment && (
        <Banner tone="warning" icon={<AlertTriangle size={18} />} title="Возвращено на доработку">
          {request.economist_comment}
        </Banner>
      )}
      {request.status === 'submitted' && (
        <Banner tone="brand" icon={<Clock size={18} />} title="Заявка на проверке">
          Ожидайте решения экономиста. Редактирование заблокировано.
        </Banner>
      )}

      {/* индикатор лимита */}
      <UICard>
        <UICardBody className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] text-faint">Автолимит департамента</p>
              <p className="nums font-display text-xl font-bold text-ink">{tenge(department.auto_limit)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-faint">Заявлено / остаток</p>
              <p className={`nums font-display text-xl font-bold ${over ? 'text-danger' : 'text-ink'}`}>
                {tenge(total)}{' '}
                <span className="text-sm font-medium text-faint">/ {tenge(remaining(total, department.auto_limit))}</span>
              </p>
            </div>
          </div>
          <UIProgress value={util} tone={over ? 'danger' : util > 85 ? 'warning' : 'brand'} />
          {over ? (
            <p className="flex items-center gap-1.5 text-[13px] text-danger">
              <AlertTriangle size={14} /> Превышение лимита на {tenge(total - department.auto_limit)} — экономист
              увидит это сразу.
            </p>
          ) : (
            <p className="text-[13px] text-muted">Использовано {percent(util)} лимита.</p>
          )}
        </UICardBody>
      </UICard>

      {/* таблица позиций */}
      <UICard>
        <UICardBody>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-ink">Статьи расходов</h3>
            {editable && (
              <UIButton size="sm" variant="secondary" onClick={addRow}>
                <Plus size={15} /> Добавить статью
              </UIButton>
            )}
          </div>

          <div className="space-y-3">
            {items.map((it, idx) => (
              <ItemRow
                key={it.id}
                item={it}
                index={idx + 1}
                editable={editable}
                onChange={(patch) => update(it.id, patch)}
                onRemove={() => removeRow(it.id)}
                canRemove={items.length > 1}
              />
            ))}
            {items.length === 0 && (
              <p className="py-6 text-center text-sm text-faint">Нет позиций. Добавьте первую статью расходов.</p>
            )}
          </div>
        </UICardBody>
      </UICard>

      {/* действия */}
      {editable && (
        <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface/90 p-3.5 shadow-pop backdrop-blur">
          <div className="pl-1">
            <p className="text-[11px] text-faint">Итого заявка</p>
            <p className="nums font-display text-lg font-bold text-ink">{tenge(total)}</p>
          </div>
          <div className="ml-auto flex gap-2.5">
            <UIButton variant="secondary" onClick={saveDraft} loading={busy}>
              Сохранить черновик
            </UIButton>
            <UIButton variant="positive" onClick={submit} loading={busy}>
              <Send size={16} /> Отправить экономисту
            </UIButton>
          </div>
        </div>
      )}
    </div>
  )
}

function ItemRow({
  item,
  index,
  editable,
  onChange,
  onRemove,
  canRemove,
}: {
  item: DraftItem
  index: number
  editable: boolean
  onChange: (patch: Partial<DraftItem>) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const sum = lineTotal({ quantity: Number(item.quantity) || 0, unit_cost: Number(item.unit_cost) || 0 })
  return (
    <div className="rounded-xl border border-border bg-elevated/30 p-3.5">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="grid gap-3 sm:grid-cols-2">
          <UIField label={`Позиция ${index}`}>
            <UIInput
              value={item.name}
              disabled={!editable}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Наименование"
            />
          </UIField>
          <UIField label="Категория">
            <UISelect value={item.category} disabled={!editable} onChange={(e) => onChange({ category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </UISelect>
          </UIField>
        </div>
        <div className="flex items-end justify-between gap-3 sm:flex-col sm:items-end">
          <div className="text-right">
            <p className="text-[11px] text-faint">Сумма</p>
            <p className="nums font-display text-base font-bold text-ink">{tenge(sum)}</p>
          </div>
          {editable && canRemove && (
            <button
              onClick={onRemove}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-faint transition-colors hover:border-danger/40 hover:text-danger"
              aria-label="Удалить позицию"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[120px_160px_1fr]">
        <UIField label="Количество">
          <UIInput
            type="number"
            min={0}
            value={item.quantity}
            disabled={!editable}
            onChange={(e) => onChange({ quantity: Number(e.target.value) })}
            className="nums"
          />
        </UIField>
        <UIField label="Цена за ед., ₸">
          <UIInput
            type="number"
            min={0}
            value={item.unit_cost}
            disabled={!editable}
            onChange={(e) => onChange({ unit_cost: Number(e.target.value) })}
            className="nums"
          />
        </UIField>
        <UIField label="Обоснование" hint="Зачем это нужно компании">
          <UITextarea
            value={item.justification}
            disabled={!editable}
            onChange={(e) => onChange({ justification: e.target.value })}
            placeholder="Например: замена устаревших рабочих станций дизайнеров."
            className="min-h-[40px]"
          />
        </UIField>
      </div>
    </div>
  )
}

function WaitingBudget({ departmentName }: { departmentName: string }) {
  return (
    <UICard className="mx-auto max-w-md">
      <UICardBody className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-ink">
          <Clock size={26} />
        </span>
        <div>
          <p className="font-display text-base font-bold text-ink">{departmentName}</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
            Экономист ещё не задал бюджет периода. Как только это произойдёт, здесь откроется форма
            заявки — вы получите уведомление.
          </p>
        </div>
      </UICardBody>
    </UICard>
  )
}

function Banner({
  tone,
  icon,
  title,
  children,
}: {
  tone: 'positive' | 'warning' | 'brand'
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  const styles = {
    positive: 'border-positive/30 bg-positive/8 text-positive',
    warning: 'border-warning/30 bg-warning/8 text-warning',
    brand: 'border-brand/30 bg-brand-soft text-brand-ink',
  }[tone]
  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 ${styles}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-[13px] text-muted">{children}</p>
      </div>
    </div>
  )
}

function blankItem(): DraftItem {
  return { id: crypto.randomUUID(), name: '', category: 'Оборудование', quantity: 1, unit_cost: 0, justification: '' }
}
