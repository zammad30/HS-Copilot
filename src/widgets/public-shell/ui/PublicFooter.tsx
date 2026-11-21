import { Link } from "react-router";
import { Logo } from "@/shared/ui/Logo";
import { routes } from "@/shared/config";
import styles from "./PublicFooter.module.scss";

export interface PublicFooterProps {
  onLogoClick: () => void;
}

export function PublicFooter({ onLogoClick }: PublicFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <Logo onClick={onLogoClick} />
        <p className={styles.tagline}>AI-assisted research. Human-reviewed decisions.</p>
        <div className={styles.links}>
          <Link to={routes.methodology}>Methodology</Link>
          <Link to={routes.pricing}>Pricing</Link>
          <Link to={routes.privacy}>Privacy</Link>
          <Link to={routes.terms}>Terms</Link>
          <span>© 2026</span>
        </div>
      </div>
    </footer>
  );
}
