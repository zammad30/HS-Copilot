import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { FolderSearch2, Plus, SearchX, X } from "lucide-react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Card } from "@/shared/ui/Card";
import { SearchField } from "@/shared/ui/SearchField";
import { Checkbox } from "@/shared/ui/Checkbox";
import { Skeleton } from "@/shared/ui/Skeleton";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { Button } from "@/shared/ui/Button";
import { IconButton } from "@/shared/ui/IconButton";
import { Pagination } from "@/shared/ui/Pagination";
import { useClassifications } from "@/entities/classification";
import type { Status } from "@/entities/classification";
import { routes } from "@/shared/config";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { ClassificationTable } from "@/widgets/classification-table";
import { ExpiringBanner } from "@/widgets/expiring-banner";
import {
  PAGE_SIZE,
  STATUS_FILTER_OPTIONS,
  parseExpiringParam,
  parsePageParam,
  parseStatusParam,
} from "../model/libraryParams";
import styles from "./LibraryPage.module.scss";

const DEBOUNCE_MS = 300;

export function LibraryPage() {
  useDocumentTitle("Library");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const qParam = searchParams.get("q") ?? "";
  const statuses = parseStatusParam(searchParams.get("status"));
  const page = parsePageParam(searchParams.get("page"));
  const isExpiring = parseExpiringParam(searchParams.get("expiring"));

  const [searchText, setSearchText] = useState(qParam);
  const [syncedQParam, setSyncedQParam] = useState(qParam);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keep local input in sync when the URL changes from outside (Back/Forward,
  // "Clear filters", or Home's "Review all" link landing with a different q).
  // Adjusted during render, not an effect, per React's "you might not need an
  // effect" guidance - this is a pure derivation, not a side effect.
  if (qParam !== syncedQParam) {
    setSyncedQParam(qParam);
    setSearchText(qParam);
  }

  useEffect(() => {
    if (searchText === qParam) return;
    const handle = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (searchText) next.set("q", searchText);
      else next.delete("q");
      next.set("page", "1");
      setSearchParams(next, { replace: true });
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // searchParams is intentionally excluded: including it would re-run this
    // effect (and restart the debounce) on every page/status change too.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, qParam]);

  const { data, isPending, isFetching, isError, refetch } = useClassifications({
    search: qParam || undefined,
    status: statuses.length > 0 ? statuses : undefined,
    expiring: isExpiring || undefined,
    page,
    pageSize: PAGE_SIZE,
    sort: "-updatedAt",
  });

  useEffect(() => {
    if (!data || data.total === 0) return;
    const lastPage = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
    if (page > lastPage) {
      const next = new URLSearchParams(searchParams);
      next.set("page", String(lastPage));
      setSearchParams(next, { replace: true });
    }
    // Only re-clamp when the data or the current page actually change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, page]);

  function handleStatusChange(status: Status, checked: boolean) {
    const next = new Set(statuses);
    if (checked) next.add(status);
    else next.delete(status);
    const params = new URLSearchParams(searchParams);
    if (next.size > 0) params.set("status", Array.from(next).join(","));
    else params.delete("status");
    params.set("page", "1");
    setSearchParams(params);
  }

  function handlePageChange(nextPage: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(nextPage));
    setSearchParams(params);
  }

  function handleClearFilters() {
    setSearchText("");
    const next = new URLSearchParams(searchParams);
    next.delete("q");
    next.delete("status");
    next.delete("expiring");
    next.delete("page");
    setSearchParams(next);
    searchInputRef.current?.focus();
  }

  function handleClearExpiring() {
    const next = new URLSearchParams(searchParams);
    next.delete("expiring");
    next.delete("page");
    setSearchParams(next);
  }

  const hasActiveFilters = qParam !== "" || statuses.length > 0 || isExpiring;
  const isOnlyExpiring = isExpiring && qParam === "" && statuses.length === 0;

  return (
    <div className={styles.page}>
      <PageHeader title="Classification library" description="Search every reviewed decision." />

      {!isExpiring && <ExpiringBanner />}

      <div className={styles.controls}>
        <SearchField
          ref={searchInputRef}
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          aria-label="Search classifications"
          placeholder="Search products or HS codes"
          className={styles.search}
        />
        <fieldset className={styles.statusFieldset}>
          <legend className={styles.statusLegend}>Status</legend>
          <div className={styles.statusOptions}>
            {STATUS_FILTER_OPTIONS.map((option) => (
              <Checkbox
                key={option.value}
                label={option.label}
                checked={statuses.includes(option.value)}
                onChange={(event) => handleStatusChange(option.value, event.target.checked)}
              />
            ))}
          </div>
        </fieldset>
        {isExpiring && (
          <div className={styles.chip}>
            <span>Expiring soon</span>
            <IconButton
              icon={<X aria-hidden="true" size={16} />}
              aria-label="Remove filter: Expiring soon"
              onClick={handleClearExpiring}
              className={styles.chipRemove}
            />
          </div>
        )}
        {hasActiveFilters && (
          <Button variant="secondary" onClick={handleClearFilters} className={styles.clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {isError ? (
        <Card>
          <ErrorState title="We couldn't load the library" onRetry={() => refetch()} />
        </Card>
      ) : (
        <>
          <Card>
            {isPending ? (
              <LibraryTableSkeleton />
            ) : (
              <ClassificationTable
                items={data?.items ?? []}
                showUpdated
                isFetching={isFetching}
                emptyState={
                  isOnlyExpiring ? (
                    <EmptyState
                      icon={<SearchX />}
                      title="No records are expiring soon."
                      action={
                        <Button variant="secondary" onClick={handleClearExpiring}>
                          Clear filter
                        </Button>
                      }
                    />
                  ) : hasActiveFilters ? (
                    <EmptyState
                      icon={<SearchX />}
                      title="No classifications match these filters."
                      action={
                        <Button variant="secondary" onClick={handleClearFilters}>
                          Clear filters
                        </Button>
                      }
                    />
                  ) : (
                    <EmptyState
                      icon={<FolderSearch2 />}
                      title="No classifications yet"
                      description="Start with one product to build your reviewed library."
                      action={
                        <Button
                          icon={<Plus aria-hidden="true" />}
                          onClick={() => navigate(routes.classifyNew)}
                        >
                          New classification
                        </Button>
                      }
                    />
                  )
                }
              />
            )}
          </Card>

          {!isPending && (data?.total ?? 0) > 0 && (
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={data?.total ?? 0}
              onPageChange={handlePageChange}
              label="Library"
            />
          )}
        </>
      )}
    </div>
  );
}

function LibraryTableSkeleton() {
  const columnCount = 6;
  const rowCount = 6;
  return (
    <div className={styles.skeletonTable} aria-hidden="true">
      <div className={styles.skeletonRow}>
        {Array.from({ length: columnCount }, (_, index) => (
          <Skeleton key={index} lines={1} />
        ))}
      </div>
      {Array.from({ length: rowCount }, (_, rowIndex) => (
        <div key={rowIndex} className={styles.skeletonRow}>
          {Array.from({ length: columnCount }, (_, columnIndex) => (
            <Skeleton key={columnIndex} lines={1} />
          ))}
        </div>
      ))}
    </div>
  );
}
