// ============================================================
// DragonsDash — Core Data Types
// ============================================================
// All financial values are raw numbers in the smallest currency unit
// or decimal as entered. Formatting is presentation-layer only.
// ============================================================

// --- Currency & Locale ---

export type Currency = "CAD" | "USD" | "EUR" | "GBP" | "BTC" | "ETH";

// --- Account Architecture ---

export type AccountContainerType =
  | "chequing"
  | "savings"
  | "hisa"
  | "cash"
  | "tfsa"
  | "rrsp"
  | "fhsa"
  | "resp"
  | "nonregistered"
  | "crypto"
  | "credit_card"
  | "loan"
  | "recurring";

export interface Account {
  id: string;
  name: string;
  type: AccountContainerType;
  currency: Currency;
  institution?: string;
  createdAt: string; // ISO 8601
  updatedAt: string;
  // For RRSP: deduction limit from CRA NOA
  rrspDeductionLimit?: number;
  // For FHSA: lifetime cap tracking
  fhsaCumulativeContributions?: number;
}

export interface SubAccount {
  id: string;
  accountId: string;
  name: string;
  institution?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Holdings & Securities ---

export type AssetType = "stock" | "etf" | "bond" | "crypto" | "cash";

export interface Holding {
  id: string;
  subAccountId: string;
  assetType: AssetType;
  symbol: string;
  name: string;
  quantity: number;
  costBasisPerUnit: number; // in account currency
  totalCostBasis: number; // quantity * costBasisPerUnit (or ACB for crypto lots)
  purchaseDate: string;
  currency: Currency;
  // Crypto-specific
  storageType?: "hot" | "cold" | "hardware";
  publicAddress?: string;
}

// --- Transactions ---

export type TransactionType =
  | "income"
  | "expense"
  | "transfer"
  | "investment_buy"
  | "investment_sell";

export interface Transaction {
  id: string;
  subAccountId: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  merchant: string;
  categoryId: string;
  date: string; // ISO 8601
  memo?: string;
  tags: string[];
  receiptUrl?: string; // local blob ref or encrypted URL
  // For transfers: linked transaction id (zero-sum double-entry)
  linkedTransactionId?: string;
  // For splits
  isSplit: boolean;
  splitParentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SplitTransaction {
  parentTransactionId: string;
  splits: {
    categoryId: string;
    amount: number;
    memo?: string;
  }[];
}

// --- Categories ---

export interface Category {
  id: string;
  name: string;
  parentId: string | null; // null = top-level
  icon?: string;
  color?: string;
  isSystem: boolean; // system categories cannot be deleted
  budgetMonthly?: number; // user-set monthly budget
  createdAt: string;
  updatedAt: string;
}

// --- Recurring Bills ---

export type BillStatus = "paid" | "due_soon" | "due_today" | "overdue" | "upcoming";

export interface RecurringBill {
  id: string;
  name: string;
  amount: number | null; // null = variable
  estimatedAmount?: number; // for variable bills
  currency: Currency;
  dueDayOfMonth: number;
  paymentAccountId?: string;
  categoryId: string;
  isVariable: boolean;
  lastPaidDate?: string;
  lastPaidAmount?: number;
  renewalDate?: string; // for annual subscriptions
  cardOnFile?: string; // last 4 digits only
  createdAt: string;
  updatedAt: string;
}

// --- Market Data ---

export type DataRecency = "realtime" | "delayed_15min" | "delayed_20min" | "last_known";

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  recency: DataRecency;
  fetchedAt: string; // ISO 8601
}

export interface CryptoQuote {
  id: string;
  symbol: string;
  name: string;
  priceCAD: number;
  change24h: number;
  changePercent24h: number;
  fetchedAt: string;
}

export interface EconomicIndicator {
  id: string;
  name: string;
  value: number;
  unit: string; // "%", "bps", "index"
  source: string;
  sourceUrl?: string;
  lastUpdated: string;
  nextDecisionDate?: string; // for rate decisions
  trend90d: number[]; // sparkline data
}

// --- Watchlist ---

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  sortOrder: number;
  addedAt: string;
}

// --- Budget ---

export interface BudgetCategory {
  categoryId: string;
  budgetAmount: number;
  spent: number; // computed
  remaining: number; // computed
  percentUsed: number; // computed
}

// --- User Preferences ---

export interface UserPreferences {
  defaultCurrency: Currency;
  dateFormat: "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY";
  theme: "light" | "dark" | "auto";
  autoLockMinutes: number;
  screenshotPrevention: boolean;
}

// --- Auth ---

export interface AuthState {
  isAuthenticated: boolean;
  authMethod: "webauthn" | "pin" | null;
  lockedAt: string | null;
  failedAttempts: number;
}

// --- Encryption ---

export interface EncryptedBlob {
  ciphertext: string; // base64
  nonce: string; // base64
  salt?: string; // base64, for key derivation
}

// --- Aggregate Computed Types ---

export interface AccountSummary {
  account: Account;
  subAccounts: SubAccount[];
  totalBalance: number;
  holdings: Holding[];
  recentTransactions: Transaction[];
}

export interface NetWorthSnapshot {
  date: string;
  assets: number;
  liabilities: number;
  netWorth: number;
}

export interface SpendingVelocity {
  period: 30 | 90 | 365;
  averageDaily: number;
  totalSpent: number;
  anomalyPercent?: number; // deviation from prior period
}

export interface CashFlowForecast {
  date: string;
  projectedBalance: number;
  safeToSpend: number;
  committedObligations: number;
}
