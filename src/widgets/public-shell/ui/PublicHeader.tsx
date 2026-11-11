import type { Ref } from "react";
import { Link } from "react-router";
import { Menu } from "lucide-react";
import { Logo } from "@/shared/ui/Logo";
import { Button } from "@/shared/ui/Button";
import { IconButton } from "@/shared/ui/IconButton";
import { routes } from "@/shared/config";
import styles from "./PublicHeader.module.scss";

export interface PublicHeaderProps {
  onLogoClick: () => void;
  onOpenDemo: () => void;
  onOpenMenu: () => void;
  hamburgerRef: Ref<HTMLButtonElement>;
}

const NAV_LINKS = [
  { label: "Methodology", to: routes.methodology },
  { label: "Sign in", to: routes.signIn },
] as const;

export function PublicHeader({
  onLogoClick,
  onOpenDemo,
  onOpenMenu,
  hamburgerRef,
}: PublicHeaderProps) {
  return (
    <nav className={styles.nav}>
      <Logo onClick={onLogoClick} />
      <div className={styles.links}>
        {NAV_LINKS.map((link) => (
          <Link key={link.to} to={link.to} className={styles.navLink}>
            {link.label}
          </Link>
        ))}
        <Button onClick={onOpenDemo}>Open demo</Button>
      </div>
      <IconButton
        ref={hamburgerRef}
        className={styles.mobileMenuButton}
        icon={<Menu />}
        aria-label="Open menu"
        onClick={onOpenMenu}
      />
    </nav>
  );
}
