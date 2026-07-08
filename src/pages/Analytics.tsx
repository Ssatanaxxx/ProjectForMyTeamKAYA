import { AlertTriangle, CheckCircle2, Layers, Wallet } from 'lucide-react'
import { Card, CardBody, Progress } from '../components/ui'
import { Stat } from '../components/Stat'
import { PlanFactBar, ShareDonut, EmptyChart } from '../components/charts'
import { tenge, percent } from '../lib/format'
import type { CompanySummary } from '../lib/aggregate'
import type { BudgetPeriod } from '../lib/types'

export function Analytics({ summary, period }: { summary: CompanySummary; period: BudgetPeriod | null }) {
  const barData = summary.depts.map((d) => ({
    name: d.department.name,
    limit: d.limit,
    requested: d.requested,
  }))
  const donutData = summary.depts
    .filter((d) => d.requested > 0)
    .map((d) => ({ name: d.department.name, value: d.requested }))

  return (
    <div className="space-y-6">
      {summary.overBudget && (
        <div className="flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/8 p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
          <div>
            <p className="text-sm font-semibold text-ink">Заявки превышают общий бюджет</p>
            <p className="text-[13px] text-muted">
              Суммарно департаменты запросили {tenge(summary.totalRequested)} при бюджете{' '}
              {tenge(summary.totalBudget)}. Перерасход {tenge(summary.totalRequested - summary.totalBudget)}.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Общий бюджет" value={tenge(summary.totalBudget)} icon={<Wallet size={16} />} sub={period?.title} />
        <Stat
          label="Заявлено департаментами"
          value={tenge(summary.totalRequested)}
          tone={summary.overBudget ? 'danger' : 'brand'}
          sub={`Исполнение ${percent(summary.overallUtilization)}`}
        />
        <Stat
          label="Остаток бюджета"
          value={tenge(summary.totalRemaining)}
          tone={summary.totalRemaining < 0 ? 'danger' : 'positive'}
          icon={<Layers size={16} />}
        />
        <Stat
          label="На проверке / превышений"
          value={`${summary.pendingCount} / ${summary.overLimitCount}`}
          tone={summary.overLimitCount > 0 ? 'warning' : 'default'}
          icon={<CheckCircle2 size={16} />}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardBody>
            <h3 className="mb-4 font-display text-base font-bold text-ink">Лимит и заявка по департаментам</h3>
            {barData.length > 0 ? <PlanFactBar data={barData} /> : <EmptyChart>Пока нет департаментов</EmptyChart>}
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h3 className="mb-4 font-display text-base font-bold text-ink">Доли департаментов в заявках</h3>
            <ShareDonut data={donutData} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody>
          <h3 className="mb-4 font-display text-base font-bold text-ink">Департаменты</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th className="py-2 pr-3 font-medium">Департамент</th>
                  <th className="px-3 py-2 text-right font-medium">Лимит</th>
                  <th className="px-3 py-2 text-right font-medium">Заявлено</th>
                  <th className="px-3 py-2 text-right font-medium">Остаток</th>
                  <th className="px-3 py-2 font-medium">Исполнение</th>
                  <th className="px-3 py-2 text-right font-medium">Доля</th>
                </tr>
              </thead>
              <tbody>
                {summary.depts.map((d) => (
                  <tr key={d.department.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-3 font-medium text-ink">{d.department.name}</td>
                    <td className="nums px-3 py-2.5 text-right text-muted">{tenge(d.limit)}</td>
                    <td className="nums px-3 py-2.5 text-right font-semibold text-ink">{tenge(d.requested)}</td>
                    <td className={`nums px-3 py-2.5 text-right ${d.remaining < 0 ? 'text-danger' : 'text-muted'}`}>
                      {tenge(d.remaining)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <Progress
                            value={d.utilization}
                            tone={d.overLimit ? 'danger' : d.utilization > 85 ? 'warning' : 'brand'}
                          />
                        </div>
                        <span className="nums text-xs text-muted">{percent(d.utilization)}</span>
                      </div>
                    </td>
                    <td className="nums px-3 py-2.5 text-right text-muted">{percent(d.share)}</td>
                  </tr>
                ))}
                {summary.depts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-faint">
                      Департаменты появятся, когда руководители войдут в компанию
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
