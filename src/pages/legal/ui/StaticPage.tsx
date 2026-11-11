import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { PublicHeader, PublicFooter, MobileMenu } from "@/widgets/public-shell";
import { Eyebrow } from "@/shared/ui/Eyebrow";
import { SampleLabel } from "@/shared/ui/SampleLabel";
import { routes } from "@/shared/config";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import styles from "./StaticPage.module.scss";

export interface StaticPageProps {
  title: string;
  children: ReactNode;
}

export function StaticPage({ title, children }: StaticPageProps) {
  useDocumentTitle(`${title} | HS Copilot`);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  function goHome() {
    navigate(routes.landing);
  }

  function goToApp() {
    navigate(routes.home);
  }

  function closeMenu() {
    setMenuOpen(false);
    hamburgerRef.current?.focus();
  }

  return (
    <div className={styles.page}>
      <PublicHeader
        onLogoClick={goHome}
        onOpenDemo={goToApp}
        onOpenMenu={() => setMenuOpen(true)}
        hamburgerRef={hamburgerRef}
      />
      {menuOpen && <MobileMenu onClose={closeMenu} onLogoClick={goHome} onOpenDemo={goToApp} />}

      <main className={styles.article}>
        <Link className={styles.backLink} to={routes.landing}>
          <ArrowLeft size={16} aria-hidden="true" /> Back
        </Link>
        <Eyebrow>HS Copilot</Eyebrow>
        <div className={styles.titleRow}>
          <h1>{title}</h1>
          <SampleLabel>Sample text</SampleLabel>
        </div>
        <p className={styles.notice}>
          This page contains placeholder text and is not reviewed legal copy.
        </p>
        {children}
      </main>

      <PublicFooter onLogoClick={goHome} />
    </div>
  );
}
