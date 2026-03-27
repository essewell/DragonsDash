import { Card, CardHeader, Sparkline } from "@/components/ui";

export function NetWorthWidget() {
  // No data entered yet — show empty state per Mandate 0
  const hasData = false;

  return (
    <Card padding="lg">
      <CardHeader
        title="Net Worth"
        subtitle="All accounts, all currencies"
      />
      <div className="flex items-baseline gap-3 mt-2">
        {hasData ? (
          <>
            <span className="font-mono text-3xl font-semibold text-navy-900 tabular-nums">
              {/* Value would come from computed net worth */}
            </span>
            {/* Trend sparkline */}
          </>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="font-mono text-3xl text-warm-400 tabular-nums">
              —
            </span>
            <span className="text-xs text-warm-500">
              Add accounts and transactions to see your net worth
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
