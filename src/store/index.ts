"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Account,
  SubAccount,
  Transaction,
  Category,
  Holding,
  RecurringBill,
  WatchlistItem,
  UserPreferences,
  AuthState,
} from "@/types";

// ============================================================
// Application Store
// ============================================================
// Data persists to localStorage. In production, this is wrapped
// with an encryption middleware that AES-256-GCM encrypts before
// writing and decrypts on read. For initial build, we use the
// standard persist middleware.
// ============================================================

interface AppState {
  // --- Auth ---
  auth: AuthState;
  setAuth: (auth: Partial<AuthState>) => void;
  lock: () => void;
  unlock: () => void;
  incrementFailedAttempts: () => void;
  resetFailedAttempts: () => void;

  // --- Accounts ---
  accounts: Account[];
  addAccount: (account: Account) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  // --- Sub-Accounts ---
  subAccounts: SubAccount[];
  addSubAccount: (subAccount: SubAccount) => void;
  updateSubAccount: (id: string, updates: Partial<SubAccount>) => void;
  deleteSubAccount: (id: string) => void;
  getSubAccountsByAccount: (accountId: string) => SubAccount[];

  // --- Transactions ---
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getTransactionsBySubAccount: (subAccountId: string) => Transaction[];
  getRecentTransactions: (limit?: number) => Transaction[];

  // --- Categories ---
  categories: Category[];
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // --- Holdings ---
  holdings: Holding[];
  addHolding: (holding: Holding) => void;
  updateHolding: (id: string, updates: Partial<Holding>) => void;
  deleteHolding: (id: string) => void;
  getHoldingsBySubAccount: (subAccountId: string) => Holding[];

  // --- Recurring Bills ---
  bills: RecurringBill[];
  addBill: (bill: RecurringBill) => void;
  updateBill: (id: string, updates: Partial<RecurringBill>) => void;
  deleteBill: (id: string) => void;

  // --- Watchlist ---
  watchlist: WatchlistItem[];
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (id: string) => void;
  reorderWatchlist: (items: WatchlistItem[]) => void;

  // --- Preferences ---
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;

  // --- Computed ---
  getNetWorth: () => number;
  getAccountBalance: (accountId: string) => number;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // --- Auth ---
      auth: {
        isAuthenticated: false,
        authMethod: null,
        lockedAt: null,
        failedAttempts: 0,
      },
      setAuth: (updates) =>
        set((state) => ({ auth: { ...state.auth, ...updates } })),
      lock: () =>
        set((state) => ({
          auth: {
            ...state.auth,
            isAuthenticated: false,
            lockedAt: new Date().toISOString(),
          },
        })),
      unlock: () =>
        set((state) => ({
          auth: {
            ...state.auth,
            isAuthenticated: true,
            lockedAt: null,
            failedAttempts: 0,
          },
        })),
      incrementFailedAttempts: () =>
        set((state) => {
          const newCount = state.auth.failedAttempts + 1;
          if (newCount >= 10) {
            // 10 failed attempts triggers full data wipe
            return {
              auth: {
                isAuthenticated: false,
                authMethod: null,
                lockedAt: new Date().toISOString(),
                failedAttempts: 0,
              },
              accounts: [],
              subAccounts: [],
              transactions: [],
              categories: [],
              holdings: [],
              bills: [],
              watchlist: [],
            };
          }
          return { auth: { ...state.auth, failedAttempts: newCount } };
        }),
      resetFailedAttempts: () =>
        set((state) => ({
          auth: { ...state.auth, failedAttempts: 0 },
        })),

