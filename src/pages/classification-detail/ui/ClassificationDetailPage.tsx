import { useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { ArrowLeft, FolderSearch2, PanelRight, Printer } from "lucide-react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Eyebrow } from "@/shared/ui/Eyebrow";
import { Skeleton } from "@/shared/ui/Skeleton";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { Drawer } from "@/shared/ui/Drawer";
import { useToast } from "@/shared/ui/Toast";
import { ApiError } from "@/shared/api";
import { useClassification, effectiveCode, jurisdictionLabel } from "@/entities/classification";
import type { Evidence } from "@/entities/classification";
import {
  useReviewDecision,
  RejectDialog,
  OverrideDialog,
  RequestInfoDialog,
} from "@/features/review-decision";
import { routes } from "@/shared/config";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { formatTime } from "@/shared/lib/formatDate";
import { useMembers } from "@/entities/member";
import { RecommendationCard } from "./RecommendationCard";
import { ReviewActions } from "./ReviewActions";
import { CandidateCard } from "./CandidateCard";
import { EvidenceGrid } from "./EvidenceGrid";
import { AuditTrailView } from "./AuditTrailView";
import { EvidenceDetailView } from "./EvidenceDetailView";
import { ClassificationPath } from "./ClassificationPath";
import { PrintHeader } from "./PrintHeader";
import { PrintHistory } from "./PrintHistory";
import styles from "./ClassificationDetailPage.module.scss";

type DrawerView = { type: "audit" } | { type: "evidence"; evidence: Evidence };

function latestApprovalActor(entries: { action: string; actor: string }[]): string | undefined {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (entry.action === "approved" || entry.action === "overridden") return entry.actor;
  }
  return undefined;
}

