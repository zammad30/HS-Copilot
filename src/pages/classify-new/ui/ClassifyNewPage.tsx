import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { FileSearch, Search } from "lucide-react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Card } from "@/shared/ui/Card";
import { Eyebrow } from "@/shared/ui/Eyebrow";
import { FormField } from "@/shared/ui/FormField";
import { TextInput } from "@/shared/ui/TextInput";
import { Textarea } from "@/shared/ui/Textarea";
import { Select } from "@/shared/ui/Select";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { Banner } from "@/shared/ui/Banner";
import { Skeleton } from "@/shared/ui/Skeleton";
import { ApiError } from "@/shared/api";
import { DESTINATIONS, classificationKeys } from "@/entities/classification";
import type { Jurisdiction } from "@/entities/classification";
import {
  formatClassificationsQuotaLine,
  parsePlanLimitError,
  planLimitMessage,
  useWorkspace,
  workspaceKeys,
} from "@/entities/workspace";
import type { PlanLimitDetails } from "@/entities/workspace";
import { routes } from "@/shared/config";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import {
  FALLBACK_JURISDICTION,
  classifyNewFormSchema,
  fieldErrorsFrom,
} from "../model/classifyNew.schema";
import { isRunComplete, needsAnswer } from "../model/agentRun.lib";
import type { AgentRunStep } from "../model/agentRun.schema";
import { useCreateClassification } from "../api/useCreateClassification";
import { useAnswerClarification } from "../api/useAnswerClarification";
import { useAgentRun } from "../api/agentRuns.query";
import { AgentSteps } from "./AgentSteps";
import { ClarifyingQuestion } from "./ClarifyingQuestion";
import styles from "./ClassifyNewPage.module.scss";

const COUNTRY_OPTIONS = ["China", "Vietnam", "Unknown"];

const WAITING_STEPS: AgentRunStep[] = [
  { id: "extract", title: "Extract product attributes", detail: "Waiting", state: "waiting" },
  { id: "search", title: "Search tariff headings", detail: "Waiting", state: "waiting" },
  { id: "notes", title: "Apply heading notes", detail: "Waiting", state: "waiting" },
  { id: "rank", title: "Rank candidates", detail: "Waiting", state: "waiting" },
];

