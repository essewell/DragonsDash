"use client";

import { useState, useCallback, useRef } from "react";
import { v4 as uuid } from "uuid";
import { Upload, FileText, AlertTriangle, Check, X } from "lucide-react";
import clsx from "clsx";
import { useAppStore } from "@/store";
import { Button, Card } from "@/components/ui";
import {
  parseCSV,
  detectColumnMapping,
  applyMapping,
  detectDuplicates,
  type ColumnMapping,
  type ParsedRow,
} from "@/lib/import/csvParser";
import type { Transaction } from "@/types";

interface CSVImportProps {
  subAccountId: string;
  onComplete: () => void;
  onCancel: () => void;
}

type ImportStep = "upload" | "mapping" | "preview" | "import";

export function CSVImport({ subAccountId, onComplete, onCancel }: CSVImportProps) {
  const { transactions, addTransaction, categories } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ImportStep>("upload");
  const [csvText, setCsvText] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [duplicateIndices, setDuplicateIndices] = useState<Set<number>>(new Set());
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvText(text);

        const { headers: h, rows: r } = parseCSV(text);
        setHeaders(h);
        setRows(r);

        // Auto-detect mapping
        const detected = detectColumnMapping(h);
        if (detected.date !== undefined && detected.description !== undefined && 
            (detected.amount !== undefined || (detected.debit !== undefined && detected.credit !== undefined))) {
          setMapping(detected as ColumnMapping);
          // Apply mapping and go to preview
          const result = applyMapping(r, detected as ColumnMapping);
          setParsedRows(result.rows);
          setErrors(result.errors);

          // Detect duplicates
          const existingTxns = transactions.map((t) => ({
            date: t.date,
            amount: t.amount,
            merchant: t.merchant,
          }));
          const dups = detectDuplicates(result.rows, existingTxns);
          setDuplicateIndices(dups);

          setStep("preview");
        } else {
          setStep("mapping");
        }
      };
      reader.readAsText(file);
    },
    [transactions],
  );

  const handleMappingConfirm = () => {
    if (!mapping) return;

    const result = applyMapping(rows, mapping);
    setParsedRows(result.rows);
    setErrors(result.errors);

    const existingTxns = transactions.map((t) => ({
      date: t.date,
      amount: t.amount,
      merchant: t.merchant,
    }));
    const dups = detectDuplicates(result.rows, existingTxns);
    setDuplicateIndices(dups);

    setStep("preview");
  };

  const handleImport = () => {
    const uncategorizedId = categories.find(
      (c) => c.name === "Uncategorized",
    )?.id;

    const rowsToImport = skipDuplicates
      ? parsedRows.filter((_, i) => !duplicateIndices.has(i))
      : parsedRows;

    for (const row of rowsToImport) {
      const transaction: Transaction = {
        id: uuid(),
        subAccountId,
        type: row.amount >= 0 ? "income" : "expense",
        amount: Math.abs(row.amount),
        currency: (row.currency as any) || "CAD",
        merchant: row.description,
        categoryId: uncategorizedId ?? "",
        date: row.date,
        memo: row.memo,
        tags: [],
        isSplit: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addTransaction(transaction);
    }

    onComplete();
  };

  return (
    <Card padding="lg">
      {/* Upload Step */}
      {step === "upload" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <Upload size={32} className="text-warm-400" />
          <div className="text-center">
            <p className="text-sm font-medium text-warm-800">
              Import Bank Statement
            </p>
            <p className="text-xs text-warm-500 mt-1">
              Upload a CSV file from your bank
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileText size={14} className="mr-1" />
            Select CSV File
          </Button>
          <button
            onClick={onCancel}
            className="text-xs text-warm-500 hover:text-warm-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Mapping Step */}
      {step === "mapping" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium text-warm-800">
            Map Columns
          </p>
          <p className="text-xs text-warm-500">
            Match your CSV columns to transaction fields
          </p>

          <div className="flex flex-col gap-3">
            {["date", "description", "amount"].map((field) => (
              <div key={field} className="flex items-center gap-3">
                <label className="text-xs text-warm-600 w-24 capitalize">
                  {field}
                </label>
                <select
                  value={mapping?.[field as keyof ColumnMapping] ?? ""}
                  onChange={(e) => {
                    const idx = parseInt(e.target.value);
                    setMapping((prev) => ({
                      ...(prev as ColumnMapping),
                      [field]: isNaN(idx) ? undefined : idx,
                    }));
                  }}
                  className="flex-1 h-[32px] px-2 text-xs rounded border border-warm-300 bg-white"
                >
                  <option value="">— select —</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h} (column {i + 1})
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button size="sm" onClick={handleMappingConfirm}>
              Apply Mapping
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Preview Step */}
      {step === "preview" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-warm-800">
                Preview Import
              </p>
              <p className="text-xs text-warm-500">
                {parsedRows.length} transactions found
                {duplicateIndices.size > 0 &&
                  ` (${duplicateIndices.size} potential duplicates)`}
              </p>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded p-3">
              <div className="flex items-center gap-1 mb-1">
                <AlertTriangle size={14} className="text-amber" />
                <span className="text-xs font-medium text-amber-dark">
                  {errors.length} parsing {errors.length === 1 ? "error" : "errors"}
                </span>
              </div>
              <ul className="text-2xs text-warm-600 max-h-24 overflow-y-auto">
                {errors.slice(0, 5).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
                {errors.length > 5 && (
                  <li>...and {errors.length - 5} more</li>
                )}
              </ul>
            </div>
          )}

          {/* Duplicate toggle */}
          {duplicateIndices.size > 0 && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="rounded border-warm-300"
              />
              <span className="text-xs text-warm-600">
                Skip {duplicateIndices.size} potential duplicates
              </span>
            </label>
          )}

          {/* Preview table */}
          <div className="overflow-x-auto max-h-64 border border-warm-200 rounded">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-warm-50 border-b border-warm-200">
                <tr>
                  <th className="px-2 py-1 text-left text-warm-600">Date</th>
                  <th className="px-2 py-1 text-left text-warm-600">Description</th>
                  <th className="px-2 py-1 text-right text-warm-600">Amount</th>
                  <th className="px-2 py-1 text-center text-warm-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.slice(0, 20).map((row, i) => (
                  <tr
                    key={i}
                    className={clsx(
                      "border-b border-warm-100",
                      duplicateIndices.has(i) && "bg-amber-50/50",
                    )}
                  >
                    <td className="px-2 py-1 font-mono text-warm-600">
                      {row.date}
                    </td>
                    <td className="px-2 py-1 text-warm-800 truncate max-w-[200px]">
                      {row.description}
                    </td>
                    <td
                      className={clsx(
                        "px-2 py-1 text-right font-mono tabular-nums",
                        row.amount >= 0 ? "text-forest" : "text-warm-800",
                      )}
                    >
                      {new Intl.NumberFormat("en-CA", {
                        style: "currency",
                        currency: row.currency || "CAD",
                      }).format(row.amount)}
                    </td>
                    <td className="px-2 py-1 text-center">
                      {duplicateIndices.has(i) ? (
                        <span className="text-amber text-2xs">Duplicate</span>
                      ) : (
                        <Check size={12} className="text-forest inline" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleImport}>
              Import{" "}
              {skipDuplicates
                ? parsedRows.length - duplicateIndices.size
                : parsedRows.length}{" "}
              transactions
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