export function ClassificationDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { show } = useToast();

  const { data: classification, isPending, isError, error, refetch } = useClassification(id);
  const membersQuery = useMembers();
  const reviewDecision = useReviewDecision();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [requestInfoOpen, setRequestInfoOpen] = useState(false);
  const [decisionError, setDecisionError] = useState<string | undefined>(undefined);
  const [openReasoningCode, setOpenReasoningCode] = useState<string | null>(null);
  const [drawerView, setDrawerView] = useState<DrawerView | null>(null);

  const auditTriggerRef = useRef<HTMLButtonElement>(null);
  const rejectTriggerRef = useRef<HTMLButtonElement>(null);
  const overrideTriggerRef = useRef<HTMLButtonElement>(null);
  const requestInfoTriggerRef = useRef<HTMLButtonElement>(null);
  const drawerReturnFocusRef = useRef<HTMLElement | null>(null);

  useDocumentTitle(
    classification
      ? `${classification.description} · Classification | HS Copilot`
      : "Classification | HS Copilot",
  );

  function handleBack() {
    if (location.key !== "default") navigate(-1);
    else navigate(routes.library);
  }

  function handleUndo() {
    if (!classification) return;
    setDecisionError(undefined);
    reviewDecision.mutate(
      { id: classification.id, action: "undo" },
      {
        onSuccess: () => show("Decision undone", { tone: "info" }),
        onError: () => setDecisionError("We couldn't save your decision. Try again."),
      },
    );
  }

  function handleApprove() {
    if (!classification) return;
    setDecisionError(undefined);
    reviewDecision.mutate(
      { id: classification.id, action: "approve" },
      {
        onSuccess: () =>
          show("Classification approved", {
            tone: "success",
            action: { label: "Undo", onClick: handleUndo },
          }),
        onError: () => setDecisionError("We couldn't save your decision. Try again."),
      },
    );
  }

  function handlePrint() {
    window.print();
  }

  function openAudit() {
    drawerReturnFocusRef.current = auditTriggerRef.current;
    setDrawerView({ type: "audit" });
  }

  function openEvidence(evidence: Evidence, trigger: HTMLButtonElement) {
    drawerReturnFocusRef.current = trigger;
    setDrawerView({ type: "evidence", evidence });
  }

  const backButton = (
    <Button
      variant="ghost"
      icon={<ArrowLeft aria-hidden="true" />}
      onClick={handleBack}
      className={styles.back}
    >
      Back
    </Button>
  );

  if (isPending) {
    return (
      <div className={styles.page}>
        {backButton}
        <Skeleton lines={2} />
        <Card className={styles.skeletonCard}>
          <Skeleton lines={4} />
        </Card>
        <Card className={styles.skeletonCard}>
          <Skeleton lines={2} />
        </Card>
        <Card className={styles.skeletonCard}>
          <Skeleton lines={2} />
        </Card>
      </div>
    );
  }

  if (isError) {
    const notFound = error instanceof ApiError && error.code === "not_found";
    return (
      <div className={styles.page}>
        {backButton}
        {notFound ? (
          <EmptyState
            icon={<FolderSearch2 />}
            title="Classification not found"
            description="It may have been deleted."
            action={<Button onClick={() => navigate(routes.library)}>Back to library</Button>}
          />
        ) : (
          <ErrorState title="We couldn't load this classification" onRetry={() => void refetch()} />
        )}
      </div>
    );
  }

  const researchEntry = classification.auditTrail.find(
    (entry) => entry.action === "research_completed",
  );
  const researchAt = researchEntry?.at ?? classification.createdAt;
  const description = `${jurisdictionLabel(classification.jurisdiction)} · Researched ${formatTime(researchAt)}`;
  const approvedByName = latestApprovalActor(classification.auditTrail);
  const effectiveClassificationCode = effectiveCode(classification);
  const sortedCandidates = [...classification.candidates].sort(
    (a, b) => b.confidence - a.confidence,
  );
  const assignees = membersQuery.data?.items ?? [];
  const printedAt = new Date().toISOString();

  const drawerTitle =
    drawerView?.type === "audit"
      ? "Audit trail"
      : drawerView?.evidence.kind === "ruling"
        ? "Past ruling"
        : "Tariff source";

  return (
    <div className={styles.page}>
      {backButton}

      <PrintHeader classification={classification} printedAt={printedAt} />

      <PageHeader
        eyebrow="Classification result"
        title={classification.description}
        description={description}
        action={
          <div className={styles.headerActions}>
            <Button variant="secondary" icon={<Printer aria-hidden="true" />} onClick={handlePrint}>
              Print record
            </Button>
            <Button
              ref={auditTriggerRef}
              variant="secondary"
              icon={<PanelRight aria-hidden="true" />}
              onClick={openAudit}
            >
              Audit trail
            </Button>
          </div>
        }
      />

      <RecommendationCard classification={classification} onOpenEvidence={openEvidence} />

      <ClassificationPath path={classification.path} />

      <ReviewActions
        classification={classification}
        approvedByName={approvedByName}
        isPending={reviewDecision.isPending}
        decisionError={decisionError}
        onApprove={handleApprove}
        onOpenReject={() => setRejectOpen(true)}
        onOpenOverride={() => setOverrideOpen(true)}
        onOpenRequestInfo={() => setRequestInfoOpen(true)}
        rejectTriggerRef={rejectTriggerRef}
        overrideTriggerRef={overrideTriggerRef}
        requestInfoTriggerRef={requestInfoTriggerRef}
      />

      {sortedCandidates.length === 0 ? (
        <EmptyState
          className={styles.emptyCard}
          icon={<FolderSearch2 />}
          title="No candidates yet"
          description="Research for this classification hasn't finished."
          action={<Button onClick={() => navigate(routes.library)}>Back to library</Button>}
        />
      ) : (
        <>
          <div className={styles.candidates}>
            <div className={styles.candidatesHeading}>
              <Eyebrow>Ranked candidates</Eyebrow>
              <h2>Top suggestions</h2>
            </div>
            {sortedCandidates.map((candidate, index) => (
              <CandidateCard
                key={candidate.code}
                candidate={candidate}
                rank={index + 1}
                isSelected={candidate.code === effectiveClassificationCode}
                isOpen={openReasoningCode === candidate.code}
                onToggle={() =>
                  setOpenReasoningCode((current) =>
                    current === candidate.code ? null : candidate.code,
                  )
                }
              />
            ))}
          </div>

          <EvidenceGrid
            evidence={classification.evidence}
            onOpenSource={openEvidence}
            onOpenRuling={openEvidence}
          />
        </>
      )}

      <PrintHistory classificationId={classification.id} />

      <p className={styles.disclaimer}>
        This is a classification suggestion to support your decision. Confirm it with a licensed
        customs broker or your customs authority before you file.
      </p>

      <Drawer
        open={drawerView !== null}
        onOpenChange={(open) => {
          if (!open) setDrawerView(null);
        }}
        title={drawerTitle}
        returnFocusRef={drawerReturnFocusRef}
      >
        {drawerView?.type === "audit" && (
          <AuditTrailView classification={classification} onClose={() => setDrawerView(null)} />
        )}
        {drawerView?.type === "evidence" && (
          <EvidenceDetailView evidence={drawerView.evidence} onClose={() => setDrawerView(null)} />
        )}
      </Drawer>

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        classificationId={classification.id}
        decision={reviewDecision}
        returnFocusRef={rejectTriggerRef}
        onRejected={() =>
          show("Classification rejected", {
            tone: "info",
            action: { label: "Undo", onClick: handleUndo },
          })
        }
      />

      <OverrideDialog
        open={overrideOpen}
        onOpenChange={setOverrideOpen}
        classificationId={classification.id}
        jurisdiction={classification.jurisdiction}
        currentCode={effectiveClassificationCode}
        candidates={sortedCandidates}
        decision={reviewDecision}
        returnFocusRef={overrideTriggerRef}
        onOverridden={() =>
          show("Classification overridden", {
            tone: "success",
            action: { label: "Undo", onClick: handleUndo },
          })
        }
      />

      <RequestInfoDialog
        open={requestInfoOpen}
        onOpenChange={setRequestInfoOpen}
        classificationId={classification.id}
        assignees={assignees}
        decision={reviewDecision}
        returnFocusRef={requestInfoTriggerRef}
        onRequested={() =>
          show("Information request sent", {
            tone: "info",
            action: { label: "Undo", onClick: handleUndo },
          })
        }
      />
    </div>
  );
}