export function ClassifyNewPage() {
  useDocumentTitle("New classification | HS Copilot");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const runId = searchParams.get("run") ?? undefined;
  const prefill = searchParams.get("q") ?? "";

  const [description, setDescription] = useState(prefill);
  const [material, setMaterial] = useState("");
  const [intendedUse, setIntendedUse] = useState("");
  const [origin, setOrigin] = useState("Unknown");
  // Only the user's own pick is stored; until then the workspace default (or the
  // fallback) is shown, so a late-loading workspace never overwrites a choice.
  const [chosenDestination, setChosenDestination] = useState<Jurisdiction | undefined>(undefined);
  const {
    data: workspace,
    isPending: isWorkspacePending,
    dataUpdatedAt: workspaceUpdatedAt,
  } = useWorkspace();
  const destination = chosenDestination ?? workspace?.defaultJurisdiction ?? FALLBACK_JURISDICTION;

  // A 403 from submit means the workspace data on screen was stale. The server's details
  // drive the banner only until a workspace fetch newer than the refusal arrives; from
  // then on the (fresh) workspace data decides whether the limit is still reached.
  const [serverLimit, setServerLimit] = useState<
    { details: PlanLimitDetails; staleAsOf: number } | undefined
  >(undefined);
  const bannerId = useId();
  const { limit: classificationLimit, period: classificationPeriod } =
    workspace?.limits.classifications ?? {};
  const usedClassifications = workspace?.usage.classificationsUsed;
  const periodEnd = workspace?.usage.periodEnd;
  const workspaceLimit: PlanLimitDetails | null =
    classificationLimit !== undefined &&
    usedClassifications !== undefined &&
    usedClassifications >= classificationLimit
      ? { reason: "classifications", limit: classificationLimit, used: usedClassifications }
      : null;
  const limitDetails =
    workspaceLimit ??
    (serverLimit && workspaceUpdatedAt <= serverLimit.staleAsOf ? serverLimit.details : null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createError, setCreateError] = useState<string | undefined>(undefined);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const createMutation = useCreateClassification();
  const answerMutation = useAnswerClarification(runId ?? "");
  const {
    data: run,
    isError: isRunError,
    error: runError,
    refetch: refetchRun,
  } = useAgentRun(runId);

  const runNotFound = isRunError && runError instanceof ApiError && runError.code === "not_found";
  const runLoadFailed = isRunError && !runNotFound;
  const runActive = runId !== undefined && !isRunError;
  const complete = run !== undefined && isRunComplete(run);
  const awaitingAnswer = run !== undefined && needsAnswer(run);
  const formDisabled = createMutation.isPending || (runActive && !complete);

  useEffect(() => {
    if (run && isRunComplete(run)) {
      void queryClient.invalidateQueries({ queryKey: classificationKeys.all });
      navigate(routes.classificationDetail(run.classificationId), { replace: true });
    }
  }, [run, navigate, queryClient]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError(undefined);

    const result = classifyNewFormSchema.safeParse({
      description,
      material,
      intendedUse,
      origin,
    });
    const fieldErrors = fieldErrorsFrom(result);
    setErrors(fieldErrors);
    if (!result.success) {
      descriptionRef.current?.focus();
      return;
    }

    createMutation.mutate(
      {
        description: result.data.description,
        attributes: {
          material: result.data.material || undefined,
          intendedUse: result.data.intendedUse || undefined,
          origin: origin === "Unknown" ? undefined : origin,
        },
        jurisdiction: destination,
      },
      {
        onSuccess: ({ agentRunId }) => {
          setSearchParams({ run: agentRunId });
        },
        onError: (error) => {
          const details = parsePlanLimitError(error);
          if (details?.reason === "classifications") {
            setServerLimit({
              details,
              staleAsOf: queryClient.getQueryState(workspaceKeys.detail())?.dataUpdatedAt ?? 0,
            });
            return;
          }
          setCreateError("We couldn't start the research. Try again.");
        },
      },
    );
  }

  function handleAnswer(optionIndex: number) {
    answerMutation.mutate(optionIndex);
  }

  const showWorking = runActive && !complete && !awaitingAnswer;

  return (
    <div>
      <PageHeader
        eyebrow="New classification"
        title="Describe the product"
        description="Include the details a reviewer would need to distinguish between headings."
      />

      {limitDetails && (
        <Banner id={bannerId} className={styles.limitBanner}>
          {planLimitMessage(limitDetails, { period: classificationPeriod, periodEnd })}{" "}
          <Link to={routes.pricing} className={styles.bannerLink}>
            See plans
          </Link>
        </Banner>
      )}

      <div className={styles.grid}>
        <Card className={styles.formCard}>
          <form onSubmit={handleSubmit} noValidate className={styles.form}>
            <FormField label="Product description" error={errors.description}>
              <Textarea
                ref={descriptionRef}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="e.g. Wireless Bluetooth earbuds with charging case"
                disabled={formDisabled}
              />
            </FormField>

            <div className={styles.fieldRow}>
              <FormField label="Primary material (optional)">
                <TextInput
                  value={material}
                  onChange={(event) => setMaterial(event.target.value)}
                  placeholder="e.g. ABS plastic"
                  disabled={formDisabled}
                />
              </FormField>
              <FormField label="Intended use (optional)">
                <TextInput
                  value={intendedUse}
                  onChange={(event) => setIntendedUse(event.target.value)}
                  placeholder="e.g. Personal audio"
                  disabled={formDisabled}
                />
              </FormField>
            </div>

            <FormField label="Destination">
              <Select
                value={destination}
                onChange={(event) => setChosenDestination(event.target.value as Jurisdiction)}
                disabled={formDisabled}
              >
                {DESTINATIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Country of origin (optional)">
              <Select
                value={origin}
                onChange={(event) => setOrigin(event.target.value)}
                disabled={formDisabled}
              >
                {COUNTRY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </FormField>

            <div className={styles.actionRow}>
              {createError && (
                <p className={styles.createError} role="alert">
                  {createError}
                </p>
              )}
              <Button
                type="submit"
                icon={<Search aria-hidden="true" />}
                isLoading={createMutation.isPending}
                disabled={formDisabled || limitDetails !== null}
                aria-describedby={limitDetails ? bannerId : undefined}
              >
                Research HS codes
              </Button>
            </div>

            {isWorkspacePending ? (
              <Skeleton lines={1} />
            ) : (
              workspace && (
                <p className={styles.quota}>
                  {formatClassificationsQuotaLine(
                    workspace.usage.classificationsUsed,
                    workspace.limits.classifications,
                    { periodEnd },
                  )}
                </p>
              )
            )}
          </form>
        </Card>

        <Card className={styles.progressCard}>
          <div className={styles.progressHeading}>
            <div>
              <Eyebrow>Live agent</Eyebrow>
              <h2>Research progress</h2>
            </div>
            {showWorking && <span className={styles.working}>Working</span>}
          </div>

          {runNotFound ? (
            <EmptyState
              icon={<FileSearch />}
              title="Run not found"
              description="This research run is no longer available. Start a new one."
              action={
                <Button variant="secondary" onClick={() => navigate(routes.classifyNew)}>
                  Start again
                </Button>
              }
            />
          ) : runLoadFailed ? (
            <ErrorState
              title="We couldn't load the research progress"
              onRetry={() => void refetchRun()}
            />
          ) : !runActive ? (
            <EmptyState
              icon={<FileSearch />}
              title="The agent’s research steps will appear here."
            />
          ) : (
            <>
              <AgentSteps steps={run?.steps ?? WAITING_STEPS} />
              {run && awaitingAnswer && run.question && (
                <ClarifyingQuestion
                  question={run.question}
                  isPending={answerMutation.isPending}
                  error={
                    answerMutation.isError ? "We couldn't send your answer. Try again." : undefined
                  }
                  onAnswer={handleAnswer}
                />
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
