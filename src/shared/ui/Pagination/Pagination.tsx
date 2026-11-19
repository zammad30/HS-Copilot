import { useEffect, useRef, useState } from "react";
import { Button } from "../Button";
import styles from "./Pagination.module.scss";

export interface PaginationProps {
  /** 1-based current page. */
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Overrides the nav's accessible name. Defaults to "Pagination". */
  label?: string;
}

export function Pagination({ page, pageSize, total, onPageChange, label }: PaginationProps) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const isFirstPage = page <= 1;
  const isLastPage = page >= lastPage;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const previousButtonRef = useRef<HTMLButtonElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const [lastClicked, setLastClicked] = useState<"previous" | "next" | null>(null);

  useEffect(() => {
    if (lastClicked === "next" && isLastPage) {
      previousButtonRef.current?.focus();
    } else if (lastClicked === "previous" && isFirstPage) {
      nextButtonRef.current?.focus();
    }
    // Runs only when the page settles, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <nav className={styles.wrap} aria-label={label ?? "Pagination"}>
      <span className={styles.range} aria-live="polite">
        Showing {from}–{to} of {total}
      </span>
      <div className={styles.buttons}>
        <Button
          ref={previousButtonRef}
          variant="secondary"
          disabled={isFirstPage}
          onClick={() => {
            setLastClicked("previous");
            onPageChange(page - 1);
          }}
        >
          Previous
        </Button>
        <Button
          ref={nextButtonRef}
          variant="secondary"
          disabled={isLastPage}
          onClick={() => {
            setLastClicked("next");
            onPageChange(page + 1);
          }}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
