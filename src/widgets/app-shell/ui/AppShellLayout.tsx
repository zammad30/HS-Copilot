import { useId, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { useSession, useSignOut } from "@/entities/session";
import { Logo } from "@/shared/ui/Logo";
import { routes } from "@/shared/config";
import { HealthGate } from "./HealthGate";
import { SideNavigation } from "./SideNavigation";
import { Topbar } from "./Topbar";
import { MobileNavDrawer } from "./MobileNavDrawer";
import styles from "./AppShellLayout.module.scss";

export function AppShellLayout() {
  const session = useSession();
  const signOut = useSignOut();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileNavId = useId();
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className={styles.shell}>
      <a href="#main-content" className={styles.skipLink}>
        Skip to content
      </a>
      <nav className={styles.sidebar} aria-label="Primary">
        <div className={styles.brand}>
          <Logo onClick={() => navigate(routes.home)} />
        </div>
        <SideNavigation onSignOut={signOut} />
      </nav>
      <MobileNavDrawer
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        id={mobileNavId}
        onSignOut={signOut}
        returnFocusRef={hamburgerRef}
      />
      <div className={styles.main}>
        <Topbar
          mobileNavOpen={mobileNavOpen}
          onToggleMobileNav={() => setMobileNavOpen((open) => !open)}
          mobileNavId={mobileNavId}
          hamburgerRef={hamburgerRef}
          workspaceName={session?.workspaceName}
          accountName={session?.name}
          accountEmail={session?.email ?? ""}
          onSignOut={signOut}
        />
        <main id="main-content" className={styles.content}>
          <HealthGate>
            <Outlet />
          </HealthGate>
        </main>
      </div>
    </div>
  );
}
