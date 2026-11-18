import { NavLink } from "react-router";
import { Home, Plus, Upload, Library, Settings, LogOut } from "lucide-react";
import clsx from "clsx";
import { routes } from "@/shared/config";
import styles from "./SideNavigation.module.scss";

export interface SideNavigationProps {
  onNavigate?: () => void;
  onSignOut: () => void;
}

const NAV_ITEMS = [
  { label: "Workspace", to: routes.home, icon: <Home aria-hidden="true" /> },
  { label: "New classification", to: routes.classifyNew, icon: <Plus aria-hidden="true" /> },
  { label: "Batch review", to: routes.batchUpload, icon: <Upload aria-hidden="true" /> },
  { label: "Library", to: routes.library, icon: <Library aria-hidden="true" /> },
] as const;

export function SideNavigation({ onNavigate, onSignOut }: SideNavigationProps) {
  const linkClassName = ({ isActive }: { isActive: boolean }) =>
    clsx(styles.link, isActive && styles.active);

  return (
    <>
      <div className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end className={linkClassName} onClick={onNavigate}>
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
      <div className={styles.bottom}>
        <NavLink to={routes.settingsGeneral} end className={linkClassName} onClick={onNavigate}>
          <Settings aria-hidden="true" />
          <span>Settings &amp; team</span>
        </NavLink>
        <button
          type="button"
          className={styles.link}
          onClick={() => {
            onNavigate?.();
            onSignOut();
          }}
        >
          <LogOut aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </div>
    </>
  );
}
