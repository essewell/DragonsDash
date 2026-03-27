// ============================================================
// DragonsDash — CSV Import Parser
// ============================================================
// Parses bank statement CSVs with configurable column mapping.
// Handles edge cases: multi-currency, negatives, duplicates.
// ============================================================

export interface CSVColumn {
  index: number;
  name: string;
  sample: string;
}

export interface ColumnMapping {
  date: number;
  description: number;
  amount?: number;
  debit?: number;
  credit?: number;
  currency?: number;
  category?: number;
  memo?: number;
}

export interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  currency: string;
  category?: string;
  memo?: string;
  raw: Record<string, string>;
}

export interface ParseResult {
  headers: CSVColumn[];
  rows: ParsedRow[];
  errors: string[];
  totalRows: number;
  validRows: number;
}

/**
 * Parse a CSV file string into structured rows.
 * Handles quoted fields, escaped quotes, and various line endings.
 */
export function parseCSV(csvText: string): {
  headers: string[];
  rows: string[][];
} {
  const lines = csvText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim() !== "");

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const parseCSVLine = (line: string): string[] => {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    fields.push(current.trim());
    return fields;
  };

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map((line) => parseCSVLine(line));

  return { headers, rows };
}

/**
 * Detect column mapping from headers using common patterns.
 */
export function detectColumnMapping(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {};
  const lower = headers.map((h) => h.toLowerCase().trim());

  // Date detection
  const datePatterns = ["date", "transaction date", "trans date", "posted date", "post date"];
  for (const pattern of datePatterns) {
    const idx = lower.findIndex((h) => h === pattern || h.includes(pattern));
    if (idx !== -1) {
      mapping.date = idx;
      break;
    }
  }

  // Description detection
  const descPatterns = ["description", "memo", "narrative", "details", "payee", "merchant"];
  for (const pattern of descPatterns) {
    const idx = lower.findIndex((h) => h === pattern || h.includes(pattern));
    if (idx !== -1) {
      mapping.description = idx;
      break;
    }
  }

  // Amount detection (single column)
  const amtPatterns = ["amount", "transaction amount", "trans amount"];
  for (const pattern of amtPatterns) {
    const idx = lower.findIndex((h) => h === pattern);
    if (idx !== -1) {
      mapping.amount = idx;
      break;
    }
  }

  // Debit/Credit detection (dual column — common in Canadian banks)
  if (mapping.amount === undefined) {
    const debitPatterns = ["debit", "withdrawal", "withdrawals", "money out"];
    for (const pattern of debitPatterns) {
      const idx = lower.findIndex((h) => h === pattern || h.includes(pattern));
      if (idx !== -1) {
        mapping.debit = idx;
        break;
      }
    }

    const creditPatterns = ["credit", "deposit", "deposits", "money in"];
    for (const pattern of creditPatterns) {
      const idx = lower.findIndex((h) => h === pattern || h.includes(pattern));
      if (idx !== -1) {
        mapping.credit = idx;
        break;
      }
    }
  }

  // Currency detection
  const currPatterns = ["currency", "curr", "ccy"];
  const currIdx = lower.findIndex(
    (h) => h === "currency" || h.includes("currency") || h === "curr",
  );
  if (currIdx !== -1) mapping.currency = currIdx;

  // Category detection
  const catIdx = lower.findIndex(
    (h) => h === "category" || h.includes("category"),
  );
  if (catIdx !== -1) mapping.category = catIdx;

  return mapping;
}

/**
 * Convert raw CSV rows to ParsedRows using a column mapping.
 */