      // --- Accounts ---
      accounts: [],
      addAccount: (account) =>
        set((state) => ({ accounts: [...state.accounts, account] })),
      updateAccount: (id, updates) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a,
          ),
        })),
      deleteAccount: (id) =>
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
          subAccounts: state.subAccounts.filter((sa) => sa.accountId !== id),
        })),

      // --- Sub-Accounts ---
      subAccounts: [],
      addSubAccount: (subAccount) =>
        set((state) => ({ subAccounts: [...state.subAccounts, subAccount] })),
      updateSubAccount: (id, updates) =>
        set((state) => ({
          subAccounts: state.subAccounts.map((sa) =>
            sa.id === id ? { ...sa, ...updates, updatedAt: new Date().toISOString() } : sa,
          ),
        })),
      deleteSubAccount: (id) =>
        set((state) => ({
          subAccounts: state.subAccounts.filter((sa) => sa.id !== id),
          transactions: state.transactions.filter((t) => t.subAccountId !== id),
          holdings: state.holdings.filter((h) => h.subAccountId !== id),
        })),
      getSubAccountsByAccount: (accountId) =>
        get().subAccounts.filter((sa) => sa.accountId === accountId),

      // --- Transactions ---
      transactions: [],
      addTransaction: (transaction) =>
        set((state) => ({ transactions: [...state.transactions, transaction] })),
      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t,
          ),
        })),
      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),
      getTransactionsBySubAccount: (subAccountId) =>
        get()
          .transactions.filter((t) => t.subAccountId === subAccountId)
          .sort((a, b) => b.date.localeCompare(a.date)),
      getRecentTransactions: (limit = 10) =>
        [...get().transactions]
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, limit),

      // --- Categories ---
      categories: [],
      addCategory: (category) =>
        set((state) => ({ categories: [...state.categories, category] })),
      updateCategory: (id, updates) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c,
          ),
        })),
      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        })),

      // --- Holdings ---
      holdings: [],
      addHolding: (holding) =>
        set((state) => ({ holdings: [...state.holdings, holding] })),
      updateHolding: (id, updates) =>
        set((state) => ({
          holdings: state.holdings.map((h) =>
            h.id === id ? { ...h, ...updates, updatedAt: new Date().toISOString() } : h,
          ),
        })),
      deleteHolding: (id) =>
        set((state) => ({
          holdings: state.holdings.filter((h) => h.id !== id),
        })),
      getHoldingsBySubAccount: (subAccountId) =>
        get().holdings.filter((h) => h.subAccountId === subAccountId),

      // --- Recurring Bills ---
      bills: [],
      addBill: (bill) =>
        set((state) => ({ bills: [...state.bills, bill] })),
      updateBill: (id, updates) =>
        set((state) => ({
          bills: state.bills.map((b) =>
            b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b,
          ),
        })),
      deleteBill: (id) =>
        set((state) => ({ bills: state.bills.filter((b) => b.id !== id) })),

      // --- Watchlist ---
      watchlist: [],
      addToWatchlist: (item) =>
        set((state) => ({ watchlist: [...state.watchlist, item] })),
      removeFromWatchlist: (id) =>
        set((state) => ({
          watchlist: state.watchlist.filter((w) => w.id !== id),
        })),
      reorderWatchlist: (items) => set({ watchlist: items }),

      // --- Preferences ---
      preferences: {
        defaultCurrency: "CAD",
        dateFormat: "YYYY-MM-DD",
        theme: "light",
        autoLockMinutes: 2,
        screenshotPrevention: false,
      },
      updatePreferences: (updates) =>
        set((state) => ({
          preferences: { ...state.preferences, ...updates },
        })),

      // --- Computed ---
      getNetWorth: () => {
        const state = get();
        let assets = 0;
        let liabilities = 0;

        for (const account of state.accounts) {
          const balance = state.getAccountBalance(account.id);
          if (
            account.type === "credit_card" ||
            account.type === "loan"
          ) {
            liabilities += balance;
          } else {
            assets += balance;
          }
        }

        return assets - liabilities;
      },
      getAccountBalance: (accountId) => {
        const state = get();
        const subs = state.subAccounts.filter(
          (sa) => sa.accountId === accountId,
        );

        let balance = 0;
        for (const sub of subs) {
          const txns = state.transactions.filter(
            (t) => t.subAccountId === sub.id,
          );
          for (const txn of txns) {
            if (txn.type === "income") balance += txn.amount;
            else if (txn.type === "expense") balance -= txn.amount;
            else if (txn.type === "investment_buy") balance -= txn.amount;
            else if (txn.type === "investment_sell") balance += txn.amount;
            // transfers: handled by linked pair
          }
        }

        return balance;
      },
    }),
    {
      name: "dragons-dash-store",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      partialize: (state) => ({
        auth: state.auth,
        accounts: state.accounts,
        subAccounts: state.subAccounts,
        transactions: state.transactions,
        categories: state.categories,
        holdings: state.holdings,
        bills: state.bills,
        watchlist: state.watchlist,
        preferences: state.preferences,
      }),
    },
  ),
);
