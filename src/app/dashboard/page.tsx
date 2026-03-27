"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Landmark,
  CreditCard,
  Receipt,
} from "lucide-react";
import clsx from "clsx";
import { AppShell } from "@/components/layout";
import { Card, CardHeader, Sparkline, Badge, AnimatedCurrency } from "@/components/ui";
import { useAppStore } from "@/store";
import Link from "next/link";

export default function DashboardPage() {
  const {
    accounts,
    subAccounts,
    transactions,
    bills,
    getNetWorth,
    getAccountBalance,
  } = useAppStore();

  // Compute net worth
  const netWorth = useMemo(() => getNetWorth(), [accounts, transactions]);

  // Compute account balances
  const accountBalances = useMemo(() => {
    const balances = new Map<string, number>();
    for (const account of accounts) {
      balances.set(account.id, getAccountBalance(account.id));
    }
    return balances;
  }, [accounts, transactions]);

  // Group accounts by type for display
  const liquidAccounts = accounts.filter((a) =>
    ["chequing", "savings", "hisa", "cash"].includes(a.type),
  );
  const investmentAccounts = accounts.filter((a) =>
    ["tfsa", "rrsp", "fhsa", "resp", "nonregistered", "crypto"].includes(a.type),
  );
  const liabilityAccounts = accounts.filter((a) =>
    ["credit_card", "loan", "recurring"].includes(a.type),
  );

  // Total assets and liabilities
  const totalAssets = accounts
    .filter((a) => !["credit_card", "loan"].includes(a.type))
    .reduce((sum, a) => sum + (accountBalances.get(a.id) ?? 0), 0);

  const totalLiabilities = accounts
    .filter((a) => ["credit_card", "loan"].includes(a.type))
    .reduce((sum, a) => sum + Math.abs(accountBalances.get(a.id) ?? 0), 0);

  // Recent transactions (last 5)
  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    [transactions],
  );

  // Monthly spending (current month)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthlySpending = useMemo(() => {
    return transactions
      .filter((t) => {
        const d = new Date(t.date);
        return (
          t.type === "expense" &&
          d.getMonth() === currentMonth &&
          d.getFullYear() === currentYear
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, currentMonth, currentYear]);

  // Upcoming bills (due within 7 days)
  const upcomingBills = useMemo(() => {
    const today = now.getDate();
    return bills
      .filter((bill) => {
        const daysUntilDue = bill.dueDayOfMonth - today;
        return daysUntilDue >= 0 && daysUntilDue <= 7;
      })
      .sort((a, b) => a.dueDayOfMonth - b.dueDayOfMonth);
  }, [bills, now]);

  return (
    <AppShell>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
        {/* Net Worth — full width */}
        <div className="md:col-span-2 xl:col-span-12">
          <Card padding="lg">
            <CardHeader title="Net Worth" subtitle="All accounts" />
            <div className="flex items-baseline gap-4">
              {accounts.length === 0 ? (
                <div>
                  <span className="font-mono text-3xl text-warm-400 tabular-nums">
                    —
                  </span>
                  <p className="text-xs text-warm-500 mt-1">
                    Add accounts and transactions to see your net worth
                  </p>
                </div>
              ) : (
                <>
                  <AnimatedCurrency
                    value={netWorth}
                    className={clsx(
                      "font-mono text-3xl font-semibold tabular-nums",
                      netWorth >= 0 ? "text-warm-900" : "text-danger",
                    )}
                  />
                  <div className="flex gap-4 ml-auto">
                    <div className="text-right">
                      <p className="text-2xs text-warm-500">Assets</p>
                      <AnimatedCurrency
                        value={totalAssets}
                        className="font-mono text-sm tabular-nums text-forest"
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-2xs text-warm-500">Liabilities</p>
                      <AnimatedCurrency
                        value={totalLiabilities}
                        className="font-mono text-sm tabular-nums text-danger"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Accounts Overview — 8 columns */}
        <div className="xl:col-span-8">
          <Card padding="lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-sans font-semibold text-warm-800">
                Accounts
              </h3>
              <Link
                href="/accounts"
                className="flex items-center gap-1 text-xs text-burnt hover:text-burnt-light"
              >
                View all
                <ArrowRight size={12} />
              </Link>
            </div>

            {accounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <p className="text-sm text-warm-500">
                  No accounts configured
                </p>
                <p className="text-xs text-warm-400 mt-1">
                  Create your first account to begin tracking
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-[2px]">
                {/* Liquid */}
                {liquidAccounts.length > 0 && (
                  <>
                    <p className="text-2xs text-warm-400 uppercase tracking-wider mt-1 mb-[2px]">
                      Liquid
                    </p>
                    {liquidAccounts.map((account) => {
                      const balance = accountBalances.get(account.id) ?? 0;
                      const subs = subAccounts.filter(
                        (sa) => sa.accountId === account.id,
                      );
                      return (
                        <div
                          key={account.id}
                          className="flex items-center justify-between h-[36px] px-2 hover:bg-warm-50 rounded transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Landmark
                              size={14}
                              className="text-warm-400"
                            />
                            <span className="text-sm text-warm-800">
                              {account.name}
                            </span>
                            {subs.length > 0 && (
                              <span className="text-2xs text-warm-400">
                                ({subs.length})
                              </span>
                            )}
                          </div>
                          <AnimatedCurrency
                            value={balance}
                            currency={account.currency}
                            className={clsx(
                              "font-mono text-sm tabular-nums",
                              balance >= 0 ? "text-warm-800" : "text-danger",
                            )}
                          />
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Investments */}
                {investmentAccounts.length > 0 && (
                  <>
                    <p className="text-2xs text-warm-400 uppercase tracking-wider mt-2 mb-[2px]">
                      Investments
                    </p>
                    {investmentAccounts.map((account) => {
                      const balance = accountBalances.get(account.id) ?? 0;
                      return (
                        <div
                          key={account.id}
                          className="flex items-center justify-between h-[36px] px-2 hover:bg-warm-50 rounded transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <TrendingUp
                              size={14}
                              className="text-warm-400"
                            />
                            <span className="text-sm text-warm-800">
                              {account.name}
                            </span>
                          </div>
                          <AnimatedCurrency
                            value={balance}
                            currency={account.currency}
                            className="font-mono text-sm tabular-nums text-warm-800"
                          />
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Liabilities */}
                {liabilityAccounts.length > 0 && (
                  <>
                    <p className="text-2xs text-warm-400 uppercase tracking-wider mt-2 mb-[2px]">
                      Liabilities
                    </p>
                    {liabilityAccounts.map((account) => {
                      const balance = accountBalances.get(account.id) ?? 0;
                      return (
                        <div
                          key={account.id}
                          className="flex items-center justify-between h-[36px] px-2 hover:bg-warm-50 rounded transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <CreditCard
                              size={14}
                              className="text-warm-400"
                            />
                            <span className="text-sm text-warm-800">
                              {account.name}
                            </span>
                          </div>
                          <AnimatedCurrency
                            value={Math.abs(balance)}
                            currency={account.currency}
                            className="font-mono text-sm tabular-nums text-danger"
                          />
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right sidebar — 4 columns */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          {/* Monthly Spending */}
          <Card padding="lg">
            <CardHeader title="This Month" subtitle="Total spending" />
            {transactions.length === 0 ? (
              <span className="font-mono text-2xl text-warm-400 tabular-nums">
                —
              </span>
            ) : (
              <AnimatedCurrency
                value={monthlySpending}
                className="font-mono text-2xl tabular-nums text-warm-900"
              />
            )}
          </Card>

          {/* Upcoming Bills */}
          <Card padding="lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-sans font-semibold text-warm-800">
                Upcoming Bills
              </h3>
              <Link
                href="/spending"
                className="text-xs text-burnt hover:text-burnt-light"
              >
                View
              </Link>
            </div>
            {upcomingBills.length === 0 ? (
              <p className="text-sm text-warm-500 text-center py-4">
                {bills.length === 0
                  ? "No recurring bills"
                  : "No bills due this week"}
              </p>
            ) : (
              <div className="flex flex-col gap-[2px]">
                {upcomingBills.slice(0, 4).map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between h-[32px]"
                  >
                    <span className="text-xs text-warm-700">
                      {bill.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs tabular-nums text-warm-600">
                        {bill.amount
                          ? new Intl.NumberFormat("en-CA", {
                              style: "currency",
                              currency: "CAD",
                            }).format(bill.amount)
                          : "~"}
                      </span>
                      <Badge
                        variant={
                          bill.dueDayOfMonth - now.getDate() <= 1
                            ? "warning"
                            : "default"
                        }
                      >
                        Day {bill.dueDayOfMonth}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Transactions — full width */}
        <div className="md:col-span-2 xl:col-span-12">
          <Card padding="lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-sans font-semibold text-warm-800">
                Recent Transactions
              </h3>
              <Link
                href="/spending"
                className="flex items-center gap-1 text-xs text-burnt hover:text-burnt-light"
              >
                View all
                <ArrowRight size={12} />
              </Link>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-warm-500">
                  No transactions recorded
                </p>
                <p className="text-xs text-warm-400 mt-1">
                  Use the Add Transaction button to log your first entry
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-warm-200">
                      <th className="text-left text-xs font-medium text-warm-600 uppercase tracking-wider pb-2">
                        Date
                      </th>
                      <th className="text-left text-xs font-medium text-warm-600 uppercase tracking-wider pb-2">
                        Merchant
                      </th>
                      <th className="text-left text-xs font-medium text-warm-600 uppercase tracking-wider pb-2">
                        Type
                      </th>
                      <th className="text-right text-xs font-medium text-warm-600 uppercase tracking-wider pb-2">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((txn) => (
                      <tr
                        key={txn.id}
                        className="border-b border-warm-100 last:border-b-0"
                      >
                        <td className="h-[36px] font-mono text-xs tabular-nums text-warm-600">
                          {txn.date}
                        </td>
                        <td className="text-warm-800">
                          {txn.merchant || "—"}
                        </td>
                        <td>
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
                            "text-right font-mono tabular-nums",
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
