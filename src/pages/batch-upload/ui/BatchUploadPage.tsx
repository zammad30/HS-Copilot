import { useId, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Download, UploadCloud } from "lucide-react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Card } from "@/shared/ui/Card";
import { Eyebrow } from "@/shared/ui/Eyebrow";
import { Button } from "@/shared/ui/Button";
import { FormField } from "@/shared/ui/FormField";
import { Select } from "@/shared/ui/Select";
import { Skeleton } from "@/shared/ui/Skeleton";
import { parseCsv, matchColumns } from "@/shared/lib/parseCsv";
import type { ParseCsvFailureReason } from "@/shared/lib/parseCsv";
import { DESTINATIONS } from "@/entities/classification";
import type { Jurisdiction } from "@/entities/classification";
import {
  PlanLimitNotice,
  formatClassificationsQuotaLine,
  formatCount,
  hasBatchAccess,
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
  MAPPING_FIELDS,
  MAX_DESCRIPTION_LENGTH,
  MAX_UPLOAD_BYTES,
  mappedRequiredCount,
  requiredFieldCount,
  validateDescriptionColumn,
} from "../model/uploadFields";
import type { MappingField } from "../model/uploadFields";
import { useCreateBatch } from "../api/useCreateBatch";
import styles from "./BatchUploadPage.module.scss";

const TEMPLATE_CSV =
  "description,sku,material\nStainless steel vacuum bottle,SKU-1001,Stainless steel\n";

function fileErrorMessage(reason: ParseCsvFailureReason): string {
  return reason === "too_many_rows"
    ? "This file has more than 500 rows."
    : "We couldn't read this file. Check it's a valid CSV and try again.";
}

