import { Link } from "react-router";
import { Banner } from "@/shared/ui/Banner";
import { routes } from "@/shared/config";
import styles from "./PlanLimitNotice.module.scss";

export interface PlanLimitNoticeProps {
  message: string;
  /** Lets a disabled control point at the notice with aria-describedby. */
  id?: string;
}

export function PlanLimitNotice({ message, id }: PlanLimitNoticeProps) {
  return (
    <Banner id={id}>
      {message}{" "}
      <Link to={routes.pricing} className={styles.link}>
        See plans
      </Link>
    </Banner>
  );
}
