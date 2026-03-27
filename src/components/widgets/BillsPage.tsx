"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import {
  Plus,
  Calendar,
  Check,
  AlertTriangle,
  Clock,
  X,
  CreditCard,
} from "lucide-react";
import clsx from "clsx";
import { useAppStore } from "@/store";
import { Button, Card, CardHeader, Badge, Input } from "@/components/ui";
import type { RecurringBill, BillStatus } from "@/types";

function getBillStatus(bill: RecurringBill): BillStatus {
  const today = new Date();
  const currentDay = today.getDate();
  const dueDay = bill.dueDayOfMonth;

  if (bill.lastPaidDate) {
    const lastPaid = new Date(bill.lastPaidDate);
    const paidThisMonth =
      lastPaid.getMonth() === today.getMonth() &&
      lastPaid.getFullYear() === today.getFullYear();
    if (paidThisMonth) return "paid";
  }

  const daysUntilDue = dueDay - currentDay;

  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue === 0) return "due_today";
  if (daysUntilDue <= 3) return "due_soon";
  return "upcoming";
}

function getStatusBadge(status: BillStatus) {
  switch (status) {
    case "paid":
      return <Badge variant="positive">Paid</Badge>;
    case "due_today":
      return <Badge variant="warning">Due Today</Badge>;
    case "due_soon":
      return <Badge variant="warning">Due Soon</Badge>;
    case "overdue":
      return <Badge variant="negative">Overdue</Badge>;
    default:
      return <Badge>Upcoming</Badge>;
  }
}

