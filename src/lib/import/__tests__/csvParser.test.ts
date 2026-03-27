import { describe, it, expect } from "vitest";
import {
  parseCSV,
  detectColumnMapping,
  applyMapping,
  detectDuplicates,
  type ColumnMapping,
  type ParsedRow,
} from "../csvParser";

describe("parseCSV", () => {
  it("should parse a simple CSV", () => {
    const csv = "Date,Description,Amount\n2024-01-15,Loblaws,45.67";
    const { headers, rows } = parseCSV(csv);
    expect(headers).toEqual(["Date", "Description", "Amount"]);
    expect(rows).toEqual([["2024-01-15", "Loblaws", "45.67"]]);
  });

  it("should handle quoted fields with commas", () => {
    const csv = 'Date,Description,Amount\n2024-01-15,"Loblaws, Inc.",45.67';
    const { headers, rows } = parseCSV(csv);
    expect(rows[0][1]).toBe("Loblaws, Inc.");
  });

  it("should handle escaped quotes", () => {
    const csv = 'Date,Description,Amount\n2024-01-15,"Said ""hello""",45.67';
    const { headers, rows } = parseCSV(csv);
    expect(rows[0][1]).toBe('Said "hello"');
  });

  it("should handle various line endings", () => {
    const csv = "Date,Amount\r\n2024-01-15,45.67\r\n2024-01-16,12.00";
    const { headers, rows } = parseCSV(csv);
    expect(rows.length).toBe(2);
  });

  it("should handle empty lines", () => {
    const csv = "Date,Amount\n\n2024-01-15,45.67\n\n";
    const { headers, rows } = parseCSV(csv);
    expect(rows.length).toBe(1);
  });

  it("should return empty for empty input", () => {
    const { headers, rows } = parseCSV("");
    expect(headers).toEqual([]);
    expect(rows).toEqual([]);
  });
});

describe("detectColumnMapping", () => {
  it("should detect standard column names", () => {
    const headers = ["Date", "Description", "Amount"];
    const mapping = detectColumnMapping(headers);
    expect(mapping.date).toBe(0);
    expect(mapping.description).toBe(1);
    expect(mapping.amount).toBe(2);
  });

  it("should detect Canadian bank debit/credit format", () => {
    const headers = ["Transaction Date", "Memo", "Debit", "Credit"];
    const mapping = detectColumnMapping(headers);
    expect(mapping.date).toBe(0);
    expect(mapping.description).toBe(1);
    expect(mapping.debit).toBe(2);
    expect(mapping.credit).toBe(3);
    expect(mapping.amount).toBeUndefined();
  });

  it("should detect currency column", () => {
    const headers = ["Date", "Description", "Amount", "Currency"];
    const mapping = detectColumnMapping(headers);
    expect(mapping.currency).toBe(3);
  });

  it("should handle posted date", () => {
    const headers = ["Posted Date", "Payee", "Amount"];
    const mapping = detectColumnMapping(headers);
    expect(mapping.date).toBe(0);
  });
});

describe("applyMapping", () => {
  it("should parse rows with single amount column", () => {
    const rows = [
      ["2024-01-15", "Loblaws", "45.67"],
      ["2024-01-16", "Shell Gas", "-62.30"],
    ];
    const mapping: ColumnMapping = {
      date: 0,
      description: 1,
      amount: 2,
    };

    const result = applyMapping(rows, mapping);
    expect(result.validRows).toBe(2);
    expect(result.rows[0].amount).toBe(45.67);
    expect(result.rows[1].amount).toBe(-62.3);
  });

  it("should parse rows with debit/credit columns", () => {
    const rows = [
      ["2024-01-15", "Loblaws", "45.67", ""],
      ["2024-01-16", "Payroll", "", "3500.00"],
    ];
    const mapping: ColumnMapping = {
      date: 0,
      description: 1,
      debit: 2,
      credit: 3,
    };

    const result = applyMapping(rows, mapping);
    expect(result.validRows).toBe(2);
    expect(result.rows[0].amount).toBe(-45.67); // debit = negative
    expect(result.rows[1].amount).toBe(3500); // credit = positive
  });

  it("should handle dollar signs and thousands separators", () => {
    const rows = [["2024-01-15", "Big Purchase", "$1,234.56"]];
    const mapping: ColumnMapping = {
      date: 0,
      description: 1,
      amount: 2,
    };

    const result = applyMapping(rows, mapping);
    expect(result.rows[0].amount).toBe(1234.56);
  });

  it("should handle parenthetical negatives", () => {
    const rows = [["2024-01-15", "Refund", "(45.67)"]];
    const mapping: ColumnMapping = {
      date: 0,
      description: 1,
      amount: 2,
    };

    const result = applyMapping(rows, mapping);
    expect(result.rows[0].amount).toBe(-45.67);
  });

  it("should normalize date formats", () => {
    const rows = [
      ["01/15/2024", "Test", "100"],
      ["2024-01-16", "Test", "100"],
      ["Jan 17, 2024", "Test", "100"],
    ];
    const mapping: ColumnMapping = {
      date: 0,
      description: 1,
      amount: 2,
    };

    const result = applyMapping(rows, mapping);
    expect(result.rows[0].date).toBe("2024-01-15");
    expect(result.rows[1].date).toBe("2024-01-16");
    expect(result.rows[2].date).toBe("2024-01-17");
  });

  it("should collect errors for invalid rows", () => {
    const rows = [
      ["2024-01-15", "Good", "100"],
      ["", "No date", "100"],
      ["2024-01-16", "Bad amount", "abc"],
    ];
    const mapping: ColumnMapping = {
      date: 0,
      description: 1,
      amount: 2,
    };

    const result = applyMapping(rows, mapping);
    expect(result.validRows).toBe(1);
    expect(result.errors.length).toBe(2);
  });
});

describe("detectDuplicates", () => {
  it("should detect matching transactions", () => {
    const newRows: ParsedRow[] = [
      {
        date: "2024-01-15",
        description: "Loblaws",
        amount: 45.67,
        currency: "CAD",
        raw: {},
      },
      {
        date: "2024-01-16",
        description: "Shell",
        amount: 62.3,
        currency: "CAD",
        raw: {},
      },
    ];

    const existing = [
      { date: "2024-01-15", amount: 45.67, merchant: "Loblaws" },
    ];

    const dups = detectDuplicates(newRows, existing);
    expect(dups.has(0)).toBe(true);
    expect(dups.has(1)).toBe(false);
  });

  it("should not flag clearly different amounts", () => {
    const newRows: ParsedRow[] = [
      {
        date: "2024-01-15",
        description: "Loblaws",
        amount: 46.00,
        currency: "CAD",
        raw: {},
      },
    ];

    const existing = [
      { date: "2024-01-15", amount: 45.67, merchant: "Loblaws" },
    ];

    const dups = detectDuplicates(newRows, existing);
    expect(dups.has(0)).toBe(false);
  });
});
