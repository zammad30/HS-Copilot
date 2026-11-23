import { Link } from "react-router";
import { Banner } from "@/shared/ui/Banner";
import { routes } from "@/shared/config";
import { useClassifications } from "@/entities/classification";
import { expiringWindowDays, useWorkspace } from "@/entities/workspace";
import styles from "./ExpiringBanner.module.scss";

/**
 * Warns that records are about to be removed. It never blocks the page: while
 * loading, on error, or with nothing expiring it renders nothing.
 */
export function ExpiringBanner() {
  const { data: workspace } = useWorkspace();
  // pageSize 1: only `total` is read, so no rows are transferred.
  const { data: expiring } = useClassifications({ expiring: true, pageSize: 1 });

  if (!workspace || !expiring || expiring.total === 0) return null;

  const count = expiring.total;
  const windowDays = expiringWindowDays(workspace.limits.auditRetentionDays);
  const noun = count === 1 ? "record" : "records";

  return (
    <Banner>
      <span>
        {count} {noun} will expire within {windowDays} days.{" "}
        <Link to={`${routes.library}?expiring=true`} className={styles.link}>
          Show them
        </Link>
      </span>
    </Banner>
  );
}
