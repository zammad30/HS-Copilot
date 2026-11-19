import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, FolderSearch2, MoreHorizontal, Plus } from "lucide-react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Card } from "@/shared/ui/Card";
import { Eyebrow } from "@/shared/ui/Eyebrow";
import { TextInput } from "@/shared/ui/TextInput";
import { Button } from "@/shared/ui/Button";
import { Meter } from "@/shared/ui/Meter";
import { Skeleton } from "@/shared/ui/Skeleton";
import { EmptyState } from "@/shared/ui/EmptyState";
import { DataTable } from "@/shared/ui/DataTable";
import type { DataTableColumn } from "@/shared/ui/DataTable";
import { Modal } from "@/shared/ui/Modal";
import { Menu } from "@/shared/ui/Menu";
import { IconButton } from "@/shared/ui/IconButton";
import { useToast } from "@/shared/ui/Toast";
import { useSession } from "@/entities/session";
import { useClassifications, ClassificationStatusBadge } from "@/entities/classification";
import type { Classification } from "@/entities/classification";
import { routes } from "@/shared/config";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { useReviewDecision } from "@/features/review-decision";
import { useDeleteClassification } from "../api/useDeleteClassification";
import styles from "./HomePage.module.scss";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function HomePage() {
  useDocumentTitle("Home | HS Copilot");
  const session = useSession();
  const navigate = useNavigate();
  const { show } = useToast();

  const [quickText, setQuickText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Classification | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const deleteReturnFocusRef = useRef<HTMLButtonElement | null>(null);
  const actionTriggerRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const { data, isPending, isError, refetch } = useClassifications({ sort: "-updatedAt" });
  const reviewDecision = useReviewDecision();
  const deleteMutation = useDeleteClassification();

  const items = useMemo(
    () => (data?.items ?? []).filter((item) => !hiddenIds.has(item.id)),
    [data, hiddenIds],
  );
  const attention = useMemo(
    () => items.filter((item) => item.status === "needs_review" || item.status === "pending"),
    [items],
  );
  const recent = items.slice(0, 8);

  const greeting = getGreeting();
  const title = session?.name ? `${greeting}, ${session.name}.` : `${greeting}.`;
  const description = isPending
    ? undefined
    : attention.length === 1
      ? "1 classification is waiting for your review."
      : `${attention.length} classifications are waiting for your review.`;

  function handleQuickClassify() {
    const trimmed = quickText.trim();
    if (!trimmed) return;
    navigate(`${routes.classifyNew}?q=${encodeURIComponent(trimmed)}`);
  }

  function handleApprove(item: Classification) {
    reviewDecision.mutate(
      { id: item.id, action: "approve" },
      { onSuccess: () => show("Classification approved", { tone: "success" }) },
    );
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
      render: (item) => <span className={styles.code}>{item.suggestedCode}</span>,
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
        <ClassificationStatusBadge status={item.status} overridden={item.overridden} />
      ),
    },
  ];

  if (isError) {
    return (
      <div className={styles.page}>
        <PageHeader title={title} />
        <Card className={styles.errorCard}>
          <p>We couldn&rsquo;t load your classifications.</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Try again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title={title}
        description={description}
        action={
          <Button icon={<Plus aria-hidden="true" />} onClick={() => navigate(routes.classifyNew)}>
            New classification
          </Button>
        }
      />

      <div className={styles.grid}>
        <Card className={styles.reviewCard}>
          <div className={styles.cardHeading}>
            <div>
              <Eyebrow>Review queue</Eyebrow>
              {!isPending && <h2>{attention.length} need attention</h2>}
            </div>
            <Link to={`${routes.library}?status=needs_review,pending`} className={styles.textLink}>
              Review all <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
          {isPending ? (
            <Skeleton lines={4} />
          ) : attention.length === 0 ? (
            <EmptyState
              icon={<FolderSearch2 />}
              title="Nothing needs attention"
              description="New classifications that need review will show up here."
            />
          ) : (
            <ul className={styles.reviewList}>
              {attention.map((item) => (
                <li key={item.id}>
                  <Link to={routes.classificationDetail(item.id)} className={styles.reviewRow}>
                    <span className={styles.reviewRowMain}>
                      <strong>{item.description}</strong>
                      <span className={styles.code}>{item.suggestedCode}</span>
                    </span>
                    <Meter value={item.confidence} aria-label={`${item.confidence}% confidence`} />
                    <ClassificationStatusBadge status={item.status} overridden={item.overridden} />
                    <ArrowRight aria-hidden="true" size={16} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className={styles.quickCard}>
          <Eyebrow>Quick add</Eyebrow>
          <h2>Classify one product</h2>
          <p>Start with a plain-language product description.</p>
          <TextInput
            value={quickText}
            onChange={(event) => setQuickText(event.target.value)}
            aria-label="Product description"
            placeholder="e.g. Stainless steel vacuum bottle…"
          />
          <Button icon={<ArrowRight aria-hidden="true" />} onClick={handleQuickClassify}>
            Classify
          </Button>
        </Card>
      </div>

      <div className={styles.sectionHeading}>
        <div>
          <Eyebrow>Latest activity</Eyebrow>
          <h2>Recent classifications</h2>
        </div>
        <Link to={routes.library} className={styles.textLink}>
          View library <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>

      <Card className={styles.tableCard}>
        {isPending ? (
          <div className={styles.tableSkeleton}>
            <Skeleton lines={6} />
          </div>
        ) : recent.length === 0 ? (
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
        ) : (
          <DataTable
            columns={columns}
            rows={recent}
            getRowKey={(item) => item.id}
            rowHref={(item) => routes.classificationDetail(item.id)}
            isRowHighlighted={(item) => item.status === "needs_review"}
            density="compact"
            renderActions={(item) => (
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
                items={[
                  { label: "Open", href: routes.classificationDetail(item.id) },
                  { label: "Approve", onSelect: () => handleApprove(item) },
                  { label: "Delete", onSelect: () => handleDeleteSelected(item) },
                ]}
              />
            )}
          />
        )}
      </Card>

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
    </div>
  );
}