export function BillsPage() {
  const { bills, categories, addBill, updateBill, deleteBill } =
    useAppStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [view, setView] = useState<"list" | "calendar">("list");

  // Form state
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formIsVariable, setFormIsVariable] = useState(false);
  const [formEstimated, setFormEstimated] = useState("");
  const [formDueDay, setFormDueDay] = useState("1");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formRenewalDate, setFormRenewalDate] = useState("");

  const handleAddBill = () => {
    if (!formName.trim() || !formDueDay) return;

    const bill: RecurringBill = {
      id: uuid(),
      name: formName.trim(),
      amount: formIsVariable ? null : parseFloat(formAmount),
      estimatedAmount: formIsVariable && formEstimated
        ? parseFloat(formEstimated)
        : undefined,
      currency: "CAD",
      dueDayOfMonth: parseInt(formDueDay),
      categoryId: formCategoryId || undefined as any,
      isVariable: formIsVariable,
      renewalDate: formRenewalDate || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addBill(bill);
    resetForm();
  };

  const resetForm = () => {
    setFormName("");
    setFormAmount("");
    setFormIsVariable(false);
    setFormEstimated("");
    setFormDueDay("1");
    setFormCategoryId("");
    setFormRenewalDate("");
    setShowAddForm(false);
  };

  // Sort bills by status then due date
  const sortedBills = [...bills].sort((a, b) => {
    const statusOrder: Record<BillStatus, number> = {
      overdue: 0,
      due_today: 1,
      due_soon: 2,
      upcoming: 3,
      paid: 4,
    };
    const statusA = getBillStatus(a);
    const statusB = getBillStatus(b);
    if (statusOrder[statusA] !== statusOrder[statusB]) {
      return statusOrder[statusA] - statusOrder[statusB];
    }
    return a.dueDayOfMonth - b.dueDayOfMonth;
  });

  // Calendar grid data
  const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1);

  // Monthly total
  const monthlyTotal = bills.reduce((sum, bill) => {
    if (bill.isVariable) {
      return sum + (bill.estimatedAmount ?? 0);
    }
    return sum + (bill.amount ?? 0);
  }, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-navy-900">
            Recurring Bills
          </h2>
          <p className="text-sm text-warm-500 mt-1">
            Track monthly obligations and payment schedules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded border border-warm-300 overflow-hidden">
            <button
              onClick={() => setView("list")}
              className={clsx(
                "h-[32px] px-3 text-xs",
                view === "list"
                  ? "bg-navy-900 text-white"
                  : "bg-white text-warm-600 hover:bg-warm-50",
              )}
            >
              List
            </button>
            <button
              onClick={() => setView("calendar")}
              className={clsx(
                "h-[32px] px-3 text-xs",
                view === "calendar"
                  ? "bg-navy-900 text-white"
                  : "bg-white text-warm-600 hover:bg-warm-50",
              )}
            >
              Calendar
            </button>
          </div>
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            <Plus size={14} className="mr-1" />
            Add Bill
          </Button>
        </div>
      </div>

      {/* Monthly Summary */}
      <Card padding="md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-warm-500 uppercase tracking-wider">
              Monthly Obligations
            </p>
            <p className="font-mono text-2xl tabular-nums text-warm-900">
              {bills.length === 0
                ? "—"
                : new Intl.NumberFormat("en-CA", {
                    style: "currency",
                    currency: "CAD",
                  }).format(monthlyTotal)}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-2xs text-warm-500">Overdue</p>
              <p className="font-mono text-sm tabular-nums text-danger">
                {
                  bills.filter((b) => getBillStatus(b) === "overdue")
                    .length
                }
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xs text-warm-500">Due Soon</p>
              <p className="font-mono text-sm tabular-nums text-amber">
                {
                  bills.filter(
                    (b) =>
                      getBillStatus(b) === "due_soon" ||
                      getBillStatus(b) === "due_today",
                  ).length
                }
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xs text-warm-500">Paid</p>
              <p className="font-mono text-sm tabular-nums text-forest">
                {
                  bills.filter((b) => getBillStatus(b) === "paid").length
                }
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Add Form */}
      {showAddForm && (
        <Card padding="lg">
          <div className="flex flex-col gap-3">
            <Input
              label="Bill Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Hydro, Internet, Rent"
            />

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formIsVariable}
                  onChange={(e) => setFormIsVariable(e.target.checked)}
                  className="rounded border-warm-300"
                />
                <span className="text-xs text-warm-600">Variable amount</span>
              </label>
            </div>

            {!formIsVariable ? (
              <Input
                label="Amount"
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0.00"
                monospace
              />
            ) : (
              <Input
                label="Estimated Amount"
                type="number"
                value={formEstimated}
                onChange={(e) => setFormEstimated(e.target.value)}
                placeholder="0.00"
                monospace
                hint="Average expected amount"
              />
            )}

            <Input
              label="Due Day of Month"
              type="number"
              value={formDueDay}
              onChange={(e) => setFormDueDay(e.target.value)}
              min={1}
              max={31}
              monospace
            />

            <div className="flex flex-col gap-[4px]">
              <label className="text-xs font-medium text-warm-600 uppercase tracking-wider">
                Category
              </label>
              <select
                value={formCategoryId}
                onChange={(e) => setFormCategoryId(e.target.value)}
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
              label="Renewal Date (optional)"
              type="date"
              value={formRenewalDate}
              onChange={(e) => setFormRenewalDate(e.target.value)}
              hint="For annual subscriptions"
            />

            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddBill}>
                Add Bill
              </Button>
              <Button size="sm" variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="flex flex-col gap-[2px]">
          {sortedBills.length === 0 ? (
            <Card padding="lg">
              <div className="text-center py-8">
                <p className="text-sm text-warm-500">No recurring bills</p>
                <p className="text-xs text-warm-400 mt-1">
                  Add bills to track upcoming payments
                </p>
              </div>
            </Card>
          ) : (
            sortedBills.map((bill) => {
              const status = getBillStatus(bill);
              return (
                <Card key={bill.id} padding="none">
                  <div
                    className={clsx(
                      "flex items-center justify-between h-[48px] px-3",
                      status === "overdue" && "bg-red-50/50",
                      status === "due_today" && "bg-amber-50/50",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={clsx(
                          "w-[6px] h-[6px] rounded-full",
                          status === "paid" && "bg-forest",
                          status === "overdue" && "bg-danger",
                          (status === "due_soon" || status === "due_today") &&
                            "bg-amber",
                          status === "upcoming" && "bg-warm-300",
                        )}
                      />
                      <div>
                        <p className="text-sm font-medium text-warm-800">
                          {bill.name}
                        </p>
                        <p className="text-2xs text-warm-400">
                          Due day {bill.dueDayOfMonth} of month
                          {bill.isVariable && " (variable)"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm tabular-nums text-warm-800">
                        {bill.isVariable
                          ? bill.estimatedAmount
                            ? `~${new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(bill.estimatedAmount)}`
                            : "—"
                          : bill.amount
                            ? new Intl.NumberFormat("en-CA", {
                                style: "currency",
                                currency: "CAD",
                              }).format(bill.amount)
                            : "—"}
                      </span>
                      {getStatusBadge(status)}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Calendar View */}
      {view === "calendar" && (
        <Card padding="lg">
          <div className="grid grid-cols-7 gap-[2px]">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div
                key={i}
                className="text-center text-2xs text-warm-400 font-medium py-1"
              >
                {d}
              </div>
            ))}
            {calendarDays.map((day) => {
              const dueBills = bills.filter(
                (b) => b.dueDayOfMonth === day,
              );
              const today = new Date().getDate();
              const isToday = day === today;

              return (
                <div
                  key={day}
                  className={clsx(
                    "min-h-[48px] p-1 rounded border",
                    isToday
                      ? "border-navy-300 bg-navy-50"
                      : "border-warm-100",
                  )}
                >
                  <span
                    className={clsx(
                      "text-2xs font-medium",
                      isToday ? "text-navy-700" : "text-warm-400",
                    )}
                  >
                    {day}
                  </span>
                  {dueBills.map((bill) => {
                    const status = getBillStatus(bill);
                    return (
                      <div
                        key={bill.id}
                        className={clsx(
                          "mt-[2px] px-[3px] py-[1px] rounded text-2xs truncate",
                          status === "paid" && "bg-green-50 text-forest",
                          status === "overdue" && "bg-red-50 text-danger",
                          (status === "due_soon" || status === "due_today") &&
                            "bg-amber-50 text-amber-dark",
                          status === "upcoming" && "bg-warm-50 text-warm-600",
                        )}
                      >
                        {bill.name}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
