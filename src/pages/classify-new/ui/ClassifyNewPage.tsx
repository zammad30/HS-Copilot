import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
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
import { ApiError } from "@/shared/api";
import { classificationKeys } from "@/entities/classification";
import { routes } from "@/shared/config";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import {
  DEFAULT_JURISDICTION,
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
        jurisdiction: DEFAULT_JURISDICTION,
      },
      {
        onSuccess: ({ agentRunId }) => {
          setSearchParams({ run: agentRunId });
        },
        onError: () => {
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

            <FormField label="Country of origin">
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
                disabled={formDisabled}
              >
                Research HS codes
              </Button>
            </div>
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
