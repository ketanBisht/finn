/**
 * store/useFinanceStore.ts
 * ─────────────────────────
 * Zustand store backed by expo-sqlite.
 *
 * Architecture:
 *  • SQLite is the source of truth.
 *  • Zustand is the reactive in-memory cache.
 *  • Every write action writes to SQLite first, then updates Zustand.
 *  • On app boot, `hydrateFromDb()` loads everything from SQLite into Zustand.
 */

import { create } from "zustand";
import type { SQLiteDatabase } from "expo-sqlite";
import { Account, Category, Transaction, Budget, Debt, DebtStatus, Subscription, SubscriptionStatus } from "@/types";
import {
  hydrateAll,
  HydratedState,
  restoreDatabaseSnapshot,
  insertAccount,
  updateAccountDb,
  deleteAccountDb,
  insertTransaction,
  deleteTransactionDb,
  updateTransactionDb,
  updateAccountBalance,
  upsertBudget,
  deleteBudgetDb,
  upsertMonthlyCeiling,
  insertPlatform,
  deletePlatformDb,
  insertDebt,
  updateDebtDb,
  deleteDebtDb,
  insertSubscription,
  updateSubscriptionDb,
  deleteSubscriptionDb,
} from "@/lib/db";
import { computeNextBillingDate } from "@/lib/utils";

// ───────────────────────────── Store Interface ─────────────────────────────

interface FinanceStoreState {
  // State
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  customPlatforms: string[];
  overallMonthlyBudgets: Record<string, number>; // key: `${year}-${month}`, value: limit_amount_paise
  debts: Debt[];
  isHydrated: boolean;

  // Internal: keeps a reference to the db instance for write operations
  _db: SQLiteDatabase | null;

  // Boot
  hydrateFromDb: (db: SQLiteDatabase) => Promise<void>;

  // Actions
  addTransaction: (
    tx: Omit<Transaction, "id" | "created_at" | "updated_at">
  ) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addAccount: (
    acc: Omit<
      Account,
      "id" | "created_at" | "updated_at" | "current_balance_paise"
    >
  ) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  setBudget: (budget: Omit<Budget, "id" | "created_at" | "updated_at">) => void;
  deleteBudget: (id: string) => void;
  addPlatform: (name: string) => void;
  deletePlatform: (name: string) => void;
  setOverallMonthlyBudget: (
    month: number,
    year: number,
    limit_paise: number
  ) => void;
  // Debts
  addDebt: (debt: Omit<Debt, "id" | "created_at" | "updated_at">) => void;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  settleDebt: (id: string, settlePaise: number) => void;
  deleteDebt: (id: string) => void;
  // Subscriptions
  subscriptions: Subscription[];
  addSubscription: (sub: Omit<Subscription, "id" | "created_at" | "updated_at" | "next_billing_date">) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  toggleSubscriptionStatus: (id: string, status: SubscriptionStatus) => void;
  // Restore
  restoreFromBackup: (data: HydratedState) => Promise<void>;
}

// ───────────────────────────── Store ─────────────────────────────

