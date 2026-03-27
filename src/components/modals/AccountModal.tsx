"use client";

import { useState, useEffect } from "react";
import { v4 as uuid } from "uuid";
import { X, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { useAppStore } from "@/store";
import { Button, Input } from "@/components/ui";
import { calculateTFSARoom, TFSA_ANNUAL_LIMITS, calculateFHSARoom } from "@/lib/calculations";
import type { Account, AccountContainerType, SubAccount, Currency } from "@/types";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  editAccount?: Account | null;
}

const accountTypes: { value: AccountContainerType; label: string; group: string }[] = [
  { value: "chequing", label: "Chequing", group: "Liquid" },
  { value: "savings", label: "Savings", group: "Liquid" },
  { value: "hisa", label: "HISA", group: "Liquid" },
  { value: "cash", label: "Cash", group: "Liquid" },
  { value: "tfsa", label: "TFSA", group: "Tax-Advantaged" },
  { value: "rrsp", label: "RRSP", group: "Tax-Advantaged" },
  { value: "fhsa", label: "FHSA", group: "Tax-Advantaged" },
  { value: "resp", label: "RESP", group: "Tax-Advantaged" },
  { value: "nonregistered", label: "Non-Registered", group: "Investment" },
  { value: "crypto", label: "Cryptocurrency", group: "Investment" },
  { value: "credit_card", label: "Credit Card", group: "Liabilities" },
  { value: "loan", label: "Loan", group: "Liabilities" },
  { value: "recurring", label: "Recurring", group: "Liabilities" },
];

