import { Card, CardHeader } from "@/components/ui";

export function RecentTransactionsWidget() {
  const transactions: never[] = [];

  return (
    <Card padding="lg">
      <CardHeader title="Recent Transactions" subtitle="Last 10 entries" />
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-24 text-center">
          <p className="text-sm text-warm-500">No transactions recorded</p>
          <p className="text-xs text-warm-400 mt-1">
            Use the Add Transaction button to log your first entry
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Transaction table would render here */}
        </div>
      )}
    </Card>
  );
}
