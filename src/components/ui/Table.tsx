import { type ReactNode } from "react";
import clsx from "clsx";

interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  monospace?: boolean;
  className?: string;
  render: (row: T) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  zebra?: boolean;
  dense?: boolean;
  onRowClick?: (row: T) => void;
  emptyState?: string;
}

export function Table<T>({
  columns,
  data,
  rowKey,
  zebra = true,
  dense = false,
  onRowClick,
  emptyState = "No data",
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-16 text-sm text-warm-500 border border-warm-200 rounded bg-white">
        {emptyState}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-warm-200 rounded bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-warm-200 bg-warm-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  "text-xs font-medium text-warm-600 uppercase tracking-wider",
                  dense ? "h-[32px] px-2" : "h-[36px] px-3",
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                      ? "text-center"
                      : "text-left",
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={rowKey(row)}
              className={clsx(
                "border-b border-warm-100 last:border-b-0 transition-colors",
                zebra && idx % 2 === 1 && "bg-warm-50",
                onRowClick &&
                  "cursor-pointer hover:bg-navy-50 transition-colors",
              )}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={clsx(
                    dense ? "h-[32px] px-2" : "h-[36px] px-3",
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                        ? "text-center"
                        : "text-left",
                    col.monospace && "font-mono tabular-nums",
                    col.className,
                  )}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
