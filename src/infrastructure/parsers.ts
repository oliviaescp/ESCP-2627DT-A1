import Papa from "papaparse";
import readXlsxFile from "read-excel-file/browser";

export const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_ROWS = 5_000;
export const MAX_FILES = 5;

export interface ParsedFile {
  name: string;
  type: "csv" | "xlsx";
  sheets?: string[];
  selectedSheet?: string;
  fields: string[];
  rows: Record<string, unknown>[];
  warnings: string[];
}

export class FileValidationError extends Error {
  constructor(message: string) {
    super(message + " Existing saved dashboards are unchanged.");
    this.name = "FileValidationError";
  }
}

function normalizeValue(value: unknown): unknown {
  if (value instanceof Date)
    return Number.isFinite(value.getTime())
      ? value.toISOString().slice(0, 10)
      : String(value);
  if (typeof value !== "string") return value ?? "";
  const trimmed = value.trim();
  // Ambiguous localized numbers remain text and are surfaced at mapping/calculation time.
  if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(trimmed)) {
    const number = Number(trimmed);
    if (Number.isFinite(number)) return number;
  }
  return trimmed;
}

function normalizeMatrix(
  matrix: unknown[][],
  name: string,
  type: "csv" | "xlsx",
): ParsedFile {
  const nonempty = matrix.filter((row) =>
    row.some(
      (value) =>
        value !== undefined && value !== null && String(value).trim() !== "",
    ),
  );
  if (nonempty.length < 2)
    throw new FileValidationError(
      "This file has no data rows. Add a header and at least one data row, or load fictional sample data.",
    );
  if (nonempty.length - 1 > MAX_ROWS)
    throw new FileValidationError(
      "This file exceeds 5,000 data rows. Export a smaller sample and try again.",
    );
  const fields = nonempty[0].map((value) => String(value ?? "").trim());
  const width = Math.max(...nonempty.map((row) => row.length));
  if (fields.length !== width || fields.some((field) => !field))
    throw new FileValidationError(
      "Every column needs a non-empty header. Add missing column names and upload again.",
    );
  if (
    new Set(fields.map((field) => field.toLowerCase())).size !== fields.length
  )
    throw new FileValidationError(
      "Duplicate column headers were found. Give every column a unique name and upload again.",
    );
  const warnings: string[] = [];
  let missing = 0;
  const rows = nonempty.slice(1).map((row, i) => {
    if (row.length > fields.length)
      throw new FileValidationError(
        `Data row ${i + 2} has more values than headers. Check delimiters and quoting, then upload again.`,
      );
    const entries = fields.map((field, j) => {
      const value = normalizeValue(row[j]);
      if (value === "") missing++;
      return [field, value] as const;
    });
    return Object.fromEntries(entries);
  });
  if (missing)
    warnings.push(
      `${missing} empty cell${missing === 1 ? "" : "s"} retained. Missing inputs will not be replaced with zero.`,
    );
  const dateFields = fields.filter((field) =>
    /(^date$|_date$|^month$|^period$|^reporting[_ ]date$)/i.test(field),
  );
  let invalidDates = 0;
  for (const field of dateFields)
    for (const row of rows) {
      const value = row[field];
      if (value === "") continue;
      const string = String(value);
      const fullDate = /^\d{4}-\d{2}$/.test(string) ? string + "-01" : string;
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(fullDate) ||
        !Number.isFinite(Date.parse(fullDate)) ||
        new Date(fullDate).toISOString().slice(0, 10) !== fullDate
      )
        invalidDates++;
    }
  if (invalidDates)
    warnings.push(
      `${invalidDates} date value${invalidDates === 1 ? "" : "s"} could not be verified as YYYY-MM-DD or YYYY-MM. Correct the source dates before calculating affected KPIs.`,
    );
  const numericFields = fields.filter(
    (field) =>
      /revenue|sales|cost|hours|capacity|customers|guests|satisfaction|score|projects|tasks|amount|count/i.test(
        field,
      ) && !/name|status|id|date/i.test(field),
  );
  let invalidNumbers = 0;
  for (const field of numericFields)
    for (const row of rows) {
      const value = row[field];
      if (value !== "" && typeof value !== "number") invalidNumbers++;
    }
  if (invalidNumbers)
    warnings.push(
      `${invalidNumbers} potential numeric value${invalidNumbers === 1 ? "" : "s"} retained as text. Use unambiguous decimal numbers (for example 1234.50); confirm mappings and review affected KPIs.`,
    );
  const fingerprints = rows.map((row) => JSON.stringify(row));
  if (new Set(fingerprints).size !== rows.length)
    warnings.push(
      "Identical rows detected. Review duplicates before confirming mappings; rows have not been silently removed.",
    );
  return { name, type, fields, rows, warnings };
}

