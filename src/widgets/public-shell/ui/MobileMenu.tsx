import { useEffect } from "react";
import { Link } from "react-router";
import { X } from "lucide-react";
import { Logo } from "@/shared/ui/Logo";
import { Button } from "@/shared/ui/Button";
import { IconButton } from "@/shared/ui/IconButton";
import { routes } from "@/shared/config";
import styles from "./MobileMenu.module.scss";

export interface MobileMenuProps {
  onClose: () => void;
  onLogoClick: () => void;
  onOpenDemo: () => void;
}

const LINKS = [
  { label: "Methodology", to: routes.methodology },
  { label: "Sign in", to: routes.signIn },
  { label: "Privacy", to: routes.privacy },
  { label: "Terms", to: routes.terms },
] as const;

export function MobileMenu({ onClose, onLogoClick, onOpenDemo }: MobileMenuProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className={styles.menu}>
      <div className={styles.top}>
        <Logo
          onClick={() => {
            onClose();
            onLogoClick();
          }}
        />
        <IconButton icon={<X />} aria-label="Close menu" onClick={onClose} />
      </div>
      <nav className={styles.nav}>
        {LINKS.map((link) => (
          <Link key={link.to} to={link.to} className={styles.link} onClick={onClose}>
            {link.label}
          </Link>
        ))}
      </nav>
      <Button
        className={styles.cta}
        onClick={() => {
          onClose();
          onOpenDemo();
        }}
      >
        Open demo workspace
      </Button>
    </div>
  );
}
