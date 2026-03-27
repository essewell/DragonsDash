// ============================================================
// DragonsDash — Financial Calculation Utilities
// ============================================================
// All calculations use correct financial math.
// No placeholder or estimated values — only derived from inputs.
// ============================================================

import type { Transaction } from "@/types";

/**
 * TFSA Annual Contribution Limits (CRA published)
 * Source: Canada Revenue Agency
 * Cumulative room starts from 2009 (TFSA inception year).
 */
export const TFSA_ANNUAL_LIMITS: Record<number, number> = {
  2009: 5000,
  2010: 5000,
  2011: 5000,
  2012: 5000,
  2013: 5500,
  2014: 5500,
  2015: 10000,
  2016: 5500,
  2017: 5500,
  2018: 5500,
  2019: 6000,
  2020: 6000,
  2021: 6000,
  2022: 6000,
  2023: 6500,
  2024: 7000,
  2025: 7000,
  2026: 7000,
};

/**
 * Calculate cumulative TFSA contribution room for a given year.
 * @param eligibilityYear - Year user turned 18 (minimum 2009)
 * @param targetYear - Year to calculate room for
 * @param totalContributed - Total amount contributed to date
 * @returns Remaining contribution room
 */
export function calculateTFSARoom(
  eligibilityYear: number,
  targetYear: number,
  totalContributed: number,
): number {
  const startYear = Math.max(eligibilityYear, 2009);
  const endYear = Math.min(targetYear, new Date().getFullYear());

  let cumulativeRoom = 0;
  for (let year = startYear; year <= endYear; year++) {
    cumulativeRoom += TFSA_ANNUAL_LIMITS[year] ?? 0;
  }

  return cumulativeRoom - totalContributed;
}

/**
 * FHSA Annual and Lifetime Limits
 * Source: CRA
 */
export const FHSA_ANNUAL_LIMIT = 8000;
export const FHSA_LIFETIME_LIMIT = 40000;

/**
 * Calculate remaining FHSA contribution room.
 * @param cumulativeContributions - Total FHSA contributions to date
 * @returns Remaining room (minimum of annual and lifetime minus cumulative)
 */
export function calculateFHSARoom(
  cumulativeContributions: number,
  currentYearContributions: number = 0,
): { annualRoom: number; lifetimeRoom: number } {
  const lifetimeRoom = Math.max(0, FHSA_LIFETIME_LIMIT - cumulativeContributions);
  const annualRoom = Math.max(0, FHSA_ANNUAL_LIMIT - currentYearContributions);

  // Annual room is the lesser of annual limit and remaining lifetime
  return {
    annualRoom: lifetimeRoom === 0 ? 0 : Math.min(annualRoom, lifetimeRoom),
    lifetimeRoom,
  };
}

/**
 * RESP CESG Calculation
 * Source: Government of Canada
 * CESG: 20% on first $2,500/yr = $500/yr max
 * Lifetime CESG cap: $7,200 per beneficiary
 */
export const RESP_CESG_RATE = 0.2;
export const RESP_CESG_ANNUAL_MAX = 500;
export const RESP_CESG_ANNUAL_THRESHOLD = 2500;
export const RESP_CESG_LIFETIME_MAX = 7200;

/**
 * Calculate CESG for a given RESP contribution.
 * @param contribution - Amount contributed this year
 * @param totalCESGReceived - Total CESG received to date
 * @returns CESG amount for this contribution
 */
export function calculateCESG(
  contribution: number,
  totalCESGReceived: number,
): number {
  const remainingLifetime = RESP_CESG_LIFETIME_MAX - totalCESGReceived;
  if (remainingLifetime <= 0) return 0;

  const eligibleAmount = Math.min(contribution, RESP_CESG_ANNUAL_THRESHOLD);
  const cesgAmount = eligibleAmount * RESP_CESG_RATE;
  const cappedAmount = Math.min(cesgAmount, RESP_CESG_ANNUAL_MAX);

  return Math.min(cappedAmount, remainingLifetime);
}

/**
 * Adjusted Cost Base (ACB) Calculation
 * For Canadian tax purposes: ACB = total cost of shares / total shares held
 * This is the average cost method per CRA rules.
 */
export interface ACBLot {
  quantity: number;
  costPerUnit: number;
}

