const MAX_ROWS = 500;

export type ParseCsvFailureReason = "too_many_rows" | "malformed";

export type ParseCsvResult =
  { ok: true; headers: string[]; rows: string[][] } | { ok: false; reason: ParseCsvFailureReason };

/**
 * Splits CSV text into cells, honoring quoted fields (commas and escaped `""`
 * quotes inside them) and both CRLF and LF line endings. Returns raw string
 * rows; a trailing blank line is dropped, not counted as a row.
 */
function tokenizeRows(text: string): string[][] | null {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const length = text.length;

  function endField(): void {
    row.push(field);
    field = "";
  }

  function endRow(): void {
    endField();
    rows.push(row);
    row = [];
  }

  while (i < length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === ",") {
      endField();
      i += 1;
      continue;
    }
    if (char === "\r") {
      // Lone CR (old Mac line endings) is treated as a row break too.
      endRow();
      i += text[i + 1] === "\n" ? 2 : 1;
      continue;
    }
    if (char === "\n") {
      endRow();
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }

  if (inQuotes) return null;

  if (field.length > 0 || row.length > 0) {
    endRow();
  }

  // Drop a trailing fully-blank row (a single empty cell from a trailing
  // newline), but keep genuinely blank data rows elsewhere in the file.
  if (rows.length > 0) {
    const last = rows[rows.length - 1];
    if (last.length === 1 && last[0] === "") {
      rows.pop();
    }
  }

  return rows;
}

export function parseCsv(text: string): ParseCsvResult {
  const rows = tokenizeRows(text);
  if (!rows || rows.length === 0) {
    return { ok: false, reason: "malformed" };
  }

  const [headers, ...dataRows] = rows;
  if (headers.length === 0 || headers.every((header) => header.trim() === "")) {
    return { ok: false, reason: "malformed" };
  }

  if (dataRows.length > MAX_ROWS) {
    return { ok: false, reason: "too_many_rows" };
  }

  return { ok: true, headers, rows: dataRows };
}

/**
 * Case-insensitive exact or substring match of each field's known aliases
 * against the file's detected headers, for the upload page's column
 * auto-match. Returns the matched header name per field, or undefined.
 */
export function matchColumns(
  headers: string[],
  fieldAliases: Record<string, string[]>,
): Record<string, string | undefined> {
  const normalizedHeaders = headers.map((header) => ({
    header,
    normalized: header.trim().toLowerCase(),
  }));

  const result: Record<string, string | undefined> = {};
  for (const [field, aliases] of Object.entries(fieldAliases)) {
    const normalizedAliases = aliases.map((alias) => alias.toLowerCase());
    const match = normalizedHeaders.find(({ normalized }) =>
      normalizedAliases.some((alias) => normalized === alias || normalized.includes(alias)),
    );
    result[field] = match?.header;
  }
  return result;
}
