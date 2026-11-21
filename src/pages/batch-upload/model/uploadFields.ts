import type { Jurisdiction } from "@/entities/classification";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_DESCRIPTION_LENGTH = 1000;

export type MappingField = "description" | "sku" | "material";

export interface MappingFieldConfig {
  field: MappingField;
  label: string;
  required: boolean;
  aliases: string[];
}

export const MAPPING_FIELDS: MappingFieldConfig[] = [
  {
    field: "description",
    label: "Product description",
    required: true,
    aliases: ["description", "product"],
  },
  {
    field: "sku",
    label: "SKU / reference",
    required: true,
    aliases: ["sku", "reference", "ref"],
  },
  {
    field: "material",
    label: "Material",
    required: false,
    aliases: ["material"],
  },
];

// Starting destination while the workspace default is loading or failed to
// load, so the required select never blocks the form.
export const FALLBACK_JURISDICTION: Jurisdiction = "US_HTS";

export function requiredFieldCount(): number {
  return MAPPING_FIELDS.filter((config) => config.required).length;
}

export function mappedRequiredCount(mapping: Partial<Record<MappingField, string>>): number {
  return MAPPING_FIELDS.filter((config) => config.required && mapping[config.field]).length;
}

export interface RowValidationResult {
  descriptions: string[];
  emptyRowCount: number;
  tooLongRowNumber?: number;
}

/** Validates each row's mapped description once the column is known, per
 * BU-2: non-empty and at most 1000 characters. Empty rows are skipped and
 * counted; the first over-length row stops validation with its row number
 * (1-based, counting the header as row 1, matching how a spreadsheet user
 * would read "row N"). */
export function validateDescriptionColumn(
  rows: string[][],
  descriptionIndex: number,
): RowValidationResult {
  const descriptions: string[] = [];
  let emptyRowCount = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const raw = rows[i][descriptionIndex]?.trim() ?? "";
    if (raw.length === 0) {
      emptyRowCount += 1;
      continue;
    }
    if (raw.length > MAX_DESCRIPTION_LENGTH) {
      return { descriptions, emptyRowCount, tooLongRowNumber: i + 2 };
    }
    descriptions.push(raw);
  }

  return { descriptions, emptyRowCount };
}