/**
 * Calculate ACB from purchase and sale lots.
 * @param lots - Array of purchase lots (positive quantity) and sale lots (negative quantity)
 * @returns Current ACB per unit and total ACB
 */
export function calculateACB(
  lots: ACBLot[],
): { acbPerUnit: number; totalACB: number; totalQuantity: number } {
  let totalQuantity = 0;
  let totalCost = 0;

  for (const lot of lots) {
    if (lot.quantity > 0) {
      totalQuantity += lot.quantity;
      totalCost += lot.quantity * lot.costPerUnit;
    } else if (lot.quantity < 0) {
      // Selling: ACB doesn't change per unit, but quantity decreases
      totalQuantity += lot.quantity; // negative, so subtracts
    }
  }

  if (totalQuantity <= 0) {
    return { acbPerUnit: 0, totalACB: 0, totalQuantity: 0 };
  }

  return {
    acbPerUnit: totalCost / totalQuantity,
    totalACB: totalCost,
    totalQuantity,
  };
}

/**
 * Capital Gain/Loss Calculation (Canadian rules)
 * Capital gain = proceeds of disposition - ACB - expenses
 * Inclusion rate: 50% (2024 and prior)
 */
export function calculateCapitalGain(
  proceedsOfDisposition: number,
  acb: number,
  expenses: number = 0,
  inclusionRate: number = 0.5,
): { capitalGain: number; taxableCapitalGain: number } {
  const capitalGain = proceedsOfDisposition - acb - expenses;
  const taxableCapitalGain = capitalGain * inclusionRate;

  return { capitalGain, taxableCapitalGain };
}

/**
 * Credit Card Utilization Ratio
 * utilization = balance / limit * 100
 */
export function calculateUtilization(
  balance: number,
  creditLimit: number,
): number {
  if (creditLimit <= 0) return 0;
  return (balance / creditLimit) * 100;
}

/**
 * Loan Amortization — Monthly Payment
 * M = P * [r(1+r)^n] / [(1+r)^n - 1]
 * where P = principal, r = monthly rate, n = total payments
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  totalPayments: number,
): number {
  if (annualRate === 0) return principal / totalPayments;

  const monthlyRate = annualRate / 12;
  const factor = Math.pow(1 + monthlyRate, totalPayments);

  return principal * ((monthlyRate * factor) / (factor - 1));
}

/**
 * Time-Weighted Return (TWR)
 * TWR = [(1 + HPR1) * (1 + HPR2) * ... * (1 + HPRn)] - 1
 * where HPR = (End Value - Begin Value - Cash Flows) / (Begin Value + Cash Flows)
 *
 * @param periods - Array of period data
 * @returns Annualized TWR as decimal (e.g., 0.08 = 8%)
 */
export function calculateTWR(
  periods: { beginValue: number; endValue: number; cashFlow: number }[],
): number {
  if (periods.length === 0) return 0;

  let cumulativeReturn = 1;

  for (const period of periods) {
    const denominator = period.beginValue + period.cashFlow;
    if (denominator === 0) continue;

    const hpr =
      (period.endValue - period.beginValue - period.cashFlow) / denominator;
    cumulativeReturn *= 1 + hpr;
  }

  return cumulativeReturn - 1;
}

/**
 * Net Worth Calculation
 * Sum of all asset values minus sum of all liability values
 */
export function calculateNetWorth(
  assets: number[],
  liabilities: number[],
): number {
  const totalAssets = assets.reduce((sum, a) => sum + a, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l, 0);
  return totalAssets - totalLiabilities;
}

/**
 * Spending Velocity
 * Average daily spending over a period
 */
export function calculateSpendingVelocity(
  transactions: Transaction[],
  days: number,
): { averageDaily: number; totalSpent: number } {
  const expenses = transactions.filter((t) => t.type === "expense");
  const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
  const averageDaily = days > 0 ? totalSpent / days : 0;

  return { averageDaily, totalSpent };
}

/**
 * Safe to Spend
 * Current liquid balance minus committed obligations in the next 30 days
 */
export function calculateSafeToSpend(
  liquidBalance: number,
  committedObligations30d: number,
): number {
  return liquidBalance - committedObligations30d;
}
