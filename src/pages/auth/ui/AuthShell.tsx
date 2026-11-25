import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Logo } from "@/shared/ui/Logo";
import { Card } from "@/shared/ui/Card";
import { routes } from "@/shared/config";
import styles from "./AuthShell.module.scss";

export interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Logo onClick={() => navigate(routes.landing)} />
        <Link className={styles.backHome} to={routes.landing}>
          <ArrowLeft size={16} aria-hidden="true" />
          <span className={styles.backHomeLabel}>Back home</span>
        </Link>
      </header>

      <main id="main-content" className={styles.main}>
        <Card className={styles.card}>{children}</Card>

        <p className={styles.note}>
          <ShieldCheck size={16} aria-hidden="true" /> Suggestions require human approval before
          they are final.
        </p>
      </main>
    </div>
  );
}