export function parseCsv(text: string, name = "upload.csv"): ParsedFile {
  if (!text.trim())
    throw new FileValidationError(
      "This file is empty. Choose a CSV with a header and data rows.",
    );
  const result = Papa.parse<string[]>(text.replace(/^\uFEFF/, ""), {
    header: false,
    skipEmptyLines: "greedy",
    preview: MAX_ROWS + 2,
  });
  if (result.errors.length)
    throw new FileValidationError(
      `The CSV could not be read (${result.errors[0].message}). Check its quoting and delimiter, then try again.`,
    );
  return normalizeMatrix(result.data, name, "csv");
}

export const MAX_EXPANDED_XLSX_BYTES = 20 * 1024 * 1024;
export const MAX_XLSX_ENTRIES = 1000;

/** Bound ZIP metadata before the workbook parser allocates expanded worksheet data. */
export function validateXlsxArchive(buffer: ArrayBuffer): void {
  const data = new DataView(buffer);
  const invalid = () =>
    new FileValidationError(
      "This XLSX archive is corrupted or uses an unsupported archive format. Export a fresh XLSX or CSV.",
    );
  if (buffer.byteLength < 22 || data.getUint32(0, true) !== 0x04034b50)
    throw invalid();
  let end = -1;
  for (
    let i = buffer.byteLength - 22;
    i >= Math.max(0, buffer.byteLength - 65557);
    i--
  ) {
    if (
      data.getUint32(i, true) === 0x06054b50 &&
      i + 22 + data.getUint16(i + 20, true) === buffer.byteLength
    ) {
      end = i;
      break;
    }
  }
  if (end < 0) throw invalid();
  const entries = data.getUint16(end + 10, true);
  const directorySize = data.getUint32(end + 12, true);
  let cursor = data.getUint32(end + 16, true);
  if (
    data.getUint16(end + 4, true) !== 0 ||
    data.getUint16(end + 6, true) !== 0 ||
    data.getUint16(end + 8, true) !== entries ||
    entries === 65535 ||
    directorySize === 0xffffffff ||
    cursor === 0xffffffff
  )
    throw invalid();
  if (entries > MAX_XLSX_ENTRIES)
    throw new FileValidationError(
      "This workbook contains more than 1,000 archive entries. Export a simpler workbook or CSV.",
    );
  if (!entries || cursor + directorySize !== end) throw invalid();
  let expanded = 0;
  for (let i = 0; i < entries; i++) {
    if (cursor + 46 > end || data.getUint32(cursor, true) !== 0x02014b50)
      throw invalid();
    const flags = data.getUint16(cursor + 8, true);
    const method = data.getUint16(cursor + 10, true);
    const compressed = data.getUint32(cursor + 20, true);
    const uncompressed = data.getUint32(cursor + 24, true);
    const nameLength = data.getUint16(cursor + 28, true);
    const extraLength = data.getUint16(cursor + 30, true);
    const commentLength = data.getUint16(cursor + 32, true);
    const offset = data.getUint32(cursor + 42, true);
    if (
      flags & 1 ||
      (method !== 0 && method !== 8) ||
      compressed === 0xffffffff ||
      uncompressed === 0xffffffff ||
      offset === 0xffffffff
    )
      throw invalid();
    expanded += uncompressed;
    if (expanded > MAX_EXPANDED_XLSX_BYTES)
      throw new FileValidationError(
        "This workbook expands beyond the 20 MB local safety limit. Export fewer sheets or use a smaller CSV.",
      );
    if (offset + 30 > end || data.getUint32(offset, true) !== 0x04034b50)
      throw invalid();
    const localHeaderSize =
      30 +
      data.getUint16(offset + 26, true) +
      data.getUint16(offset + 28, true);
    if (
      offset + localHeaderSize + compressed > end ||
      data.getUint16(offset + 8, true) !== method
    )
      throw invalid();
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  if (cursor !== end) throw invalid();
}

export async function parseXlsx(
  buffer: ArrayBuffer,
  name = "upload.xlsx",
  selectedSheet?: string,
): Promise<ParsedFile> {
  const bytes = new Uint8Array(buffer);
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b)
    throw new FileValidationError(
      "This is not a readable XLSX workbook. Open it in a spreadsheet editor and export a new XLSX or CSV.",
    );
  validateXlsxArchive(buffer);
  try {
    const workbook = await readXlsxFile(buffer);
    if (!workbook.length)
      throw new FileValidationError(
        "This workbook has no worksheets. Add a sheet with headers and data.",
      );
    const sheets = workbook.map((sheet) => sheet.sheet);
    const sheetName = selectedSheet ?? sheets[0];
    const worksheet = workbook.find((sheet) => sheet.sheet === sheetName);
    if (!worksheet)
      throw new FileValidationError(
        "The selected worksheet is missing. Choose another worksheet.",
      );
    const parsed = normalizeMatrix(worksheet.data, name, "xlsx");
    return {
      ...parsed,
      sheets,
      selectedSheet: sheetName,
      warnings: [
        ...parsed.warnings,
        ...(sheets.length > 1
          ? [
              `Workbook contains ${sheets.length} sheets. Only “${sheetName}” is imported; select a different sheet if needed.`,
            ]
          : []),
      ],
    };
  } catch (error) {
    if (error instanceof FileValidationError) throw error;
    throw new FileValidationError(
      "This workbook is corrupted or unsupported. Export a new XLSX or CSV and try again.",
    );
  }
}

