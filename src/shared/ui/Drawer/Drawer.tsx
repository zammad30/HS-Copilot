import type { ReactNode, RefObject } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import styles from "./Drawer.module.scss";

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  side?: "left" | "right";
  id?: string;
  /**
   * Radix only restores focus to a `Dialog.Trigger` on close. This Drawer is
   * always opened by an external button (the hamburger), so without this the
   * trigger never gets focus back - pass its ref to restore it manually.
   */
  returnFocusRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
}

export function Drawer({
  open,
  onOpenChange,
  title,
  side = "right",
  id,
  returnFocusRef,
  children,
}: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          id={id}
          className={clsx(styles.content, styles[side])}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocusRef?.current?.focus();
          }}
        >
          <Dialog.Title className={styles.visuallyHiddenTitle}>{title}</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
