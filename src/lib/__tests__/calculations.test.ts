import { describe, it, expect } from "vitest";
import {
  calculateTFSARoom,
  TFSA_ANNUAL_LIMITS,
  calculateFHSARoom,
  FHSA_ANNUAL_LIMIT,
  FHSA_LIFETIME_LIMIT,
  calculateCESG,
  RESP_CESG_ANNUAL_MAX,
  calculateACB,
  calculateCapitalGain,
  calculateUtilization,
  calculateMonthlyPayment,
  calculateTWR,
  calculateNetWorth,
  calculateSpendingVelocity,
  calculateSafeToSpend,
} from "../calculations";

describe("TFSA Contribution Room", () => {
  it("should calculate cumulative room from 2009 to 2024", () => {
    // CRA published limits 2009-2024 sum
    const expectedTotal =
      5000 + 5000 + 5000 + 5000 + 5500 + 5500 + 10000 + 5500 + 5500 + 5500 +
      6000 + 6000 + 6000 + 6000 + 6500 + 7000;
    const room = calculateTFSARoom(2009, 2024, 0);
    expect(room).toBe(expectedTotal); // $95,000
  });

  it("should subtract contributions from room", () => {
    const room = calculateTFSARoom(2009, 2024, 50000);
    expect(room).toBe(45000);
  });

  it("should handle eligibility year after 2009", () => {
    const room = calculateTFSARoom(2018, 2024, 0);
    // 2018: 5500, 2019: 6000, 2020: 6000, 2021: 6000, 2022: 6000, 2023: 6500, 2024: 7000
    const expected = 5500 + 6000 + 6000 + 6000 + 6000 + 6500 + 7000;
    expect(room).toBe(expected);
  });

  it("should return 0 for future years beyond current", () => {
    const room = calculateTFSARoom(2009, 2099, 0);
    const currentYear = new Date().getFullYear();
    let expected = 0;
    for (let y = 2009; y <= currentYear; y++) {
      expected += TFSA_ANNUAL_LIMITS[y] ?? 0;
    }
    expect(room).toBe(expected);
  });
});

describe("FHSA Contribution Room", () => {
  it("should calculate annual and lifetime room", () => {
    const result = calculateFHSARoom(0, 0);
    expect(result.annualRoom).toBe(FHSA_ANNUAL_LIMIT);
    expect(result.lifetimeRoom).toBe(FHSA_LIFETIME_LIMIT);
  });

  it("should reduce annual room by current year contributions", () => {
    const result = calculateFHSARoom(20000, 5000);
    expect(result.annualRoom).toBe(3000);
    expect(result.lifetimeRoom).toBe(20000);
  });

  it("should return 0 when lifetime cap reached", () => {
    const result = calculateFHSARoom(40000, 0);
    expect(result.annualRoom).toBe(0);
    expect(result.lifetimeRoom).toBe(0);
  });
});

describe("RESP CESG Calculation", () => {
  it("should calculate 20% CESG on first $2,500", () => {
    const cesg = calculateCESG(2500, 0);
    expect(cesg).toBe(500);
  });

  it("should cap annual CESG at $500", () => {
    const cesg = calculateCESG(5000, 0);
    expect(cesg).toBe(500);
  });

  it("should respect lifetime $7,200 cap", () => {
    const cesg = calculateCESG(2500, 7000);
    expect(cesg).toBe(200); // only $200 remaining of $7,200 lifetime
  });

  it("should return 0 when lifetime cap reached", () => {
    const cesg = calculateCESG(2500, 7200);
    expect(cesg).toBe(0);
  });
});

describe("Adjusted Cost Base (ACB)", () => {
  it("should calculate ACB from purchase lots", () => {
    const result = calculateACB([
      { quantity: 100, costPerUnit: 10 },
      { quantity: 100, costPerUnit: 12 },
    ]);
    expect(result.totalQuantity).toBe(200);
    expect(result.totalACB).toBe(2200);
    expect(result.acbPerUnit).toBe(11);
  });

  it("should reduce quantity on sale without changing ACB per unit", () => {
    const result = calculateACB([
      { quantity: 100, costPerUnit: 10 },
      { quantity: 100, costPerUnit: 12 },
      { quantity: -50, costPerUnit: 15 },
    ]);
    expect(result.totalQuantity).toBe(150);
    expect(result.acbPerUnit).toBeCloseTo(14.6667, 3); // 2200 / 150
  });

  it("should return zeros when all shares sold", () => {
    const result = calculateACB([
      { quantity: 100, costPerUnit: 10 },
      { quantity: -100, costPerUnit: 12 },
    ]);
    expect(result.totalQuantity).toBe(0);
    expect(result.totalACB).toBe(0);
    expect(result.acbPerUnit).toBe(0);
  });
});

