import type { ReactNode, RefObject } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import styles from "./Modal.module.scss";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /**
   * Radix only restores focus to a `Dialog.Trigger` on close. This Modal is
   * always opened by an external button (a menu item, a page action), so
   * without this the trigger never gets focus back — pass its ref to
   * restore it manually.
   */
  returnFocusRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  returnFocusRef,
  children,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          className={styles.content}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocusRef?.current?.focus();
          }}
        >
          <Dialog.Title className={styles.title}>{title}</Dialog.Title>
          {description && (
            <Dialog.Description className={styles.description}>{description}</Dialog.Description>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
