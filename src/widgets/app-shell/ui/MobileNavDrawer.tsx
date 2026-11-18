import type { RefObject } from "react";
import { useNavigate } from "react-router";
import { X } from "lucide-react";
import { Drawer } from "@/shared/ui/Drawer";
import { Logo } from "@/shared/ui/Logo";
import { IconButton } from "@/shared/ui/IconButton";
import { routes } from "@/shared/config";
import { SideNavigation } from "./SideNavigation";
import styles from "./MobileNavDrawer.module.scss";

export interface MobileNavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: string;
  onSignOut: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

export function MobileNavDrawer({
  open,
  onOpenChange,
  id,
  onSignOut,
  returnFocusRef,
}: MobileNavDrawerProps) {
  const navigate = useNavigate();

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title="Navigation menu"
      side="left"
      id={id}
      returnFocusRef={returnFocusRef}
    >
      <div className={styles.drawer}>
        <div className={styles.header}>
          <Logo
            onClick={() => {
              onOpenChange(false);
              navigate(routes.home);
            }}
          />
          <IconButton
            icon={<X aria-hidden="true" />}
            aria-label="Close navigation"
            onClick={() => onOpenChange(false)}
          />
        </div>
        <SideNavigation onNavigate={() => onOpenChange(false)} onSignOut={onSignOut} />
      </div>
    </Drawer>
  );
}
