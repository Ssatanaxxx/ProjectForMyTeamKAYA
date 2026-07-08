import { AlertTriangle } from "lucide-react";
import type { CompanySummary } from "../../lib/aggregate";
import { tenge } from "../../lib/format";

export const OverBudgetBanner = ({ summary }: { summary: CompanySummary }) => {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/8 p-4">
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
      <div>
        <p className="text-sm font-semibold text-ink">
          Заявки превышают общий бюджет
        </p>
        <p className="text-[13px] text-muted">
          Суммарно департаменты запросили {tenge(summary.totalRequested)} при
          бюджете{" "} {tenge(summary.totalBudget)}. Перерасход{" "}
          {tenge(summary.totalRequested - summary.totalBudget)}.
        </p>
      </div>
    </div>
  );
};

export default OverBudgetBanner
