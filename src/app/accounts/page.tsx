"use client";

import { useState, useMemo } from "react";
import { Plus, ChevronRight, ChevronDown, Upload, Edit2 } from "lucide-react";
import clsx from "clsx";
import { AppShell } from "@/components/layout";
import { Card, Button, Badge } from "@/components/ui";
import { AccountModal } from "@/components/modals/AccountModal";
import { CSVImport } from "@/components/transactions/CSVImport";
import { useAppStore } from "@/store";
import type { Account, AccountContainerType } from "@/types";

const accountTypeLabels: Record<AccountContainerType, string> = {
  chequing: "Chequing",
  savings: "Savings",
  hisa: "HISA",
  cash: "Cash",
  tfsa: "TFSA",
  rrsp: "RRSP",
  fhsa: "FHSA",
  resp: "RESP",
  nonregistered: "Non-Registered",
  crypto: "Crypto",
  credit_card: "Credit Card",
  loan: "Loan",
  recurring: "Recurring",
};

const accountTypeOrder: AccountContainerType[] = [
  "chequing",
  "savings",
  "hisa",
  "cash",
  "tfsa",
  "rrsp",
  "fhsa",
  "resp",
  "nonregistered",
  "crypto",
  "credit_card",
  "loan",
  "recurring",
];

export default function AccountsPage() {
  const { accounts, subAccounts, getAccountBalance, transactions } =
    useAppStore();
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(
    new Set(),
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [csvImportSubAccountId, setCsvImportSubAccountId] = useState<
    string | null
  >(null);

  const toggleExpand = (id: string) => {
    setExpandedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openEditModal = (account: Account) => {
    setEditAccount(account);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditAccount(null);
    setIsModalOpen(true);
  };

  // Group accounts by type
  const grouped = accounts.reduce(
    (acc, account) => {
      if (!acc[account.type]) acc[account.type] = [];
      acc[account.type].push(account);
      return acc;
    },
    {} as Record<AccountContainerType, Account[]>,
  );

  // Total balance per sub-account
  const getSubAccountTransactionCount = (subAccountId: string) => {
    return transactions.filter((t) => t.subAccountId === subAccountId).length;
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-display font-bold text-navy-900">
            Accounts
          </h2>
          <p className="text-sm text-warm-500 mt-1">
            {accounts.length} account{accounts.length !== 1 ? "s" : ""},{" "}
            {subAccounts.length} sub-account
            {subAccounts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button size="sm" onClick={openCreateModal}>
          <Plus size={14} strokeWidth={2} className="mr-1" />
          Add Account
        </Button>
      </div>

      {/* CSV Import */}
      {csvImportSubAccountId && (
        <div className="mb-4">
          <CSVImport
            subAccountId={csvImportSubAccountId}
            onComplete={() => setCsvImportSubAccountId(null)}
            onCancel={() => setCsvImportSubAccountId(null)}
          />
        </div>
      )}

      {accounts.length === 0 ? (
        <Card padding="lg">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-warm-500">No accounts configured</p>
            <p className="text-xs text-warm-400 mt-1 mb-4">
              Create your first account container to begin tracking
            </p>
            <Button size="sm" onClick={openCreateModal}>
              <Plus size={14} strokeWidth={2} className="mr-1" />
              Create Account
            </Button>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {accountTypeOrder.map((type) => {
            const typeAccounts = grouped[type];
            if (!typeAccounts || typeAccounts.length === 0) return null;

            return (
              <div key={type}>
                <h3 className="text-xs font-medium text-warm-600 uppercase tracking-wider mb-2">
                  {accountTypeLabels[type]}
                </h3>
                <div className="flex flex-col gap-[2px]">
                  {typeAccounts.map((account) => {
                    const isExpanded = expandedAccounts.has(account.id);
                    const subs = subAccounts.filter(
                      (sa) => sa.accountId === account.id,
                    );
                    const balance = getAccountBalance(account.id);

                    return (
                      <Card key={account.id} padding="none">
                        <div className="flex items-center justify-between h-[44px] px-3 hover:bg-warm-50 transition-colors">
                          <button
                            onClick={() => toggleExpand(account.id)}
                            className="flex items-center gap-2 flex-1 text-left"
                          >
                            {subs.length > 0 && (
                              <span className="text-warm-400">
                                {isExpanded ? (
                                  <ChevronDown size={14} />
                                ) : (
                                  <ChevronRight size={14} />
                                )}
                              </span>
                            )}
                            <span className="text-sm font-medium text-warm-800">
                              {account.name}
                            </span>
                            {account.institution && (
                              <span className="text-xs text-warm-400">
                                {account.institution}
                              </span>
                            )}
                            {subs.length > 0 && (
                              <Badge>
                                {subs.length} sub
                                {subs.length !== 1 ? "s" : ""}
                              </Badge>
                            )}
                          </button>
                          <div className="flex items-center gap-2">
                            <span
                              className={clsx(
                                "font-mono text-sm tabular-nums",
                                balance >= 0
                                  ? "text-warm-800"
                                  : "text-danger",
                              )}
                            >
                              {balance === 0
                                ? "—"
                                : new Intl.NumberFormat("en-CA", {
                                    style: "currency",
                                    currency: account.currency,
                                  }).format(balance)}
                            </span>
                            <button
                              onClick={() => openEditModal(account)}
                              className="text-warm-400 hover:text-warm-700 p-1"
                              aria-label={`Edit ${account.name}`}
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        </div>

                        {isExpanded && subs.length > 0 && (
                          <div className="border-t border-warm-100 bg-warm-50">
                            {subs.map((sub) => {
                              const txnCount =
                                getSubAccountTransactionCount(sub.id);
                              return (
                                <div
                                  key={sub.id}
                                  className="flex items-center justify-between h-[36px] px-3 pl-8 border-b border-warm-100 last:border-b-0"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-warm-600">
                                      {sub.name}
                                    </span>
                                    {sub.institution && (
                                      <span className="text-2xs text-warm-400">
                                        {sub.institution}
                                      </span>
                                    )}
                                    <span className="text-2xs text-warm-400">
                                      {txnCount} txn
                                      {txnCount !== 1 ? "s" : ""}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() =>
                                      setCsvImportSubAccountId(sub.id)
                                    }
                                    className="flex items-center gap-1 text-2xs text-burnt hover:text-burnt-light"
                                  >
                                    <Upload size={10} />
                                    Import CSV
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AccountModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditAccount(null);
        }}
        editAccount={editAccount}
      />
    </AppShell>
  );
}