describe("Capital Gain/Loss", () => {
  it("should calculate taxable capital gain at 50% inclusion", () => {
    const result = calculateCapitalGain(15000, 10000, 0, 0.5);
    expect(result.capitalGain).toBe(5000);
    expect(result.taxableCapitalGain).toBe(2500);
  });

  it("should calculate capital loss", () => {
    const result = calculateCapitalGain(8000, 10000, 0, 0.5);
    expect(result.capitalGain).toBe(-2000);
    expect(result.taxableCapitalGain).toBe(-1000);
  });

  it("should deduct selling expenses", () => {
    const result = calculateCapitalGain(15000, 10000, 200, 0.5);
    expect(result.capitalGain).toBe(4800);
    expect(result.taxableCapitalGain).toBe(2400);
  });
});

describe("Credit Card Utilization", () => {
  it("should calculate utilization percentage", () => {
    expect(calculateUtilization(3000, 10000)).toBe(30);
  });

  it("should return 0 for zero limit", () => {
    expect(calculateUtilization(1000, 0)).toBe(0);
  });

  it("should handle 100% utilization", () => {
    expect(calculateUtilization(5000, 5000)).toBe(100);
  });
});

describe("Loan Monthly Payment", () => {
  it("should calculate monthly mortgage payment", () => {
    // $400,000 mortgage at 5% over 25 years (300 payments)
    const payment = calculateMonthlyPayment(400000, 0.05, 300);
    expect(payment).toBeCloseTo(2338.36, 1);
  });

  it("should handle 0% interest (e.g. 0% financing)", () => {
    const payment = calculateMonthlyPayment(12000, 0, 12);
    expect(payment).toBe(1000);
  });
});

describe("Time-Weighted Return (TWR)", () => {
  it("should calculate TWR across multiple periods", () => {
    const twr = calculateTWR([
      { beginValue: 10000, endValue: 10800, cashFlow: 0 },
      { beginValue: 10800, endValue: 11500, cashFlow: 2000 },
      { beginValue: 13500, endValue: 14000, cashFlow: 0 },
    ]);
    // HPR1 = 800/10000 = 0.08
    // HPR2 = (11500-10800-2000)/(10800+2000) = -1300/12800 = -0.1015625
    // HPR3 = 500/13500 = 0.037037
    // Cumulative = 1.08 * 0.8984375 * 1.037037 - 1 = 0.00625
    expect(twr).toBeCloseTo(0.00625, 4);
  });

  it("should return 0 for empty periods", () => {
    expect(calculateTWR([])).toBe(0);
  });
});

describe("Net Worth", () => {
  it("should calculate net worth from assets and liabilities", () => {
    expect(calculateNetWorth([50000, 30000, 10000], [200000, 5000])).toBe(
      -115000,
    );
  });

  it("should handle all zeros", () => {
    expect(calculateNetWorth([], [])).toBe(0);
  });
});

describe("Spending Velocity", () => {
  it("should calculate average daily spending", () => {
    const transactions = [
      { type: "expense", amount: 100 } as any,
      { type: "expense", amount: 200 } as any,
      { type: "income", amount: 5000 } as any,
    ];
    const result = calculateSpendingVelocity(transactions, 30);
    expect(result.totalSpent).toBe(300);
    expect(result.averageDaily).toBe(10);
  });
});

describe("Safe to Spend", () => {
  it("should subtract committed obligations from balance", () => {
    expect(calculateSafeToSpend(5000, 2000)).toBe(3000);
  });

  it("should allow negative safe-to-spend", () => {
    expect(calculateSafeToSpend(1000, 3000)).toBe(-2000);
  });
});
