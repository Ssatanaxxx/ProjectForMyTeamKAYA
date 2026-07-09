import type { CompanySummary } from "../../lib/aggregate";
import { percent, tenge } from "../../lib/format";
import { UICard, UICardBody } from "../UI/index";
import DepartmentUtilizationCell from "./DepartmentUtilizationCell";

export const DepartmentsTable = ({
  depts,
}: {
  depts: CompanySummary["depts"];
}) => {
  return (
    <UICard>
      <UICardBody>
        <h3 className="mb-4 font-display text-base font-bold text-ink">
          Департаменты
        </h3>
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
              {depts.map((d) => (
                <tr
                  key={d.department.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="py-2.5 pr-3 font-medium text-ink">
                    {d.department.name}
                  </td>
                  <td className="nums px-3 py-2.5 text-right text-muted">
                    {tenge(d.limit)}
                  </td>
                  <td className="nums px-3 py-2.5 text-right font-semibold text-ink">
                    {tenge(d.requested)}
                  </td>
                  <td
                    className={`nums px-3 py-2.5 text-right ${d.remaining < 0 ? "text-danger" : "text-muted"}`}
                  >
                    {tenge(d.remaining)}
                  </td>
                  <td className="px-3 py-2.5">
                    <DepartmentUtilizationCell
                      utilization={d.utilization}
                      overLimit={d.overLimit}
                    />
                  </td>
                  <td className="nums px-3 py-2.5 text-right text-muted">
                    {percent(d.share)}
                  </td>
                </tr>
              ))}
              {depts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-faint">
                    Департаменты появятся, когда руководители войдут в компанию
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </UICardBody>
    </UICard>
  );
};

export default DepartmentsTable;
