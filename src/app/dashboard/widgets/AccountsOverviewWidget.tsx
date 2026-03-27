import { Card, CardHeader } from "@/components/ui";

export function AccountsOverviewWidget() {
  const accounts: never[] = [];

  return (
    <Card padding="lg">
      <CardHeader title="Accounts" subtitle="All account containers" />
      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-center">
          <p className="text-sm text-warm-500">No accounts configured</p>
          <p className="text-xs text-warm-400 mt-1">
            Create your first account to begin tracking
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Account cards would render here from store */}
        </div>
      )}
    </Card>
  );
}
