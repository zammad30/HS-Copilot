import type { Ref } from "react";
import { CircleHelp, FileSearch, LogOut, Menu as MenuIcon, Settings, User, X } from "lucide-react";
import { IconButton } from "@/shared/ui/IconButton";
import { Button } from "@/shared/ui/Button";
import { Menu } from "@/shared/ui/Menu";
import { routes } from "@/shared/config";
import styles from "./Topbar.module.scss";

export interface TopbarProps {
  mobileNavOpen: boolean;
  onToggleMobileNav: () => void;
  mobileNavId: string;
  hamburgerRef?: Ref<HTMLButtonElement>;
  workspaceName?: string;
  accountName?: string;
  accountEmail: string;
  onSignOut: () => void;
}

export function Topbar({
  mobileNavOpen,
  onToggleMobileNav,
  mobileNavId,
  hamburgerRef,
  workspaceName,
  accountName,
  accountEmail,
  onSignOut,
}: TopbarProps) {
  return (
    <header className={styles.topbar}>
      <div className={styles.start}>
        <IconButton
          ref={hamburgerRef}
          className={styles.hamburger}
          icon={mobileNavOpen ? <X aria-hidden="true" /> : <MenuIcon aria-hidden="true" />}
          aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileNavOpen}
          aria-controls={mobileNavId}
          onClick={onToggleMobileNav}
        />
        <span className={styles.workspace}>{workspaceName ?? "Workspace"}</span>
      </div>
      <div className={styles.actions}>
        <Menu
          trigger={
            <Button variant="ghost" icon={<CircleHelp aria-hidden="true" />}>
              Help
            </Button>
          }
          items={[
            {
              label: "How classification works",
              href: routes.methodology,
              icon: <FileSearch aria-hidden="true" />,
            },
          ]}
          footer="Suggestions are not legal advice."
        />
        <Menu
          trigger={
            <IconButton
              className={styles.avatarButton}
              icon={<User aria-hidden="true" />}
              aria-label="Open account menu"
            />
          }
          header={
            <>
              {accountName && <strong>{accountName}</strong>}
              <span>{accountEmail}</span>
            </>
          }
          items={[
            {
              label: "Account settings",
              href: routes.settingsGeneral,
              icon: <Settings aria-hidden="true" />,
            },
            { label: "Sign out", onSelect: onSignOut, icon: <LogOut aria-hidden="true" /> },
          ]}
        />
      </div>
    </header>
  );
}
