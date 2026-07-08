import { useMemo } from "react";
import type { CompanySummary } from "../../lib/aggregate";
import { Card, CardBody } from "../../components/ui";
import { EmptyChart, PlanFactBar, ShareDonut } from "../charts";

export const DeptChartsGrid = ({
  depts,
}: {
  depts: CompanySummary["depts"];
}) => {
  const barData = useMemo(
    () =>
      depts.map((d) => ({
        name: d.department.name,
        limit: d.limit,
        requested: d.requested,
      })),
    [depts],
  );

  const donutData = useMemo(
    () =>
      depts
        .filter((d) => d.requested > 0)
        .map((d) => ({ name: d.department.name, value: d.requested })),
    [depts],
  );

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardBody>
          <h3 className="mb-4 font-display text-base font-bold text-ink">
            Лимит и заявка по департаментам
          </h3>
          {barData.length > 0 ? (
            <PlanFactBar data={barData} />
          ) : (
            <EmptyChart>Пока нет департаментов</EmptyChart>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <h3 className="mb-4 font-display text-base font-bold text-ink">
            Доли департаментов в заявках
          </h3>
          <ShareDonut data={donutData} />
        </CardBody>
      </Card>
    </div>
  );
};


export default DeptChartsGrid