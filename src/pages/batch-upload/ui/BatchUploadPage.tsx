import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { useNavigate } from "react-router";
import { Download, UploadCloud } from "lucide-react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Card } from "@/shared/ui/Card";
import { Eyebrow } from "@/shared/ui/Eyebrow";
import { Button } from "@/shared/ui/Button";
import { FormField } from "@/shared/ui/FormField";
import { Select } from "@/shared/ui/Select";
import { parseCsv, matchColumns } from "@/shared/lib/parseCsv";
import type { ParseCsvFailureReason } from "@/shared/lib/parseCsv";
import type { Jurisdiction } from "@/entities/classification";
import { routes } from "@/shared/config";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import {
  JURISDICTION_OPTIONS,
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
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>("US_HTS");
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
  const canSubmit =
    file !== null &&
    parsed !== null &&
    mappedCount === requiredCount &&
    !hasBlockingRowError &&
    (rowValidation?.descriptions.length ?? 0) > 0;

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
        onError: () => setSubmitError("We couldn't start the batch. Try again."),
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
            />
            <UploadCloud aria-hidden="true" size={28} className={styles.dropzoneIcon} />
            <label htmlFor="batch-file-input" className={styles.dropzoneLabel}>
              {file ? file.name : "Drop a CSV here, or choose a file"}
            </label>
            <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
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

            <FormField label="Jurisdiction">
              <Select
                value={jurisdiction}
                onChange={(event) => setJurisdiction(event.target.value as Jurisdiction)}
                disabled={!parsed}
              >
                {JURISDICTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
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
            >
              Start batch classification
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
