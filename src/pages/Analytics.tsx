import { OverBudgetBanner } from '../components/Analytics/OverBudgetBanner'
import { SummaryStats } from '../components/Analytics/SummaryStats'
import { DeptChartsGrid } from '../components/Analytics/DeptChartsGrid'
import { DepartmentsTable } from '../components/Analytics/DepartmentsTable'
import type { CompanySummary } from '../lib/aggregate'
import type { BudgetPeriod } from '../lib/types'

export const Analytics = ({ summary, period }: { summary: CompanySummary; period: BudgetPeriod | null }) => {
  
  return (
   <div className="space-y-6">
      {summary.overBudget && <OverBudgetBanner summary={summary} />}
      <SummaryStats summary={summary} period={period} />
      <DeptChartsGrid depts={summary.depts} />
      <DepartmentsTable depts={summary.depts} />
    </div>
  )
}

export default Analytics