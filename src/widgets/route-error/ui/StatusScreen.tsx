import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import styles from "./StatusScreen.module.scss";

export interface StatusScreenProps {
  title: string;
  description: string;
  children?: ReactNode;
  /** Fills the viewport, for the root error screen that has no surrounding layout. */
  isFullPage?: boolean;
  /** Moves focus to the heading on mount so keyboard and screen reader users notice the change. */
  shouldFocusHeading?: boolean;
}

export function StatusScreen({
  title,
  description,
  children,
  isFullPage = false,
  shouldFocusHeading = false,
}: StatusScreenProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (shouldFocusHeading) headingRef.current?.focus();
  }, [shouldFocusHeading]);

  return (
    <div className={clsx(styles.statusScreen, isFullPage && styles.fullPage)}>
      <h1 ref={headingRef} tabIndex={-1}>
        {title}
      </h1>
      <p>{description}</p>
      {children}
    </div>
  );
}