function limitMessage(
  details: PlanLimitDetails,
  period: "lifetime" | "month" | undefined,
  periodEnd: string | undefined,
  remaining: number | undefined,
): string {
  const base = planLimitMessage(details, { period, periodEnd });
  if (details.reason === "classifications" && remaining !== undefined) {
    return `${base} You have ${formatCount(remaining)} left, so choose a smaller file.`;
  }
  return base;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${Math.round(bytes / 1024)} KB`;
}

export function BatchUploadPage() {
  useDocumentTitle("Upload batch");
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | undefined>(undefined);
  const [parsed, setParsed] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [mapping, setMapping] = useState<Partial<Record<MappingField, string>>>({});
  // Only the user's own pick is stored; until then the workspace default (or the
  // fallback) is shown, so a late-loading workspace never overwrites a choice.
  const [chosenDestination, setChosenDestination] = useState<Jurisdiction | undefined>(undefined);
  const {
    data: workspace,
    isPending: isWorkspacePending,
    dataUpdatedAt: workspaceUpdatedAt,
  } = useWorkspace();
  const queryClient = useQueryClient();
  const noticeId = useId();
  // A 403 from submit means the workspace data on screen was stale. The server's details
  // drive the notice only until a workspace fetch newer than the refusal arrives; from
  // then on the (fresh) workspace data decides.
  const [serverLimit, setServerLimit] = useState<
    { details: PlanLimitDetails; staleAsOf: number } | undefined
  >(undefined);
  const jurisdiction = chosenDestination ?? workspace?.defaultJurisdiction ?? FALLBACK_JURISDICTION;
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);

  const createBatch = useCreateBatch();

  const descriptionHeader = mapping.description;
  const descriptionIndex = useMemo(
    () => (parsed && descriptionHeader ? parsed.headers.indexOf(descriptionHeader) : -1),
    [parsed, descriptionHeader],
  );
  const rowValidation = useMemo(
    () =>
      parsed && descriptionIndex !== -1
        ? validateDescriptionColumn(parsed.rows, descriptionIndex)
        : null,
    [parsed, descriptionIndex],
  );

  const mappedCount = mappedRequiredCount(mapping);
  const requiredCount = requiredFieldCount();
  const hasBlockingRowError = Boolean(rowValidation?.tooLongRowNumber);
  const periodEnd = workspace?.usage.periodEnd;
  const classificationPeriod = workspace?.limits.classifications.period;
  const batchLimits = workspace?.limits.batch;
  const usage = workspace?.usage;
  const rowCount = rowValidation?.descriptions.length ?? 0;

  // Blocks the file chooser as well as the submit.
  let uploadLimit: PlanLimitDetails | null = null;
  if (batchLimits && usage) {
    if (!hasBatchAccess(batchLimits)) {
      uploadLimit = { reason: "feature", limit: 0, used: usage.batchUploadsUsed };
    } else if (usage.batchUploadsUsed >= batchLimits.uploadsPerMonth) {
      uploadLimit = {
        reason: "batch_uploads",
        limit: batchLimits.uploadsPerMonth,
        used: usage.batchUploadsUsed,
      };
    }
  }

  // Blocks the submit only: the user can still pick a smaller file.
  let rowLimit: PlanLimitDetails | null = null;
  let remainingClassifications: number | undefined;
  if (batchLimits && usage && workspace && uploadLimit === null && rowCount > 0) {
    remainingClassifications = Math.max(
      0,
      workspace.limits.classifications.limit - usage.classificationsUsed,
    );
    if (rowCount > batchLimits.maxRows) {
      rowLimit = { reason: "batch_rows", limit: batchLimits.maxRows, used: rowCount };
    } else if (rowCount > remainingClassifications) {
      rowLimit = {
        reason: "classifications",
        limit: workspace.limits.classifications.limit,
        used: usage.classificationsUsed,
      };
    }
  }

  const staleServerLimit =
    serverLimit && workspaceUpdatedAt <= serverLimit.staleAsOf ? serverLimit.details : null;
  // One notice at a time: the workspace's own state wins over the server's refusal.
  const limitDetails = uploadLimit ?? rowLimit ?? staleServerLimit;
  const isUploadBlocked = uploadLimit !== null;

  const canSubmit =
    limitDetails === null &&
    file !== null &&
    parsed !== null &&
    mappedCount === requiredCount &&
    !hasBlockingRowError &&
    rowCount > 0;

  async function handleFile(nextFile: File) {
    setSubmitError(undefined);
    setFile(null);
    setParsed(null);
    setMapping({});

    const looksLikeCsv =
      nextFile.name.toLowerCase().endsWith(".csv") ||
      nextFile.type === "text/csv" ||
      nextFile.type === "application/vnd.ms-excel";
    if (!looksLikeCsv) {
      setFileError("Choose a CSV file.");
      return;
    }
    if (nextFile.size > MAX_UPLOAD_BYTES) {
      setFileError("This file is larger than 5 MB.");
      return;
    }

    const text = await nextFile.text();
    const result = parseCsv(text);
    if (!result.ok) {
      setFileError(fileErrorMessage(result.reason));
      return;
    }

    setFileError(undefined);
    setFile(nextFile);
    setParsed({ headers: result.headers, rows: result.rows });

    const aliasMap = Object.fromEntries(
      MAPPING_FIELDS.map((config) => [config.field, config.aliases]),
    );
    const matched = matchColumns(result.headers, aliasMap);
    setMapping({
      description: matched.description,
      sku: matched.sku,
      material: matched.material,
    });
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    if (nextFile) void handleFile(nextFile);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const nextFile = event.dataTransfer.files?.[0];
    if (nextFile) void handleFile(nextFile);
  }

  function handleMappingChange(field: MappingField, value: string) {
    setMapping((current) => ({ ...current, [field]: value || undefined }));
  }

  function handleDownloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "batch-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleSubmit() {
    if (!file || !rowValidation || !mapping.description) return;
    setSubmitError(undefined);
    createBatch.mutate(
      {
        file,
        mapping: { description: mapping.description, sku: mapping.sku, material: mapping.material },
        jurisdiction,
      },
      {
        onSuccess: (batch) => navigate(routes.batchReview(batch.id)),
        onError: (error) => {
          const details = parsePlanLimitError(error);
          if (details) {
            setServerLimit({
              details,
              staleAsOf: queryClient.getQueryState(workspaceKeys.detail())?.dataUpdatedAt ?? 0,
            });
            return;
          }
          setSubmitError("We couldn't start the batch. Try again.");
        },
      },
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Batch upload"
        title="Import product data"
        description="Upload a CSV and map your columns before classification begins."
      />

      {isWorkspacePending ? (
        <div className={styles.usage}>
          <Skeleton lines={2} />
        </div>
      ) : (
        workspace && (
          <div className={styles.usage}>
            <p className={styles.usageLine}>
              {hasBatchAccess(workspace.limits.batch)
                ? `Batch uploads: ${formatCount(workspace.usage.batchUploadsUsed)} of ${formatCount(workspace.limits.batch.uploadsPerMonth)} used this month. Up to ${formatCount(workspace.limits.batch.maxRows)} rows per upload.`
                : "Batch uploads: not included in your plan."}
            </p>
            <p className={styles.usageLine}>
              {formatClassificationsQuotaLine(
                workspace.usage.classificationsUsed,
                workspace.limits.classifications,
                { periodEnd },
              )}
            </p>
          </div>
        )
      )}

      {limitDetails && (
        <div className={styles.notice}>
          <PlanLimitNotice
            id={noticeId}
            message={limitMessage(
              limitDetails,
              classificationPeriod,
              periodEnd,
              remainingClassifications,
            )}
          />
        </div>
      )}

      <div className={styles.grid}>
        <Card className={styles.uploadCard}>
          <div
            className={styles.dropzone}
            onDrop={handleDrop}
            onDragOver={(event) => event.preventDefault()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              id="batch-file-input"
              className={styles.hiddenInput}
              onChange={handleInputChange}
              disabled={isUploadBlocked}
            />
            <UploadCloud aria-hidden="true" size={28} className={styles.dropzoneIcon} />
            <label htmlFor="batch-file-input" className={styles.dropzoneLabel}>
              {file ? file.name : "Drop a CSV here, or choose a file"}
            </label>
            <Button
              type="button"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={isUploadBlocked}
            >
              Choose file
            </Button>
            <p className={styles.helper}>CSV up to 5 MB &middot; Up to 500 rows per file</p>
            {file && !fileError && (
              <p className={styles.fileSummary}>
                {parsed?.rows.length ?? 0} rows &middot; {formatFileSize(file.size)}
              </p>
            )}
            {fileError && (
              <p className={styles.fileError} role="alert">
                {fileError}
              </p>
            )}
            {rowValidation && rowValidation.emptyRowCount > 0 && (
              <p className={styles.fileHint}>{rowValidation.emptyRowCount} empty rows skipped.</p>
            )}
            {rowValidation?.tooLongRowNumber && (
              <p className={styles.fileError} role="alert">
                Row {rowValidation.tooLongRowNumber} is too long (max {MAX_DESCRIPTION_LENGTH}{" "}
                characters).
              </p>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            icon={<Download aria-hidden="true" size={16} />}
            onClick={handleDownloadTemplate}
            className={styles.templateLink}
          >
            Download template
          </Button>
        </Card>

        {!fileError && (
          <Card className={styles.mappingCard}>
            <Eyebrow>Step 2</Eyebrow>
            <h2>Map columns</h2>
            <p className={styles.mappingCaption}>
              {mappedCount} of {requiredCount} required
            </p>
            {!parsed && <p className={styles.fileHint}>Upload a file to map its columns.</p>}

            {MAPPING_FIELDS.map((config) => (
              <FormField
                key={config.field}
                label={config.label + (config.required ? "" : " (optional)")}
              >
                <Select
                  value={mapping[config.field] ?? ""}
                  onChange={(event) => handleMappingChange(config.field, event.target.value)}
                  disabled={!parsed}
                >
                  <option value="">Choose a column</option>
                  {parsed?.headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </Select>
              </FormField>
            ))}

            <FormField label="Destination">
              <Select
                value={jurisdiction}
                onChange={(event) => setChosenDestination(event.target.value as Jurisdiction)}
                disabled={!parsed}
              >
                {DESTINATIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>

            {submitError && (
              <p className={styles.fileError} role="alert">
                {submitError}
              </p>
            )}

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || createBatch.isPending}
              isLoading={createBatch.isPending}
              aria-describedby={limitDetails ? noticeId : undefined}
            >
              Start batch classification
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
