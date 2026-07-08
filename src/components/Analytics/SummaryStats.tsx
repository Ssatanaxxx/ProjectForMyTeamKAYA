import { Wallet, Layers, CheckCircle2 } from "lucide-react";
import type { CompanySummary } from "../../lib/aggregate";
import { percent, tenge } from "../../lib/format";
import type { BudgetPeriod } from "../../lib/types";
import { Stat } from "../Stat";

export const SummaryStats = ({summary, period}: {summary: CompanySummary, period: BudgetPeriod | null}) => {
    return (
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
    )
}

export default SummaryStats