export const useFinanceStore = create<FinanceStoreState>((set, get) => ({
  accounts: [],
  categories: [],
  transactions: [],
  budgets: [],
  customPlatforms: [],
  overallMonthlyBudgets: {},
  debts: [],
  subscriptions: [],
  isHydrated: false,
  _db: null,

  // ───── Hydrate from SQLite on app boot ─────
  hydrateFromDb: async (db: SQLiteDatabase) => {
    const state = await hydrateAll(db);
    set({
      ...state,
      isHydrated: true,
      _db: db,
    });
  },

  // ───── Add Transaction ─────
  addTransaction: (newTxData) => {
    const state = get();
    const db = state._db;
    const newId = `tx-${Date.now()}`;
    const now = new Date().toISOString();
    const account = state.accounts.find((a) => a.id === newTxData.account_id);
    const destinationAccount = newTxData.destination_account_id
      ? state.accounts.find((a) => a.id === newTxData.destination_account_id)
      : undefined;
    const category = newTxData.category_id
      ? state.categories.find((c) => c.id === newTxData.category_id)
      : undefined;

    const newTx: Transaction = {
      ...newTxData,
      id: newId,
      created_at: now,
      updated_at: now,
      account,
      destination_account: destinationAccount,
      category,
    };

    // Recalculate account balances
    const updatedAccounts = state.accounts.map((acc) => {
      if (acc.id === newTx.account_id) {
        if (newTx.type === "income") {
          return {
            ...acc,
            current_balance_paise:
              acc.current_balance_paise + newTx.amount_paise,
          };
        } else {
          return {
            ...acc,
            current_balance_paise:
              acc.current_balance_paise - newTx.amount_paise,
          };
        }
      }
      if (
        newTx.type === "transfer" &&
        acc.id === newTx.destination_account_id
      ) {
        return {
          ...acc,
          current_balance_paise:
            acc.current_balance_paise + newTx.amount_paise,
        };
      }
      return acc;
    });

    set({
      transactions: [newTx, ...state.transactions],
      accounts: updatedAccounts,
    });

    // Persist to SQLite (fire-and-forget, errors logged)
    if (db) {
      (async () => {
        try {
          await insertTransaction(db, newTx);
          // Update account balances in DB
          for (const acc of updatedAccounts) {
            const original = state.accounts.find((a) => a.id === acc.id);
            if (
              original &&
              original.current_balance_paise !== acc.current_balance_paise
            ) {
              await updateAccountBalance(
                db,
                acc.id,
                acc.current_balance_paise
              );
            }
          }
        } catch (e) {
          console.error("[DB] Failed to insert transaction:", e);
        }
      })();
    }
  },

  // ───── Update Transaction ─────
  updateTransaction: (id: string, updates: Partial<Transaction>) => {
    const state = get();
    const db = state._db;
    const tx = state.transactions.find((t) => t.id === id);
    if (!tx) return;

    let updatedAccounts = [...state.accounts];

    // If amount changed, adjust account balance
    if (updates.amount_paise !== undefined && updates.amount_paise !== tx.amount_paise) {
      const diff = updates.amount_paise - tx.amount_paise;
      updatedAccounts = updatedAccounts.map((acc) => {
        if (acc.id === tx.account_id) {
          if (tx.type === "income") {
            return { ...acc, current_balance_paise: acc.current_balance_paise + diff };
          } else if (tx.type === "expense") {
            return { ...acc, current_balance_paise: acc.current_balance_paise - diff };
          }
        }
        return acc;
      });
    }

    const now = new Date().toISOString();
    set({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, ...updates, updated_at: now } : t
      ),
      accounts: updatedAccounts,
    });

    if (db) {
      updateTransactionDb(db, id, updates).catch((e) =>
        console.error("[DB] Failed to update transaction:", e)
      );
      for (const acc of updatedAccounts) {
        const original = state.accounts.find((a) => a.id === acc.id);
        if (original && original.current_balance_paise !== acc.current_balance_paise) {
          updateAccountBalance(db, acc.id, acc.current_balance_paise).catch((e) =>
            console.error("[DB] Failed to update balance:", e)
          );
        }
      }
    }
  },

  // ───── Delete Transaction ─────
  deleteTransaction: (id: string) => {
    const state = get();
    const db = state._db;
    const tx = state.transactions.find((t) => t.id === id);
    if (!tx) return;

    // Revert balances
    const updatedAccounts = state.accounts.map((acc) => {
      if (acc.id === tx.account_id) {
        if (tx.type === "income") {
          return {
            ...acc,
            current_balance_paise:
              acc.current_balance_paise - tx.amount_paise,
          };
        } else {
          return {
            ...acc,
            current_balance_paise:
              acc.current_balance_paise + tx.amount_paise,
          };
        }
      }
      if (tx.type === "transfer" && acc.id === tx.destination_account_id) {
        return {
          ...acc,
          current_balance_paise:
            acc.current_balance_paise - tx.amount_paise,
        };
      }
      return acc;
    });

    set({
      transactions: state.transactions.filter((t) => t.id !== id),
      accounts: updatedAccounts,
    });

    if (db) {
      (async () => {
        try {
          await deleteTransactionDb(db, id);
          for (const acc of updatedAccounts) {
            const original = state.accounts.find((a) => a.id === acc.id);
            if (
              original &&
              original.current_balance_paise !== acc.current_balance_paise
            ) {
              await updateAccountBalance(
                db,
                acc.id,
                acc.current_balance_paise
              );
            }
          }
        } catch (e) {
          console.error("[DB] Failed to delete transaction:", e);
        }
      })();
    }
  },

  // ───── Add Account ─────
  addAccount: (accData) => {
    const state = get();
    const db = state._db;
    const newAcc: Account = {
      ...accData,
      id: `acc-${Date.now()}`,
      current_balance_paise: accData.opening_balance_paise,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set({ accounts: [...state.accounts, newAcc] });

    if (db) {
      insertAccount(db, newAcc).catch((e) =>
        console.error("[DB] Failed to insert account:", e)
      );
    }
  },

  // ───── Update Account ─────
  updateAccount: (id, updates) => {
    const state = get();
    const db = state._db;

    set({
      accounts: state.accounts.map((acc) =>
        acc.id === id
          ? { ...acc, ...updates, updated_at: new Date().toISOString() }
          : acc
      ),
    });

    if (db) {
      updateAccountDb(db, id, updates).catch((e) =>
        console.error("[DB] Failed to update account:", e)
      );
    }
  },

  // ───── Delete Account ─────
  deleteAccount: (id) => {
    const state = get();
    const db = state._db;

    set({
      accounts: state.accounts.filter((acc) => acc.id !== id),
      transactions: state.transactions.filter((tx) => tx.account_id !== id),
    });

    if (db) {
      deleteAccountDb(db, id).catch((e) =>
        console.error("[DB] Failed to delete account:", e)
      );
    }
  },

  // ───── Set Budget (Upsert) ─────
  setBudget: (budgetData) => {
    const state = get();
    const db = state._db;
    const now = new Date().toISOString();
    const category = state.categories.find(
      (c) => c.id === budgetData.category_id
    );

    const existingIdx = state.budgets.findIndex(
      (b) =>
        b.category_id === budgetData.category_id &&
        b.month === budgetData.month &&
        b.year === budgetData.year
    );

    let updatedBudgets: Budget[];
    let savedBudget: Budget;

    if (existingIdx >= 0) {
      updatedBudgets = [...state.budgets];
      savedBudget = {
        ...updatedBudgets[existingIdx],
        limit_amount_paise: budgetData.limit_amount_paise,
        updated_at: now,
        category,
      };
      updatedBudgets[existingIdx] = savedBudget;
    } else {
      savedBudget = {
        ...budgetData,
        id: `b-${Date.now()}`,
        created_at: now,
        updated_at: now,
        category,
      };
      updatedBudgets = [...state.budgets, savedBudget];
    }

    set({ budgets: updatedBudgets });

    if (db) {
      upsertBudget(db, savedBudget).catch((e) =>
        console.error("[DB] Failed to upsert budget:", e)
      );
    }
  },

  // ───── Delete Budget ─────
  deleteBudget: (id) => {
    const state = get();
    const db = state._db;

    set({ budgets: state.budgets.filter((b) => b.id !== id) });

    if (db) {
      deleteBudgetDb(db, id).catch((e) =>
        console.error("[DB] Failed to delete budget:", e)
      );
    }
  },

  // ───── Add Platform ─────
  addPlatform: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const state = get();
    const db = state._db;

    if (
      state.customPlatforms.some(
        (p) => p.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      return;
    }

    set({ customPlatforms: [...state.customPlatforms, trimmed] });

    if (db) {
      insertPlatform(db, trimmed).catch((e) =>
        console.error("[DB] Failed to insert platform:", e)
      );
    }
  },

  // ───── Delete Platform ─────
  deletePlatform: (name) => {
    const state = get();
    const db = state._db;

    set({
      customPlatforms: state.customPlatforms.filter((p) => p !== name),
    });

    if (db) {
      deletePlatformDb(db, name).catch((e) =>
        console.error("[DB] Failed to delete platform:", e)
      );
    }
  },

  // ───── Set Overall Monthly Budget ─────
  setOverallMonthlyBudget: (month, year, limit_paise) => {
    const state = get();
    const db = state._db;

    set({
      overallMonthlyBudgets: {
        ...state.overallMonthlyBudgets,
        [`${year}-${month}`]: limit_paise,
      },
    });

    if (db) {
      upsertMonthlyCeiling(db, month, year, limit_paise).catch((e) =>
        console.error("[DB] Failed to upsert monthly ceiling:", e)
      );
    }
  },

  // ───── Add Debt ─────
  addDebt: (debtData) => {
    const state = get();
    const db = state._db;
    const now = new Date().toISOString();
    const newDebt: Debt = {
      ...debtData,
      id: `debt-${Date.now()}`,
      created_at: now,
      updated_at: now,
    };
    set({ debts: [newDebt, ...state.debts] });
    if (db) {
      insertDebt(db, newDebt).catch((e) =>
        console.error("[DB] Failed to insert debt:", e)
      );
    }
  },

  // ───── Update Debt ─────
  updateDebt: (id, updates) => {
    const state = get();
    const db = state._db;
    const now = new Date().toISOString();
    set({
      debts: state.debts.map((d) =>
        d.id === id ? { ...d, ...updates, updated_at: now } : d
      ),
    });
    if (db) {
      updateDebtDb(db, id, updates).catch((e) =>
        console.error("[DB] Failed to update debt:", e)
      );
    }
  },

  // ───── Settle Debt (partial or full) ─────
  settleDebt: (id, settlePaise) => {
    const state = get();
    const db = state._db;
    const debt = state.debts.find((d) => d.id === id);
    if (!debt) return;

    const newSettled = Math.min(debt.amount_paise, debt.settled_paise + settlePaise);
    const newStatus: DebtStatus =
      newSettled >= debt.amount_paise ? "settled" : "partially_settled";

    set({
      debts: state.debts.map((d) =>
        d.id === id
          ? { ...d, settled_paise: newSettled, status: newStatus, updated_at: new Date().toISOString() }
          : d
      ),
    });

    if (db) {
      updateDebtDb(db, id, { settled_paise: newSettled, status: newStatus }).catch((e) =>
        console.error("[DB] Failed to settle debt:", e)
      );
    }
  },

  // ───── Delete Debt ─────
  deleteDebt: (id) => {
    const state = get();
    const db = state._db;
    set({ debts: state.debts.filter((d) => d.id !== id) });
    if (db) {
      deleteDebtDb(db, id).catch((e) =>
        console.error("[DB] Failed to delete debt:", e)
      );
    }
  },

  // ───── Add Subscription ─────
  addSubscription: (subData) => {
    const state = get();
    const db = state._db;
    const now = new Date().toISOString();
    const next_billing_date = computeNextBillingDate(subData.billing_day, subData.billing_cycle);
    const newSub: Subscription = {
      ...subData,
      id: `sub-${Date.now()}`,
      next_billing_date,
      created_at: now,
      updated_at: now,
    };
    set({ subscriptions: [newSub, ...state.subscriptions] });
    if (db) {
      insertSubscription(db, newSub).catch((e) =>
        console.error("[DB] Failed to insert subscription:", e)
      );
    }
  },

  // ───── Update Subscription ─────
  updateSubscription: (id, updates) => {
    const state = get();
    const db = state._db;
    const now = new Date().toISOString();

    // If billing_day or billing_cycle changed, recompute next_billing_date
    const existing = state.subscriptions.find((s) => s.id === id);
    let extra: Partial<Subscription> = {};
    if (existing && (updates.billing_day !== undefined || updates.billing_cycle !== undefined)) {
      const day = updates.billing_day ?? existing.billing_day;
      const cycle = updates.billing_cycle ?? existing.billing_cycle;
      extra.next_billing_date = computeNextBillingDate(day, cycle);
    }

    set({
      subscriptions: state.subscriptions.map((s) =>
        s.id === id ? { ...s, ...updates, ...extra, updated_at: now } : s
      ),
    });
    if (db) {
      updateSubscriptionDb(db, id, { ...updates, ...extra }).catch((e) =>
        console.error("[DB] Failed to update subscription:", e)
      );
    }
  },

  // ───── Delete Subscription ─────
  deleteSubscription: (id) => {
    const state = get();
    const db = state._db;
    set({ subscriptions: state.subscriptions.filter((s) => s.id !== id) });
    if (db) {
      deleteSubscriptionDb(db, id).catch((e) =>
        console.error("[DB] Failed to delete subscription:", e)
      );
    }
  },

  // ───── Toggle Subscription Status ─────
  toggleSubscriptionStatus: (id, status) => {
    const state = get();
    const db = state._db;
    const now = new Date().toISOString();
    set({
      subscriptions: state.subscriptions.map((s) =>
        s.id === id ? { ...s, status, updated_at: now } : s
      ),
    });
    if (db) {
      updateSubscriptionDb(db, id, { status }).catch((e) =>
        console.error("[DB] Failed to toggle subscription status:", e)
      );
    }
  },

  // ───── Full Restore from Backup ─────
  restoreFromBackup: async (data) => {
    const db = get()._db;
    if (db) {
      await restoreDatabaseSnapshot(db, data);
      const rehydrated = await hydrateAll(db);
      set({ ...rehydrated });
    } else {
      set({ ...data });
    }
  },
}));
