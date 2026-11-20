import { describe, expect, it } from "vitest";
import { matchColumns, parseCsv } from "./parseCsv";

describe("parseCsv", () => {
  it("parses plain rows", () => {
    const result = parseCsv("description,sku\nBlue widget,W-1\nRed widget,W-2");
    expect(result).toEqual({
      ok: true,
      headers: ["description", "sku"],
      rows: [
        ["Blue widget", "W-1"],
        ["Red widget", "W-2"],
      ],
    });
  });

  it("parses quoted fields containing commas", () => {
    const result = parseCsv('description,sku\n"Widget, blue",W-1');
    expect(result).toEqual({
      ok: true,
      headers: ["description", "sku"],
      rows: [["Widget, blue", "W-1"]],
    });
  });

  it("parses quoted fields containing escaped quotes", () => {
    const result = parseCsv('description,sku\n"18"" monitor stand",W-1');
    expect(result).toEqual({
      ok: true,
      headers: ["description", "sku"],
      rows: [['18" monitor stand', "W-1"]],
    });
  });

  it("parses CRLF line endings", () => {
    const result = parseCsv("description,sku\r\nBlue widget,W-1\r\nRed widget,W-2");
    expect(result).toEqual({
      ok: true,
      headers: ["description", "sku"],
      rows: [
        ["Blue widget", "W-1"],
        ["Red widget", "W-2"],
      ],
    });
  });

  it("parses LF line endings", () => {
    const result = parseCsv("description,sku\nBlue widget,W-1");
    expect(result.ok).toBe(true);
  });

  it("drops a trailing blank line", () => {
    const result = parseCsv("description,sku\nBlue widget,W-1\n");
    expect(result).toEqual({
      ok: true,
      headers: ["description", "sku"],
      rows: [["Blue widget", "W-1"]],
    });
  });

  it("rejects more than 500 data rows", () => {
    const dataRows = Array.from({ length: 501 }, (_, index) => `Widget ${index},W-${index}`);
    const text = `description,sku\n${dataRows.join("\n")}`;
    expect(parseCsv(text)).toEqual({ ok: false, reason: "too_many_rows" });
  });

  it("accepts exactly 500 data rows", () => {
    const dataRows = Array.from({ length: 500 }, (_, index) => `Widget ${index},W-${index}`);
    const text = `description,sku\n${dataRows.join("\n")}`;
    const result = parseCsv(text);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rows).toHaveLength(500);
  });

  it("rejects malformed input (unterminated quote)", () => {
    const result = parseCsv('description,sku\n"Unterminated,W-1');
    expect(result).toEqual({ ok: false, reason: "malformed" });
  });

  it("rejects empty input", () => {
    expect(parseCsv("")).toEqual({ ok: false, reason: "malformed" });
  });

  it("rejects a header row that is entirely blank", () => {
    expect(parseCsv(",,\nBlue widget,W-1")).toEqual({ ok: false, reason: "malformed" });
  });
});

describe("matchColumns", () => {
  it("matches aliases case-insensitively by exact or substring match", () => {
    const headers = ["Product Description", "SKU Code", "Material Type"];
    const result = matchColumns(headers, {
      description: ["description", "product"],
      sku: ["sku", "reference"],
      material: ["material"],
      jurisdiction: ["jurisdiction"],
    });
    expect(result).toEqual({
      description: "Product Description",
      sku: "SKU Code",
      material: "Material Type",
      jurisdiction: undefined,
    });
  });
});