export function AccountModal({ isOpen, onClose, editAccount }: AccountModalProps) {
  const { addAccount, updateAccount, addSubAccount, subAccounts, deleteAccount } =
    useAppStore();

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountContainerType>("chequing");
  const [institution, setInstitution] = useState("");
  const [currency, setCurrency] = useState<Currency>("CAD");
  const [rrspDeductionLimit, setRrspDeductionLimit] = useState("");
  const [fhsaContributions, setFhsaContributions] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newSubInstitution, setNewSubInstitution] = useState("");
  const [pendingSubs, setPendingSubs] = useState<
    { name: string; institution: string }[]
  >([]);
  const [showSubForm, setShowSubForm] = useState(false);

  // Pre-fill on edit
  useEffect(() => {
    if (editAccount) {
      setName(editAccount.name);
      setType(editAccount.type);
      setInstitution(editAccount.institution ?? "");
      setCurrency(editAccount.currency);
      setRrspDeductionLimit(
        editAccount.rrspDeductionLimit?.toString() ?? "",
      );
      setFhsaContributions(
        editAccount.fhsaCumulativeContributions?.toString() ?? "",
      );
    } else {
      resetForm();
    }
  }, [editAccount, isOpen]);

  const resetForm = () => {
    setName("");
    setType("chequing");
    setInstitution("");
    setCurrency("CAD");
    setRrspDeductionLimit("");
    setFhsaContributions("");
    setNewSubName("");
    setNewSubInstitution("");
    setPendingSubs([]);
    setShowSubForm(false);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const now = new Date().toISOString();

    if (editAccount) {
      updateAccount(editAccount.id, {
        name: name.trim(),
        type,
        institution: institution.trim() || undefined,
        currency,
        rrspDeductionLimit:
          type === "rrsp" && rrspDeductionLimit
            ? parseFloat(rrspDeductionLimit)
            : undefined,
        fhsaCumulativeContributions:
          type === "fhsa" && fhsaContributions
            ? parseFloat(fhsaContributions)
            : undefined,
      });

      // Add new sub-accounts
      for (const sub of pendingSubs) {
        addSubAccount({
          id: uuid(),
          accountId: editAccount.id,
          name: sub.name,
          institution: sub.institution || undefined,
          createdAt: now,
          updatedAt: now,
        });
      }
    } else {
      const accountId = uuid();
      addAccount({
        id: accountId,
        name: name.trim(),
        type,
        institution: institution.trim() || undefined,
        currency,
        rrspDeductionLimit:
          type === "rrsp" && rrspDeductionLimit
            ? parseFloat(rrspDeductionLimit)
            : undefined,
        fhsaCumulativeContributions:
          type === "fhsa" && fhsaContributions
            ? parseFloat(fhsaContributions)
            : undefined,
        createdAt: now,
        updatedAt: now,
      });

      // Create sub-accounts
      for (const sub of pendingSubs) {
        addSubAccount({
          id: uuid(),
          accountId,
          name: sub.name,
          institution: sub.institution || undefined,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    onClose();
    resetForm();
  };

  const handleDelete = () => {
    if (editAccount) {
      deleteAccount(editAccount.id);
      onClose();
    }
  };

  const addPendingSub = () => {
    if (!newSubName.trim()) return;
    setPendingSubs((prev) => [
      ...prev,
      { name: newSubName.trim(), institution: newSubInstitution.trim() },
    ]);
    setNewSubName("");
    setNewSubInstitution("");
    setShowSubForm(false);
  };

  // Contribution room display
  const isTFSA = type === "tfsa";
  const isFHSA = type === "fhsa";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-navy-900/60" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-white rounded shadow-elevated max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between h-[48px] px-4 border-b border-warm-200 bg-warm-50 sticky top-0 z-10">
          <h2 className="text-sm font-sans font-semibold text-warm-800">
            {editAccount ? "Edit Account" : "New Account"}
          </h2>
          <button
            onClick={onClose}
            className="text-warm-400 hover:text-warm-700"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Account type */}
          <div className="flex flex-col gap-[4px]">
            <label className="text-xs font-medium text-warm-600 uppercase tracking-wider">
              Account Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AccountContainerType)}
              className="h-[36px] px-2 text-sm rounded border border-warm-300 bg-white"
            >
              {["Liquid", "Tax-Advantaged", "Investment", "Liabilities"].map(
                (group) => (
                  <optgroup key={group} label={group}>
                    {accountTypes
                      .filter((t) => t.group === group)
                      .map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                  </optgroup>
                ),
              )}
            </select>
          </div>

          {/* Name */}
          <Input
            label="Account Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. TFSA, Chequing, Visa"
          />

          {/* Institution */}
          <Input
            label="Institution"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder="e.g. Questrade, TD, Wealthsimple"
          />

          {/* Currency */}
          <div className="flex flex-col gap-[4px]">
            <label className="text-xs font-medium text-warm-600 uppercase tracking-wider">
              Currency
            </label>
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

          {/* RRSP Deduction Limit */}
          {type === "rrsp" && (
            <Input
              label="RRSP Deduction Limit"
              type="number"
              value={rrspDeductionLimit}
              onChange={(e) => setRrspDeductionLimit(e.target.value)}
              placeholder="From CRA Notice of Assessment"
              monospace
              hint="Enter your deduction limit from your latest NOA"
            />
          )}

          {/* FHSA Contributions */}
          {type === "fhsa" && (
            <Input
              label="FHSA Cumulative Contributions"
              type="number"
              value={fhsaContributions}
              onChange={(e) => setFhsaContributions(e.target.value)}
              placeholder="Total contributed to date"
              monospace
              hint={`Lifetime cap: $40,000. Annual limit: $8,000`}
            />
          )}

          {/* TFSA Contribution Room Display */}
          {isTFSA && (
            <div className="bg-navy-50 rounded p-3">
              <p className="text-xs font-medium text-navy-700 mb-1">
                TFSA Contribution Room Reference
              </p>
              <p className="text-2xs text-warm-600">
                2024 annual limit: $7,000 | Cumulative from 2009: $
                {Object.values(TFSA_ANNUAL_LIMITS)
                  .reduce((a, b) => a + b, 0)
                  .toLocaleString()}
              </p>
            </div>
          )}

          {/* FHSA Room Display */}
          {isFHSA && (
            <div className="bg-navy-50 rounded p-3">
              <p className="text-xs font-medium text-navy-700 mb-1">
                FHSA Contribution Room
              </p>
              <p className="text-2xs text-warm-600">
                Annual limit: $8,000 | Lifetime cap: $40,000
              </p>
            </div>
          )}

          {/* Sub-Accounts */}
          <div className="border-t border-warm-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-warm-600 uppercase tracking-wider">
                Sub-Accounts
              </p>
              <button
                onClick={() => setShowSubForm(true)}
                className="flex items-center gap-1 text-xs text-burnt hover:text-burnt-light"
              >
                <Plus size={12} />
                Add
              </button>
            </div>

            {/* Existing sub-accounts (edit mode) */}
            {editAccount &&
              subAccounts
                .filter((sa) => sa.accountId === editAccount.id)
                .map((sa) => (
                  <div
                    key={sa.id}
                    className="flex items-center justify-between h-[36px] px-3 bg-warm-50 rounded mb-[2px]"
                  >
                    <div>
                      <span className="text-sm text-warm-800">{sa.name}</span>
                      {sa.institution && (
                        <span className="text-2xs text-warm-400 ml-2">
                          {sa.institution}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

            {/* Pending new sub-accounts */}
            {pendingSubs.map((sub, i) => (
              <div
                key={i}
                className="flex items-center justify-between h-[36px] px-3 bg-warm-50 rounded mb-[2px]"
              >
                <div>
                  <span className="text-sm text-warm-800">{sub.name}</span>
                  {sub.institution && (
                    <span className="text-2xs text-warm-400 ml-2">
                      {sub.institution}
                    </span>
                  )}
                </div>
                <button
                  onClick={() =>
                    setPendingSubs((prev) => prev.filter((_, j) => j !== i))
                  }
                  className="text-warm-400 hover:text-danger"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            {/* Add sub-account form */}
            {showSubForm && (
              <div className="flex flex-col gap-2 mt-2 p-3 bg-warm-50 rounded">
                <Input
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="Sub-account name"
                />
                <Input
                  value={newSubInstitution}
                  onChange={(e) => setNewSubInstitution(e.target.value)}
                  placeholder="Institution (optional)"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={addPendingSub}>
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowSubForm(false);
                      setNewSubName("");
                      setNewSubInstitution("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between h-[56px] px-4 border-t border-warm-200 bg-warm-50 sticky bottom-0">
          {editAccount ? (
            <Button size="sm" variant="danger" onClick={handleDelete}>
              <Trash2 size={14} className="mr-1" />
              Delete
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!name.trim()}>
              {editAccount ? "Save Changes" : "Create Account"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
