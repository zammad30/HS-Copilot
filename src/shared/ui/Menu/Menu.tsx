import type { ReactElement, ReactNode } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Link } from "react-router";
import clsx from "clsx";
import styles from "./Menu.module.scss";

export interface MenuItemConfig {
  label: string;
  icon?: ReactNode;
  onSelect?: () => void;
  href?: string;
  disabled?: boolean;
  /** Native tooltip explaining why the item is disabled. */
  title?: string;
}

export interface MenuProps {
  trigger: ReactElement;
  items: MenuItemConfig[];
  align?: "start" | "end";
  header?: ReactNode;
  footer?: ReactNode;
}

export function Menu({ trigger, items, align = "end", header, footer }: MenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={styles.content}
          align={align}
          sideOffset={4}
          collisionPadding={8}
        >
          {header && <div className={styles.header}>{header}</div>}
          {items.map((item) =>
            item.href ? (
              <DropdownMenu.Item
                key={item.label}
                asChild
                className={styles.item}
                disabled={item.disabled}
              >
                <Link to={item.href} title={item.title}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </DropdownMenu.Item>
            ) : (
              <DropdownMenu.Item
                key={item.label}
                className={clsx(styles.item, styles.itemButton)}
                onSelect={item.onSelect}
                disabled={item.disabled}
                title={item.title}
              >
                {item.icon}
                <span>{item.label}</span>
              </DropdownMenu.Item>
            ),
          )}
          {footer && <p className={styles.footer}>{footer}</p>}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
