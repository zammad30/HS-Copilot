import { Link } from "react-router";
import { Card } from "@/shared/ui/Card";
import { Skeleton } from "@/shared/ui/Skeleton";
import { routes } from "@/shared/config";
import {
  formatBatchUsage,
  formatClassificationsUsage,
  formatResetsOn,
  formatRetention,
  formatUsageCount,
  usePlans,
  useWorkspace,
} from "@/entities/workspace";
import styles from "./PlanUsageCard.module.scss";

export function PlanUsageCard() {
  const workspace = useWorkspace();
  const plans = usePlans();

  // Read-only extra: when it cannot load, the rest of Settings stays as it is.
  if (workspace.isError) return null;

  if (workspace.isPending || plans.isPending) {
    return (
      <Card className={styles.card}>
        <h2>Plan and usage</h2>
        <Skeleton lines={5} />
      </Card>
    );
  }

  const { plan, limits, usage } = workspace.data;
  const planName = plans.data?.items.find((item) => item.id === plan)?.name;
  const classifications = formatClassificationsUsage(
    usage.classificationsUsed,
    limits.classifications,
  );
  const resets =
    limits.classifications.period === "month" && usage.periodEnd
      ? formatResetsOn(usage.periodEnd)
      : undefined;

  return (
    <Card className={styles.card}>
      <h2>Plan and usage</h2>
      <dl className={styles.list}>
        {planName && (
          <div className={styles.row}>
            <dt>Plan</dt>
            <dd>{planName}</dd>
          </div>
        )}
        <div className={styles.row}>
          <dt>Classifications</dt>
          <dd>
            {classifications}
            {resets && <span className={styles.note}>{resets}</span>}
          </dd>
        </div>
        <div className={styles.row}>
          <dt>People</dt>
          <dd>{formatUsageCount(usage.seatsUsed, limits.seats)}</dd>
        </div>
        <div className={styles.row}>
          <dt>Batch uploads</dt>
          <dd>{formatBatchUsage(usage.batchUploadsUsed, limits.batch)}</dd>
        </div>
        <div className={styles.row}>
          <dt>Second approver</dt>
          <dd>{limits.secondApprover ? "Included" : "Not included"}</dd>
        </div>
        <div className={styles.row}>
          <dt>Audit trail kept for</dt>
          <dd>{formatRetention(limits.auditRetentionDays)}</dd>
        </div>
      </dl>
      <Link to={routes.pricing} className={styles.link}>
        See plans
      </Link>
    </Card>
  );
}
