import { NavLink, Outlet } from "react-router";
import clsx from "clsx";
import { PageHeader } from "@/shared/ui/PageHeader";
import { routes } from "@/shared/config";
import styles from "./SettingsLayout.module.scss";

const NAV_ITEMS = [
  { label: "General", to: routes.settingsGeneral },
  { label: "Members", to: routes.settingsMembers },
  { label: "Review rules", to: routes.settingsRules },
] as const;

export function SettingsLayout() {
  const linkClassName = ({ isActive }: { isActive: boolean }) =>
    clsx(styles.link, isActive && styles.active);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Settings & team"
        description="Manage workspace defaults, members, and review roles."
      />
      <div className={styles.grid}>
        <nav className={styles.nav} aria-label="Settings">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end className={linkClassName}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
