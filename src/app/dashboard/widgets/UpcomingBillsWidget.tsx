import { Card, CardHeader } from "@/components/ui";

export function UpcomingBillsWidget() {
  const bills: never[] = [];

  return (
    <Card padding="lg">
      <CardHeader title="Upcoming Bills" subtitle="Next 30 days" />
      {bills.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-center">
          <p className="text-sm text-warm-500">No recurring bills</p>
          <p className="text-xs text-warm-400 mt-1">
            Add bills to track upcoming payments
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-[2px]">
          {/* Bill list items would render here */}
        </ul>
      )}
    </Card>
  );
}
