import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { Check, FolderSearch2, SearchX, Upload } from "lucide-react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Card } from "@/shared/ui/Card";
import { Banner } from "@/shared/ui/Banner";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { SearchField } from "@/shared/ui/SearchField";
import { Checkbox } from "@/shared/ui/Checkbox";
import { Skeleton } from "@/shared/ui/Skeleton";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { Pagination } from "@/shared/ui/Pagination";
import { useToast } from "@/shared/ui/Toast";
import { ApiError } from "@/shared/api";
import { useBatch, useBatchItems } from "@/entities/batch";
import { jurisdictionLabel } from "@/entities/classification";
import type { Status } from "@/entities/classification";
import { useReviewRules } from "@/entities/review-rule";
import { routes } from "@/shared/config";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { formatRelativeStart } from "@/shared/lib/formatDate";
import { ClassificationTable } from "@/widgets/classification-table";
import {
  PAGE_SIZE,
  STATUS_FILTER_OPTIONS,
  parsePageParam,
  parseStatusParam,
} from "../model/reviewParams";
import { usePauseBatch, useResumeBatch, useBulkApprove } from "../api/useBatchControls";
import styles from "./BatchReviewPage.module.scss";

const DEFAULT_THRESHOLD = 90;
const BULK_APPROVE_SCAN_SIZE = 500;
const DEBOUNCE_MS = 300;

export function BatchReviewPage() {
  const { id = "" } = useParams();
  useDocumentTitle("Batch review | HS Copilot");
  const navigate = useNavigate();
  const { show } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  const statuses = parseStatusParam(searchParams.get("status"));
  const page = parsePageParam(searchParams.get("page"));
  const qParam = searchParams.get("q") ?? "";

  const [searchText, setSearchText] = useState(qParam);
  const [syncedQParam, setSyncedQParam] = useState(qParam);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keep local input in sync when the URL changes from outside (Back/Forward,
  // "Clear filters"). Adjusted during render, not an effect - a pure derivation.
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
    // searchParams is intentionally excluded: including it would restart the
    // debounce on every page/status change too.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, qParam]);

  const batchQuery = useBatch(id);
  const batch = batchQuery.data;
  const reviewRulesQuery = useReviewRules();
  const threshold = reviewRulesQuery.data?.highlightAbove ?? DEFAULT_THRESHOLD;

  const itemsQuery = useBatchItems(id, {
    search: qParam || undefined,
    status: statuses.length > 0 ? statuses : undefined,
    page,
    pageSize: PAGE_SIZE,
    sort: "-updatedAt",
  });

  // A separate, unfiltered scan of all this batch's items (bounded by the
  // 500-row upload cap) to derive the bulk-approve count and the confirm
  // modal's copy - the filtered/paginated query above only has the current page.
  const allItemsQuery = useBatchItems(id, { pageSize: BULK_APPROVE_SCAN_SIZE });
  const eligibleCount = (allItemsQuery.data?.items ?? []).filter(
    (item) => item.confidence >= threshold && item.status !== "approved",
  ).length;

  const pauseMutation = usePauseBatch(id);
  const resumeMutation = useResumeBatch(id);
  const bulkApproveMutation = useBulkApprove(id);

  const notFound =
    batchQuery.isError &&
    batchQuery.error instanceof ApiError &&
    batchQuery.error.code === "not_found";
  const loadFailed = batchQuery.isError && !notFound;

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
    next.delete("page");
    setSearchParams(next);
    searchInputRef.current?.focus();
  }

  function handleBulkApproveConfirmed() {
    bulkApproveMutation.mutate(threshold, {
      onSuccess: (result) => {
        setBulkModalOpen(false);
        show(`${result.approvedCount} classifications approved`, { tone: "success" });
      },
      onError: () => {
        setBulkModalOpen(false);
        show("We couldn't approve those classifications.");
      },
    });
  }

  if (notFound) {
    return (
      <div>
        <PageHeader eyebrow="Batch review" title="Batch not found" />
        <EmptyState
          icon={<FolderSearch2 />}
          title="We couldn't find this batch."
          action={<Button onClick={() => navigate(routes.batchUpload)}>Upload a new batch</Button>}
        />
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div>
        <PageHeader eyebrow="Batch review" title="Batch review" />
        <Card className={styles.errorCard}>
          <ErrorState title="We couldn't load this batch" onRetry={() => batchQuery.refetch()} />
        </Card>
      </div>
    );
  }

  if (batchQuery.isPending || !batch) {
    return (
      <div>
        <PageHeader eyebrow="Batch review" title="Batch review" />
        <Card className={styles.skeletonCard}>
          <Skeleton lines={6} />
        </Card>
      </div>
    );
  }

  const filename = batch.filename.replace(/\.[^./]+$/, "");
  const hasActiveFilters = qParam !== "" || statuses.length > 0;
  const isProcessing = batch.status !== "complete";

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Batch review"
        title={filename}
        description={`${batch.total} products · ${jurisdictionLabel(batch.jurisdiction)} · Started ${formatRelativeStart(batch.startedAt)}`}
        action={
          <Button
            variant="secondary"
            icon={<Upload aria-hidden="true" size={16} />}
            onClick={() => navigate(routes.batchUpload)}
          >
            Upload batch
          </Button>
        }
      />

      {isProcessing && (
        <Banner
          action={
            batch.status === "paused" ? (
              <Button variant="ghost" onClick={() => resumeMutation.mutate()}>
                Resume
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => pauseMutation.mutate()}>
                Pause
              </Button>
            )
          }
        >
          {batch.classified} of {batch.total} classified &middot;{" "}
          {batch.status === "processing"
            ? "Processing"
            : batch.status === "throttled"
              ? "Throttled"
              : "Paused"}
        </Banner>
      )}

      <Button
        variant="approve"
        icon={<Check aria-hidden="true" size={16} />}
        disabled={eligibleCount === 0}
        onClick={() => setBulkModalOpen(true)}
        className={styles.bulkApprove}
      >
        Approve {eligibleCount} above {threshold}%
      </Button>

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
        {hasActiveFilters && (
          <Button variant="secondary" onClick={handleClearFilters} className={styles.clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      <Card>
        {itemsQuery.isPending ? (
          <div className={styles.tableSkeleton}>
            <Skeleton lines={6} />
          </div>
        ) : (
          <ClassificationTable
            items={itemsQuery.data?.items ?? []}
            density="compact"
            isFetching={itemsQuery.isFetching}
            emptyState={
              hasActiveFilters ? (
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
                <EmptyState icon={<FolderSearch2 />} title="No classifications yet" />
              )
            }
          />
        )}
      </Card>

      {!itemsQuery.isPending && (itemsQuery.data?.total ?? 0) > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={itemsQuery.data?.total ?? 0}
          onPageChange={handlePageChange}
          label="Batch review"
        />
      )}

      <Modal
        open={bulkModalOpen}
        onOpenChange={setBulkModalOpen}
        title={`Approve ${eligibleCount} classifications?`}
        description={`This approves ${eligibleCount} classifications with confidence of ${threshold}% or higher. Each decision is logged.`}
      >
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={() => setBulkModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="approve"
            onClick={handleBulkApproveConfirmed}
            isLoading={bulkApproveMutation.isPending}
          >
            Approve {eligibleCount}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
