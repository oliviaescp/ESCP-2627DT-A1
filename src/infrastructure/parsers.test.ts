import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  createDataSource,
  MAX_FILE_BYTES,
  MAX_EXPANDED_XLSX_BYTES,
  parseCsv,
  parseFile,
  parseXlsx,
  validateXlsxArchive,
} from "./parsers";

function fixture(name: string): ArrayBuffer {
  const bytes = readFileSync(new URL("./fixtures/" + name, import.meta.url));
  return new Uint8Array(bytes).buffer;
}

describe("local CSV parser", () => {
  it("parses quoted fields and decimal numbers without replacing blanks with zero", () => {
    const parsed = parseCsv(
      'date,revenue,note\n2026-01-01,1250.50,"hello, team"\n2026-02-01,,check',
    );
    expect(parsed.rows[0]).toEqual({
      date: "2026-01-01",
      revenue: 1250.5,
      note: "hello, team",
    });
    expect(parsed.rows[1].revenue).toBe("");
    expect(parsed.warnings.join()).toContain("empty cell");
  });
  it("rejects duplicate and empty headers, empty files, and header-only files", () => {
    expect(() => parseCsv("revenue,Revenue\n1,2")).toThrow("Duplicate");
    expect(() => parseCsv("date,\n2026-01-01,3")).toThrow("non-empty header");
    expect(() => parseCsv("")).toThrow("empty");
    expect(() => parseCsv("date,revenue")).toThrow("no data rows");
  });
  it("retains invalid data with actionable quality notes", () => {
    const parsed = parseCsv(
      'date,revenue\n2026-02-30,wrong\n2026-01-01,"1,234"',
    );
    expect(parsed.rows[0]).toEqual({ date: "2026-02-30", revenue: "wrong" });
    expect(parsed.rows[1].revenue).toBe("1,234");
    expect(parsed.warnings.join()).toContain("date value");
    expect(parsed.warnings.join()).toContain("numeric");
  });
  it("detects row overflow instead of silently truncating", () => {
    expect(() =>
      parseCsv(
        "date,revenue\n" +
          Array.from({ length: 5001 }, () => "2026-01-01,3").join("\n"),
      ),
    ).toThrow("5,000");
  });
  it("supports semicolon CSV", () =>
    expect(parseCsv("date;revenue\n2026-01-01;20").rows[0].revenue).toBe(20));
  it("flags exact duplicate rows", () =>
    expect(
      parseCsv("date,revenue\n2026-01-01,2\n2026-01-01,2").warnings.join(),
    ).toContain("Identical rows"));
});

describe("local XLSX parser and file limits", () => {
  it("parses real workbook bytes and selects a named sheet", async () => {
    const buffer = fixture("two-sheets.xlsx");
    const parsed = await parseXlsx(buffer, "finance.xlsx", "Second");
    expect(parsed.rows[0].revenue).toBe(20);
    expect(parsed.sheets).toEqual(["First", "Second"]);
    expect(parsed.selectedSheet).toBe("Second");
    await expect(parseXlsx(buffer, "finance.xlsx", "Gone")).rejects.toThrow(
      "worksheet is missing",
    );
  });
  it("rejects corrupted/non-workbook bytes", async () =>
    expect(
      parseXlsx(new TextEncoder().encode("not a workbook").buffer),
    ).rejects.toThrow("not a readable XLSX"));
  it("rejects over 5000 workbook rows", async () => {
    const buffer = fixture("too-many-rows.xlsx");
    await expect(parseXlsx(buffer)).rejects.toThrow("5,000");
  });
  it("enforces type, size, and empty checks before reading", async () => {
    const input = {
      name: "bad.xls",
      size: 2,
      text: async () => "",
      arrayBuffer: async () => new ArrayBuffer(0),
    };
    await expect(parseFile(input)).rejects.toThrow("Unsupported");
    await expect(
      parseFile({ ...input, name: "big.csv", size: MAX_FILE_BYTES + 1 }),
    ).rejects.toThrow("2 MB");
    await expect(
      parseFile({ ...input, name: "empty.csv", size: 0 }),
    ).rejects.toThrow("empty");
  });
  it("creates traceable source metadata with its source period", () => {
    const source = createDataSource(
      parseCsv("date,revenue\n2026-01-01,3\n2026-02-01,4"),
      "source-1",
      "2026-03-01T00:00:00.000Z",
    );
    expect(source.period).toEqual({ start: "2026-01-01", end: "2026-02-01" });
    expect(source.isSample).toBe(false);
    expect(source.rowCount).toBe(2);
  });
});

describe("XLSX archive preflight", () => {
  it("rejects declared expansion above 20 MB before inflation", () => {
    const buffer = fixture("two-sheets.xlsx");
    const view = new DataView(buffer);
    for (let i = 0; i < buffer.byteLength - 46; i++) {
      if (view.getUint32(i, true) === 0x02014b50) {
        view.setUint32(i + 24, MAX_EXPANDED_XLSX_BYTES + 1, true);
        break;
      }
    }
    expect(() => validateXlsxArchive(buffer)).toThrow("20 MB");
  });
  it("rejects encrypted archive entries and malformed ZIP structures", () => {
    const buffer = fixture("two-sheets.xlsx");
    const view = new DataView(buffer);
    for (let i = 0; i < buffer.byteLength - 46; i++) {
      if (view.getUint32(i, true) === 0x02014b50) {
        view.setUint16(i + 8, 1, true);
        break;
      }
    }
    expect(() => validateXlsxArchive(buffer)).toThrow("unsupported archive");
    expect(() =>
      validateXlsxArchive(new Uint8Array([80, 75, 3, 4]).buffer),
    ).toThrow("corrupted");
  });
  it("rejects more than 1000 ZIP entries", () => {
    const buffer = fixture("two-sheets.xlsx");
    const view = new DataView(buffer);
    for (let i = buffer.byteLength - 22; i >= 0; i--) {
      if (view.getUint32(i, true) === 0x06054b50) {
        view.setUint16(i + 8, 1001, true);
        view.setUint16(i + 10, 1001, true);
        break;
      }
    }
    expect(() => validateXlsxArchive(buffer)).toThrow("1,000");
  });
  it("recognizes monthly source dates without false invalid-date warnings", () => {
    expect(parseCsv("month,revenue\n2026-01,10").warnings.join()).not.toContain(
      "date value",
    );
  });
});
