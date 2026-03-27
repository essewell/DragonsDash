"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { v4 as uuid } from "uuid";
import {
  X,
  ArrowRight,
  Check,
  Search,
  Plus,
  Minus,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import clsx from "clsx";
import { useAppStore } from "@/store";
import { Button, Input } from "@/components/ui";
import type { Transaction, TransactionType, Currency } from "@/types";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "account" | "amount" | "type" | "details" | "confirm";

const quickAmounts = [50, 100, 500, 1000];

const transactionTypeOptions: {
  type: TransactionType;
  label: string;
  icon: typeof Plus;
}[] = [
  { type: "income", label: "Income", icon: Plus },
  { type: "expense", label: "Expense", icon: Minus },
  { type: "transfer", label: "Transfer", icon: ArrowLeftRight },
  { type: "investment_buy", label: "Investment Buy", icon: TrendingUp },
  { type: "investment_sell", label: "Investment Sell", icon: TrendingDown },
];

export function AddTransactionModal({
  isOpen,
  onClose,
}: AddTransactionModalProps) {
  const { accounts, subAccounts, categories, addTransaction } =
    useAppStore();

  const [step, setStep] = useState<Step>("account");
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [selectedSubAccountId, setSelectedSubAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] =
    useState<TransactionType>("expense");
  const [merchant, setMerchant] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [memo, setMemo] = useState("");
  const [tags, setTags] = useState("");
  const [currency, setCurrency] = useState<Currency>("CAD");

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus management
  useEffect(() => {
    if (isOpen && step === "account") {
      setSearchQuery("");
    }
    if (isOpen && step === "amount") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, step]);

  // Keyboard: Escape to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (step !== "account") {
          goBack();
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, step]);

  const handleClose = useCallback(() => {
    // Reset form
    setStep("account");
    setSelectedSubAccountId("");
    setAmount("");
    setTransactionType("expense");
    setMerchant("");
    setCategoryId("");
    setDate(new Date().toISOString().split("T")[0]);
    setMemo("");
    setTags("");
    setCurrency("CAD");
    setSearchQuery("");
    onClose();
  }, [onClose]);

  const goNext = () => {
    const steps: Step[] = ["account", "amount", "type", "details", "confirm"];
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  };

  const goBack = () => {
    const steps: Step[] = ["account", "amount", "type", "details", "confirm"];
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
  };

  const canProceed = () => {
    switch (step) {
      case "account":
        return selectedSubAccountId !== "";
      case "amount":
        return amount !== "" && parseFloat(amount) > 0;
      case "type":
        return true;
      case "details":
        return merchant !== "" && categoryId !== "";
      case "confirm":
        return true;
    }
  };

  const handleSubmit = () => {
    const subAccount = subAccounts.find(
      (sa) => sa.id === selectedSubAccountId,
    );
    if (!subAccount) return;

    const transaction: Transaction = {
      id: uuid(),
      subAccountId: selectedSubAccountId,
      type: transactionType,
      amount: parseFloat(amount),
      currency,
      merchant,
      categoryId,
      date,
      memo: memo || undefined,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      isSplit: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addTransaction(transaction);
    handleClose();
  };

  // Filter sub-accounts for search
  const filteredSubAccounts = subAccounts.filter((sa) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const account = accounts.find((a) => a.id === sa.accountId);
    return (
      sa.name.toLowerCase().includes(q) ||
      (account?.name.toLowerCase().includes(q) ?? false)
    );
  });

  // Recently used sub-accounts (for pinning)
  const recentSubAccountIds = useAppStore
    .getState()
    .getRecentTransactions(5)
    .map((t) => t.subAccountId);
  const uniqueRecent = [...new Set(recentSubAccountIds)];
  const recentSubs = filteredSubAccounts.filter((sa) =>
    uniqueRecent.includes(sa.id),
  );
  const otherSubs = filteredSubAccounts.filter(
    (sa) => !uniqueRecent.includes(sa.id),
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy-900/60"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-white rounded shadow-elevated overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between h-[48px] px-4 border-b border-warm-200 bg-warm-50">
          <div className="flex items-center gap-2">
            {step !== "account" && (
              <button
                onClick={goBack}
                className="text-warm-500 hover:text-warm-700 transition-colors"
                aria-label="Go back"
              >
                <ArrowRight size={16} className="rotate-180" />
              </button>
            )}
            <h2 className="text-sm font-sans font-semibold text-warm-800">
              Add Transaction
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-warm-400 hover:text-warm-700 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex h-[3px] bg-warm-100">
          <div
            className="bg-burnt transition-all duration-300"
            style={{
              width: `${
                ((
                  ["account", "amount", "type", "details", "confirm"] as Step[]
                ).indexOf(step) +
                  1) *
                  20
              }%`,
            }}
          />
        </div>

        {/* Step content */}
        <div className="p-4 min-h-[300px]">
          {/* Step 1: Select Account */}
          {step === "account" && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-warm-500 uppercase tracking-wider">
                Select account
              </p>

              {/* Search */}
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-warm-400"
                />
                <input
                  type="text"
                  placeholder="Search accounts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-[36px] pl-8 pr-3 text-sm rounded border border-warm-300 bg-white placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-burnt focus:border-burnt"
                  autoFocus
                />
              </div>

              {/* Recently used */}
              {recentSubs.length > 0 && !searchQuery && (
                <div>
                  <p className="text-2xs text-warm-400 uppercase tracking-wider mb-1">
                    Recently used
                  </p>
                  <div className="flex flex-col gap-[2px]">
                    {recentSubs.map((sa) => {
                      const account = accounts.find(
                        (a) => a.id === sa.accountId,
                      );
                      return (
                        <button
                          key={sa.id}
                          onClick={() => {
                            setSelectedSubAccountId(sa.id);
                            goNext();
                          }}
                          className={clsx(
                            "flex items-center justify-between h-[40px] px-3 rounded text-left",
                            "hover:bg-warm-50 transition-colors",
                            selectedSubAccountId === sa.id &&
                              "bg-navy-50 border border-navy-200",
                          )}
                        >
                          <div>
                            <p className="text-sm text-warm-800">
                              {sa.name}
                            </p>
                            {account && (
                              <p className="text-2xs text-warm-400">
                                {account.name}
                              </p>
                            )}
                          </div>
                          {account && (
                            <span className="text-2xs text-warm-500 uppercase">
                              {account.type}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All accounts */}
              <div className="flex flex-col gap-[2px]">
                {otherSubs.map((sa) => {
                  const account = accounts.find(
                    (a) => a.id === sa.accountId,
                  );
                  return (
                    <button
                      key={sa.id}
                      onClick={() => {
                        setSelectedSubAccountId(sa.id);
                        goNext();
                      }}
                      className={clsx(
                        "flex items-center justify-between h-[40px] px-3 rounded text-left",
                        "hover:bg-warm-50 transition-colors",
                        selectedSubAccountId === sa.id &&
                          "bg-navy-50 border border-navy-200",
                      )}
                    >
                      <div>
                        <p className="text-sm text-warm-800">{sa.name}</p>
                        {account && (
                          <p className="text-2xs text-warm-400">
                            {account.name}
                          </p>
                        )}
                      </div>
                      {account && (
                        <span className="text-2xs text-warm-500 uppercase">
                          {account.type}
                        </span>
                      )}
                    </button>
                  );
                })}

                {filteredSubAccounts.length === 0 && (
                  <p className="text-sm text-warm-400 text-center py-8">
                    {accounts.length === 0
                      ? "Create an account first"
                      : "No matching accounts"}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Enter Amount */}
          {step === "amount" && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-warm-500 uppercase tracking-wider">
                Enter amount
              </p>

              {/* Currency selector */}
              <div className="flex items-center gap-2">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="h-[36px] px-2 text-sm rounded border border-warm-300 bg-white"
                >
                  <option value="CAD">CAD</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              {/* Amount display */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-2xl text-warm-400 font-mono">
                    {currency === "CAD"
                      ? "$"
                      : currency === "USD"
                        ? "$"
                        : currency === "EUR"
                          ? "€"
                          : "£"}
                  </span>
                  <input
                    ref={inputRef}
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-40 text-3xl font-mono text-center tabular-nums bg-transparent border-none focus:outline-none placeholder:text-warm-300"
                  />
                </div>
              </div>

              {/* Quick-add buttons */}
              <div className="flex justify-center gap-2">
                {quickAmounts.map((qa) => (
                  <button
                    key={qa}
                    onClick={() => setAmount(String(qa))}
                    className="h-[32px] px-3 text-xs font-mono rounded border border-warm-300 text-warm-600 hover:bg-warm-50 transition-colors"
                  >
                    +${qa}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Transaction Type */}
          {step === "type" && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-warm-500 uppercase tracking-wider">
                Transaction type
              </p>
              <div className="grid grid-cols-2 gap-2">
                {transactionTypeOptions.map(
                  ({ type, label, icon: Icon }) => (
                    <button
                      key={type}
                      onClick={() => {
                        setTransactionType(type);
                        goNext();
                      }}
                      className={clsx(
                        "flex items-center gap-2 h-[48px] px-3 rounded border text-left",
                        "transition-colors",
                        transactionType === type
                          ? "bg-navy-50 border-navy-300 text-navy-900"
                          : "border-warm-200 hover:bg-warm-50 text-warm-700",
                      )}
                    >
                      <Icon size={16} strokeWidth={1.5} />
                      <span className="text-sm">{label}</span>
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          {/* Step 4: Details */}
          {step === "details" && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-warm-500 uppercase tracking-wider">
                Transaction details
              </p>

              <Input
                label="Merchant / Description"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g. Loblaw, Payroll, etc."
              />

              {/* Category selector */}
              <div className="flex flex-col gap-[4px]">
                <label className="text-xs font-medium text-warm-600 uppercase tracking-wider">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="h-[36px] px-2 text-sm rounded border border-warm-300 bg-white"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />

              <Input
                label="Memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Optional notes"
              />

              <Input
                label="Tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Comma-separated, e.g. work, reimbursable"
                hint="Separate multiple tags with commas"
              />
            </div>
          )}

          {/* Step 5: Confirm */}
          {step === "confirm" && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-warm-500 uppercase tracking-wider">
                Confirm transaction
              </p>

              <div className="bg-warm-50 rounded p-4 flex flex-col gap-3">
                {/* Amount */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-warm-500">Amount</span>
                  <span className="font-mono text-lg tabular-nums text-warm-900">
                    {new Intl.NumberFormat("en-CA", {
                      style: "currency",
                      currency,
                    }).format(parseFloat(amount))}
                  </span>
                </div>

                {/* Type */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-warm-500">Type</span>
                  <span className="text-sm text-warm-800">
                    {transactionTypeOptions.find(
                      (t) => t.type === transactionType,
                    )?.label ?? transactionType}
                  </span>
                </div>

                {/* Merchant */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-warm-500">Merchant</span>
                  <span className="text-sm text-warm-800">{merchant}</span>
                </div>

                {/* Category */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-warm-500">Category</span>
                  <span className="text-sm text-warm-800">
                    {categories.find((c) => c.id === categoryId)?.name ??
                      "—"}
                  </span>
                </div>

                {/* Account */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-warm-500">Account</span>
                  <span className="text-sm text-warm-800">
                    {subAccounts.find(
                      (sa) => sa.id === selectedSubAccountId,
                    )?.name ?? "—"}
                  </span>
                </div>

                {/* Date */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-warm-500">Date</span>
                  <span className="text-sm text-warm-800">{date}</span>
                </div>

                {memo && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-warm-500">Memo</span>
                    <span className="text-sm text-warm-800">{memo}</span>
                  </div>
                )}

                {tags && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-warm-500">Tags</span>
                    <span className="text-sm text-warm-800">{tags}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 h-[56px] px-4 border-t border-warm-200 bg-warm-50">
          {step !== "account" && (
            <Button variant="ghost" size="sm" onClick={goBack}>
              Back
            </Button>
          )}
          {step !== "confirm" ? (
            <Button
              size="sm"
              onClick={goNext}
              disabled={!canProceed()}
            >
              Continue
              <ArrowRight size={14} className="ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit}>
              <Check size={14} className="mr-1" />
              Confirm
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
