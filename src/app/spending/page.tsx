"use client";

import { useState, useMemo } from "react";
import clsx from "clsx";
import { AppShell } from "@/components/layout";
import { Card, CardHeader, Badge, Table } from "@/components/ui";
import { BillsPage } from "@/components/widgets/BillsPage";
import { useAppStore } from "@/store";

type Tab = "transactions" | "analytics" | "bills";

export default function SpendingPage() {
  const { transactions, categories } = useAppStore();
  const [tab, setTab] = useState<Tab>("transactions");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Category spending breakdown (current month)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const categoryBreakdown = useMemo(() => {
    const monthTransactions = transactions.filter((t) => {
      const d = new Date(t.date);
      return (
        t.type === "expense" &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      );
    });

    const breakdown = new Map<string, number>();
    for (const txn of monthTransactions) {
      const current = breakdown.get(txn.categoryId) ?? 0;
      breakdown.set(txn.categoryId, current + txn.amount);
    }

    return Array.from(breakdown.entries())
      .map(([catId, amount]) => ({
        category: categories.find((c) => c.id === catId),
        amount,
      }))
      .filter((b) => b.category)
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, categories, currentMonth, currentYear]);

  const totalMonthSpending = categoryBreakdown.reduce(
    (sum, b) => sum + b.amount,
    0,
  );

  // Spending velocity
  const velocity = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const yearAgo = new Date();
    yearAgo.setDate(yearAgo.getDate() - 365);

    const calcVelocity = (since: Date) => {
      const filtered = transactions.filter(
        (t) => t.type === "expense" && new Date(t.date) >= since,
      );
      const total = filtered.reduce((sum, t) => sum + t.amount, 0);
      const days = Math.max(
        1,
        Math.ceil((now.getTime() - since.getTime()) / (1000 * 60 * 60 * 24)),
      );
      return { total, avg: total / days };
    };

    return {
      thirty: calcVelocity(thirtyDaysAgo),
      ninety: calcVelocity(ninetyDaysAgo),
      year: calcVelocity(yearAgo),
    };
  }, [transactions, now]);

  // Budget vs Actual
  const budgetData = useMemo(() => {
    return categories
      .filter((c) => c.budgetMonthly && c.budgetMonthly > 0)
      .map((cat) => {
        const spent = categoryBreakdown.find(
          (b) => b.category?.id === cat.id,
        )?.amount ?? 0;
        const budget = cat.budgetMonthly!;
        return {
          category: cat,
          budget,
          spent,
          remaining: budget - spent,
          percentUsed: (spent / budget) * 100,
        };
      })
      .sort((a, b) => b.percentUsed - a.percentUsed);
  }, [categories, categoryBreakdown]);

  // Filtered transactions for list
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions].sort(
      (a, b) => b.date.localeCompare(a.date),
    );
    if (categoryFilter) {
      filtered = filtered.filter((t) => t.categoryId === categoryFilter);
    }
    return filtered;
  }, [transactions, categoryFilter]);

  // Merchant frequency analysis
  const merchantStats = useMemo(() => {
    const stats = new Map<string, { count: number; total: number }>();
    for (const txn of transactions.filter((t) => t.type === "expense")) {
      const current = stats.get(txn.merchant) ?? { count: 0, total: 0 };
      stats.set(txn.merchant, {
        count: current.count + 1,
        total: current.total + txn.amount,
      });
    }
    return Array.from(stats.entries())
      .map(([merchant, data]) => ({
        merchant,
        ...data,
        avg: data.total / data.count,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [transactions]);

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-display font-bold text-navy-900">
            Spending
          </h2>
          <p className="text-sm text-warm-500 mt-1">
            Transaction history, analytics, and bills
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-warm-200">
        {[
          { key: "transactions" as Tab, label: "Transactions" },
          { key: "analytics" as Tab, label: "Analytics" },
          { key: "bills" as Tab, label: "Bills" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              "h-[36px] px-3 text-sm border-b-2 -mb-[1px] transition-colors",
              tab === t.key
                ? "border-burnt text-burnt font-medium"
                : "border-transparent text-warm-500 hover:text-warm-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Transactions Tab */}
      {tab === "transactions" && (
        <div className="flex flex-col gap-4">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-[32px] px-2 text-xs rounded border border-warm-300 bg-white"
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-warm-500">
              {filteredTransactions.length} transaction
              {filteredTransactions.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Transaction List */}
          {filteredTransactions.length === 0 ? (
            <Card padding="lg">
              <p className="text-sm text-warm-500 text-center py-8">
                No transactions recorded
              </p>
            </Card>
          ) : (
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-warm-200 bg-warm-50">
                      <th className="text-left text-xs font-medium text-warm-600 uppercase tracking-wider h-[36px] px-3">
                        Date
                      </th>
                      <th className="text-left text-xs font-medium text-warm-600 uppercase tracking-wider h-[36px] px-3">
                        Merchant
                      </th>
                      <th className="text-left text-xs font-medium text-warm-600 uppercase tracking-wider h-[36px] px-3">
                        Category
                      </th>
                      <th className="text-left text-xs font-medium text-warm-600 uppercase tracking-wider h-[36px] px-3">
                        Type
                      </th>
                      <th className="text-right text-xs font-medium text-warm-600 uppercase tracking-wider h-[36px] px-3">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((txn, i) => {
                      const cat = categories.find(
                        (c) => c.id === txn.categoryId,
                      );
                      return (
                        <tr
                          key={txn.id}
                          className={clsx(
                            "border-b border-warm-100 last:border-b-0",
                            i % 2 === 1 && "bg-warm-50",
                          )}
                        >
                          <td className="h-[36px] px-3 font-mono text-xs tabular-nums text-warm-600">
                            {txn.date}
                          </td>
                          <td className="h-[36px] px-3 text-warm-800">
                            {txn.merchant || "—"}
                          </td>
                          <td className="h-[36px] px-3">
                            <Badge variant="default">{cat?.name ?? "—"}</Badge>
                          </td>
                          <td className="h-[36px] px-3">
                            <Badge
                              variant={
                                txn.type === "income"
                                  ? "positive"
                                  : txn.type === "expense"
                                    ? "default"
                                    : "info"
                              }
                            >
                              {txn.type}
                            </Badge>
                          </td>
                          <td
                            className={clsx(
                              "h-[36px] px-3 text-right font-mono tabular-nums",
                              txn.type === "income"
                                ? "text-forest"
                                : "text-warm-800",
                            )}
                          >
                            {txn.type === "income" ? "+" : "-"}
                            {new Intl.NumberFormat("en-CA", {
                              style: "currency",
                              currency: txn.currency,
                            }).format(txn.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {tab === "analytics" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Category Breakdown */}
          <div className="lg:col-span-4">
            <Card padding="lg">
              <CardHeader
                title="Category Breakdown"
                subtitle="This month"
              />
              {categoryBreakdown.length === 0 ? (
                <p className="text-sm text-warm-500 text-center py-8">
                  No spending this month
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {categoryBreakdown.map(({ category, amount }) => {
                    const pct = totalMonthSpending > 0
                      ? (amount / totalMonthSpending) * 100
                      : 0;
                    return (
                      <div key={category!.id}>
                        <div className="flex items-center justify-between mb-[2px]">
                          <span className="text-xs text-warm-700">
                            {category!.name}
                          </span>
                          <span className="font-mono text-xs tabular-nums text-warm-600">
                            {new Intl.NumberFormat("en-CA", {
                              style: "currency",
                              currency: "CAD",
                            }).format(amount)}
                          </span>
                        </div>
                        <div className="h-[4px] bg-warm-100 rounded overflow-hidden">
                          <div
                            className="h-full bg-burnt rounded"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Spending Velocity */}
          <div className="lg:col-span-4">
            <Card padding="lg">
              <CardHeader
                title="Spending Velocity"
                subtitle="Daily average"
              />
              <div className="flex flex-col gap-3 mt-2">
                {[
                  { period: "30 days", data: velocity.thirty },
                  { period: "90 days", data: velocity.ninety },
                  { period: "365 days", data: velocity.year },
                ].map(({ period, data }) => (
                  <div
                    key={period}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs text-warm-600">{period}</span>
                      <p className="text-2xs text-warm-400">
                        Total:{" "}
                        {new Intl.NumberFormat("en-CA", {
                          style: "currency",
                          currency: "CAD",
                        }).format(data.total)}
                      </p>
                    </div>
                    <span className="font-mono text-sm tabular-nums text-warm-800">
                      {new Intl.NumberFormat("en-CA", {
                        style: "currency",
                        currency: "CAD",
                      }).format(data.avg)}
                      <span className="text-2xs text-warm-400">/day</span>
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Budget vs Actual */}
          <div className="lg:col-span-4">
            <Card padding="lg">
              <CardHeader title="Budget vs Actual" subtitle="This month" />
              {budgetData.length === 0 ? (
                <p className="text-sm text-warm-500 text-center py-8">
                  No budgets configured
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {budgetData.map(
                    ({ category, budget, spent, remaining, percentUsed }) => (
                      <div key={category.id}>
                        <div className="flex items-center justify-between mb-[2px]">
                          <span className="text-xs text-warm-700">
                            {category.name}
                          </span>
                          <span
                            className={clsx(
                              "font-mono text-xs tabular-nums",
                              percentUsed > 100
                                ? "text-danger"
                                : percentUsed > 80
                                  ? "text-amber"
                                  : "text-warm-600",
                            )}
                          >
                            {new Intl.NumberFormat("en-CA", {
                              style: "currency",
                              currency: "CAD",
                            }).format(spent)}{" "}
                            /{" "}
                            {new Intl.NumberFormat("en-CA", {
                              style: "currency",
                              currency: "CAD",
                            }).format(budget)}
                          </span>
                        </div>
                        <div className="h-[4px] bg-warm-100 rounded overflow-hidden">
                          <div
                            className={clsx(
                              "h-full rounded",
                              percentUsed > 100
                                ? "bg-danger"
                                : percentUsed > 80
                                  ? "bg-amber"
                                  : "bg-forest",
                            )}
                            style={{
                              width: `${Math.min(percentUsed, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Merchant Frequency */}
          <div className="lg:col-span-12">
            <Card padding="lg">
              <CardHeader
                title="Top Merchants"
                subtitle="By total spend"
              />
              {merchantStats.length === 0 ? (
                <p className="text-sm text-warm-500 text-center py-8">
                  No merchant data
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-warm-200">
                      <th className="text-left text-xs font-medium text-warm-600 uppercase tracking-wider pb-2">
                        Merchant
                      </th>
                      <th className="text-right text-xs font-medium text-warm-600 uppercase tracking-wider pb-2">
                        Visits
                      </th>
                      <th className="text-right text-xs font-medium text-warm-600 uppercase tracking-wider pb-2">
                        Avg Spend
                      </th>
                      <th className="text-right text-xs font-medium text-warm-600 uppercase tracking-wider pb-2">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {merchantStats.map((m, i) => (
                      <tr
                        key={m.merchant}
                        className={clsx(
                          "border-b border-warm-100 last:border-b-0",
                          i % 2 === 1 && "bg-warm-50",
                        )}
                      >
                        <td className="h-[36px] text-warm-800">
                          {m.merchant}
                        </td>
                        <td className="h-[36px] text-right font-mono tabular-nums text-warm-600">
                          {m.count}
                        </td>
                        <td className="h-[36px] text-right font-mono tabular-nums text-warm-600">
                          {new Intl.NumberFormat("en-CA", {
                            style: "currency",
                            currency: "CAD",
                          }).format(m.avg)}
                        </td>
                        <td className="h-[36px] text-right font-mono tabular-nums text-warm-800">
                          {new Intl.NumberFormat("en-CA", {
                            style: "currency",
                            currency: "CAD",
                          }).format(m.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Bills Tab */}
      {tab === "bills" && <BillsPage />}
    </AppShell>
  );
}
