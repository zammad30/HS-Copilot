import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { PublicHeader, PublicFooter, MobileMenu } from "@/widgets/public-shell";
import { routes } from "@/shared/config";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import styles from "./NotFoundPage.module.scss";

// This is a client-side route match, not a server response - the browser still
// receives an HTTP 200 for the document shell; there is no real 404 status to send.
export function NotFoundPage() {
  useDocumentTitle("Page not found | HS Copilot");
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

      <div className={styles.flowState}>
        <h1>Page not found</h1>
        <p>The link may be outdated or the page may have moved.</p>
        <Link className={styles.backHome} to={routes.landing}>
          <ArrowLeft size={16} aria-hidden="true" /> Back home
        </Link>
      </div>

      <PublicFooter onLogoClick={goHome} />
    </div>
  );
}