export async function parseFile(
  file: Pick<File, "name" | "size" | "text" | "arrayBuffer">,
  selectedSheet?: string,
): Promise<ParsedFile> {
  if (file.size > MAX_FILE_BYTES)
    throw new FileValidationError(
      "This file is larger than 2 MB. Export a smaller sample and try again.",
    );
  if (!file.size)
    throw new FileValidationError(
      "This file is empty. Choose a file containing headers and data.",
    );
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension !== "csv" && extension !== "xlsx")
    throw new FileValidationError(
      "Unsupported file format. Choose a .csv or .xlsx file; legacy .xls is not supported.",
    );
  try {
    return extension === "csv"
      ? parseCsv(await file.text(), file.name)
      : parseXlsx(await file.arrayBuffer(), file.name, selectedSheet);
  } catch (error) {
    if (error instanceof FileValidationError) throw error;
    throw new FileValidationError(
      "The selected file could not be read. Choose it again or try another file.",
    );
  }
}

/** Original bytes are intentionally not retained; only the parsed local rows are saved. */
export function createDataSource(
  parsed: ParsedFile,
  id: string = crypto.randomUUID(),
  now: string = new Date().toISOString(),
): import("../domain/models").DataSource {
  const dateField = parsed.fields.find((field) =>
    /^(date|month|period|reporting[_ ]date)$/i.test(field),
  );
  const dates = dateField
    ? parsed.rows
        .map((row) => String(row[dateField]))
        .filter(
          (value) =>
            /^\d{4}-\d{2}-\d{2}$/.test(value) &&
            Number.isFinite(Date.parse(value)),
        )
        .sort()
    : [];
  return {
    id,
    name: parsed.name,
    type: parsed.type,
    isSample: false,
    rowCount: parsed.rows.length,
    fieldNames: parsed.fields,
    rows: parsed.rows,
    uploadedAt: now,
    freshness: "unknown",
    status: parsed.warnings.length ? "needs-review" : "valid",
    warnings: parsed.warnings,
    sheets: parsed.sheets,
    selectedSheet: parsed.selectedSheet,
    ...(dates.length
      ? { period: { start: dates[0], end: dates[dates.length - 1] } }
      : {}),
  };
}