export function applyMapping(
  rows: string[][],
  mapping: ColumnMapping,
): ParseResult {
  const errors: string[] = [];
  const parsed: ParsedRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      // Parse date
      const rawDate = row[mapping.date];
      if (!rawDate) {
        errors.push(`Row ${i + 2}: Missing date`);
        continue;
      }
      const date = normalizeDate(rawDate);
      if (!date) {
        errors.push(`Row ${i + 2}: Invalid date format "${rawDate}"`);
        continue;
      }

      // Parse description
      const description = row[mapping.description] ?? "";

      // Parse amount
      let amount: number;
      if (mapping.amount !== undefined) {
        amount = parseAmount(row[mapping.amount]);
      } else if (mapping.debit !== undefined && mapping.credit !== undefined) {
        const debit = parseAmount(row[mapping.debit] ?? "0");
        const credit = parseAmount(row[mapping.credit] ?? "0");
        amount = credit - debit; // positive = money in, negative = money out
      } else {
        errors.push(`Row ${i + 2}: No amount column found`);
        continue;
      }

      if (isNaN(amount)) {
        errors.push(`Row ${i + 2}: Invalid amount "${row[mapping.amount ?? mapping.debit ?? 0]}"`);
        continue;
      }

      // Parse currency
      const currency = mapping.currency !== undefined
        ? (row[mapping.currency] ?? "CAD")
        : "CAD";

      // Parse category
      const category = mapping.category !== undefined
        ? row[mapping.category]
        : undefined;

      // Parse memo
      const memo = mapping.memo !== undefined
        ? row[mapping.memo]
        : undefined;

      const raw: Record<string, string> = {};
      row.forEach((val, idx) => {
        raw[String(idx)] = val;
      });

      parsed.push({
        date,
        description,
        amount,
        currency,
        category,
        memo,
        raw,
      });
    } catch (e) {
      errors.push(`Row ${i + 2}: ${e instanceof Error ? e.message : "Parse error"}`);
    }
  }

  return {
    headers: [],
    rows: parsed,
    errors,
    totalRows: rows.length,
    validRows: parsed.length,
  };
}

/**
 * Normalize various date formats to ISO 8601 (YYYY-MM-DD).
 * Handles: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, MMM DD, YYYY, etc.
 */
function normalizeDate(raw: string): string | null {
  const cleaned = raw.trim().replace(/\//g, "-");

  // Try YYYY-MM-DD
  const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Try MM-DD-YYYY (common in Canadian bank exports)
  const mdYMatch = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (mdYMatch) {
    const [, m, d, y] = mdYMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Try "Jan 15, 2024" or "15 Jan 2024"
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return null;
}

/**
 * Parse a monetary string to a number.
 * Handles: $1,234.56, (1234.56) for negatives, -1234.56, etc.
 */
function parseAmount(raw: string): number {
  if (raw === null || raw === undefined) return NaN;

  let cleaned = raw.trim();

  if (cleaned === "") return 0;

  // Handle parentheses as negative: (1234.56) -> -1234.56
  const parenMatch = cleaned.match(/^\(([^)]+)\)$/);
  if (parenMatch) {
    cleaned = `-${parenMatch[1]}`;
  }

  // Remove currency symbols and thousands separators
  cleaned = cleaned
    .replace(/[$£€¥]/g, "")
    .replace(/,/g, "")
    .replace(/\s/g, "")
    .trim();

  if (cleaned === "" || cleaned === "-") return 0;

  return parseFloat(cleaned);
}

/**
 * Detect potential duplicate transactions.
 * Compares date + amount + description similarity.
 */
export function detectDuplicates(
  newRows: ParsedRow[],
  existingTransactions: { date: string; amount: number; merchant: string }[],
): Set<number> {
  const duplicateIndices = new Set<number>();

  for (let i = 0; i < newRows.length; i++) {
    const newRow = newRows[i];
    for (const existing of existingTransactions) {
      if (
        newRow.date === existing.date &&
        Math.abs(newRow.amount - existing.amount) <= 0.01 &&
        newRow.description.toLowerCase().includes(
          existing.merchant.toLowerCase().slice(0, 10),
        )
      ) {
        duplicateIndices.add(i);
        break;
      }
    }
  }

  return duplicateIndices;
}
