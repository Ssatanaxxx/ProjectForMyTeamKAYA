import { getUtilizationTone } from "../../lib/budgetTone";
import { percent } from "../../lib/format";
import { Progress } from "../ui";

export const DepartmentUtilizationCell = ({
  utilization,
  overLimit,
}: {
  utilization: number;
  overLimit: boolean;
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-24">
        <Progress
          value={utilization}
          tone={getUtilizationTone(overLimit, utilization)}
        />
      </div>
      <span className="nums text-xs text-muted">{percent(utilization)}</span>
    </div>
  );
};

export default DepartmentUtilizationCell