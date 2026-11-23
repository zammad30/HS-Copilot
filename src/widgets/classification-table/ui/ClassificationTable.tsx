import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import clsx from "clsx";
import { DataTable } from "@/shared/ui/DataTable";
import type { DataTableColumn } from "@/shared/ui/DataTable";
import { Meter } from "@/shared/ui/Meter";
import { Modal } from "@/shared/ui/Modal";
import { Menu } from "@/shared/ui/Menu";
import type { MenuItemConfig } from "@/shared/ui/Menu";
import { IconButton } from "@/shared/ui/IconButton";
import { Button } from "@/shared/ui/Button";
import { StatusIndicator } from "@/shared/ui/StatusIndicator";
import { useToast } from "@/shared/ui/Toast";
import { ClassificationStatusBadge, CodeText, effectiveCode } from "@/entities/classification";
import type { Classification } from "@/entities/classification";
import { formatUpdatedDay } from "@/shared/lib/formatDate";
import { routes } from "@/shared/config";
import { useCopyToClipboard } from "@/shared/lib/useCopyToClipboard";
import { useReviewDecision } from "@/features/review-decision";
import { useDeleteClassification } from "@/features/delete-classification";
import styles from "./ClassificationTable.module.scss";

export interface ClassificationTableProps {
  items: Classification[];
  /** `compact` for Home's secondary table; `default` (56px rows) is Library's density. */
  density?: "default" | "compact";
  showUpdated?: boolean;
  /** True while a background refetch keeps previous rows visible (e.g. paging/filtering). */
  isFetching?: boolean;
  emptyState: ReactNode;
  /** Mirrors optimistic delete/undo to a consumer's own list outside this table (Home's review queue). */
  onItemHiddenChange?: (id: string, hidden: boolean) => void;
}

export function ClassificationTable({
  items,
  density = "default",
  showUpdated = false,
  isFetching = false,
  emptyState,
  onItemHiddenChange,
}: ClassificationTableProps) {
  const { show } = useToast();
  const copyToClipboard = useCopyToClipboard();
  const [deleteTarget, setDeleteTarget] = useState<Classification | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const deleteReturnFocusRef = useRef<HTMLButtonElement | null>(null);
  const actionTriggerRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const reviewDecision = useReviewDecision();
  const deleteMutation = useDeleteClassification();

  const visibleItems = useMemo(
    () => items.filter((item) => !hiddenIds.has(item.id)),
    [items, hiddenIds],
  );

  function handleApprove(item: Classification) {
    reviewDecision.mutate(
      { id: item.id, action: "approve" },
      { onSuccess: () => show("Classification approved", { tone: "success" }) },
    );
  }

  function handleCopyCode(item: Classification) {
    copyToClipboard(effectiveCode(item), "HS code copied");
  }

  function handleDeleteSelected(item: Classification) {
    deleteReturnFocusRef.current = actionTriggerRefs.current.get(item.id) ?? null;
    setDeleteTarget(item);
  }

  function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setHiddenIds((current) => new Set(current).add(target.id));
    onItemHiddenChange?.(target.id, true);
    show("Classification deleted", {
      tone: "delete",
      action: {
        label: "Undo",
        onClick: () => {
          setHiddenIds((current) => {
            const next = new Set(current);
            next.delete(target.id);
            return next;
          });
          onItemHiddenChange?.(target.id, false);
        },
      },
      onTimeout: () => {
        deleteMutation.mutate(target.id);
      },
    });
  }

  const columns: DataTableColumn<Classification>[] = [
    { key: "description", header: "Product", render: (item) => item.description },
    {
      key: "code",
      header: "Suggested code",
      render: (item) => <CodeText>{effectiveCode(item)}</CodeText>,
    },
    {
      key: "confidence",
      header: "Confidence",
      render: (item) => (
        <Meter value={item.confidence} aria-label={`${item.confidence}% confidence`} />
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <span className={styles.statuses}>
          <ClassificationStatusBadge status={item.status} />
          {item.overridden && <StatusIndicator status="overridden" />}
        </span>
      ),
    },
    ...(showUpdated
      ? [
          {
            key: "updated",
            header: "Updated",
            render: (item: Classification) => formatUpdatedDay(item.updatedAt),
          },
        ]
      : []),
  ];

  if (visibleItems.length === 0) return <>{emptyState}</>;

  return (
    <>
      <div
        className={clsx(styles.wrap, isFetching && styles.fetching)}
        aria-busy={isFetching || undefined}
      >
        <DataTable
          columns={columns}
          rows={visibleItems}
          getRowKey={(item) => item.id}
          rowHref={(item) => routes.classificationDetail(item.id)}
          isRowHighlighted={(item) => item.status === "needs_review"}
          density={density}
          renderActions={(item) => {
            const menuItems: MenuItemConfig[] = [
              { label: "Open", href: routes.classificationDetail(item.id) },
              ...(item.status === "approved"
                ? []
                : [{ label: "Approve", onSelect: () => handleApprove(item) }]),
              { label: "Copy code", onSelect: () => handleCopyCode(item) },
              { label: "Delete", onSelect: () => handleDeleteSelected(item) },
            ];
            return (
              <Menu
                trigger={
                  <IconButton
                    ref={(element) => {
                      if (element) actionTriggerRefs.current.set(item.id, element);
                      else actionTriggerRefs.current.delete(item.id);
                    }}
                    icon={<MoreHorizontal aria-hidden="true" />}
                    aria-label={`Actions for ${item.description}`}
                  />
                }
                items={menuItems}
              />
            );
          }}
        />
      </div>

      <Modal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete classification?"
        description={
          deleteTarget
            ? `This removes "${deleteTarget.description}" from the workspace.`
            : undefined
        }
        returnFocusRef={deleteReturnFocusRef}
      >
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="reject" onClick={handleDeleteConfirmed}>
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
}
