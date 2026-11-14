import { create } from "zustand";
import { Account, Category, Transaction, Budget } from "@/types";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "@/constants/categories";

const initialCategories: Category[] = [
  ...DEFAULT_EXPENSE_CATEGORIES.map((cat, index) => ({
    id: `cat-exp-${index + 1}`,
    name: cat.name,
    type: cat.type,
    icon: cat.icon,
    color: cat.color,
    is_system: true,
    created_at: new Date().toISOString(),
  })),
  ...DEFAULT_INCOME_CATEGORIES.map((cat, index) => ({
    id: `cat-inc-${index + 1}`,
    name: cat.name,
    type: cat.type,
    icon: cat.icon,
    color: cat.color,
    is_system: true,
    created_at: new Date().toISOString(),
  })),
];

const initialAccounts: Account[] = [
  {
    id: "acc-1",
    user_id: "local-user",
    name: "Cash Wallet",
    type: "cash",
    opening_balance_paise: 500000, // ₹5,000.00
    current_balance_paise: 1545000, // ₹15,450.00
    currency: "INR",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "acc-2",
    user_id: "local-user",
    name: "Primary Bank Account",
    type: "savings",
    opening_balance_paise: 20000000, // ₹2,00,000.00
    current_balance_paise: 22955000, // ₹2,29,550.00
    currency: "INR",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const initialTransactions: Transaction[] = [
  {
    id: "tx-1",
    user_id: "local-user",
    account_id: "acc-2",
    category_id: "cat-inc-1", // Salary
    amount_paise: 12000000, // ₹1,20,000
    type: "income",
    description: "Monthly Salary Credit",
    payment_mode: "netbanking",
    platform: "Direct Bank Transfer",
    transaction_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    account: initialAccounts[1],
    category: initialCategories.find((c) => c.name === "Salary"),
  },
  {
    id: "tx-2",
    user_id: "local-user",
    account_id: "acc-2",
    category_id: "cat-exp-5", // Bills
    amount_paise: 1850000, // ₹18,500
    type: "expense",
    description: "House Rent & Maintenance",
    payment_mode: "upi",
    upi_app: "cred",
    platform: "CRED",
    transaction_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    account: initialAccounts[1],
    category: initialCategories.find((c) => c.name === "Bills"),
  },
  {
    id: "tx-3",
    user_id: "local-user",
    account_id: "acc-1",
    category_id: "cat-exp-1", // Food
    amount_paise: 145000, // ₹1,450
    type: "expense",
    description: "Dinner with friends",
    payment_mode: "cash",
    platform: "Offline Restaurant",
    transaction_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    account: initialAccounts[0],
    category: initialCategories.find((c) => c.name === "Food"),
  },
  {
    id: "tx-4",
    user_id: "local-user",
    account_id: "acc-2",
    category_id: "cat-exp-8", // Groceries
    amount_paise: 382000, // ₹3,820
    type: "expense",
    description: "Weekly Grocery & Veggies",
    payment_mode: "upi",
    upi_app: "gpay",
    platform: "Blinkit",
    transaction_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    account: initialAccounts[1],
    category: initialCategories.find((c) => c.name === "Groceries"),
  },
  {
    id: "tx-5",
    user_id: "local-user",
    account_id: "acc-2",
    category_id: "cat-exp-1", // Food
    amount_paise: 42000, // ₹420
    type: "expense",
    description: "Weekend Biryani",
    payment_mode: "upi",
    upi_app: "phonepe",
    platform: "Swiggy",
    transaction_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    account: initialAccounts[1],
    category: initialCategories.find((c) => c.name === "Food"),
  },
  {
    id: "tx-6",
    user_id: "local-user",
    account_id: "acc-2",
    category_id: "cat-exp-2", // Transportation
    amount_paise: 35000, // ₹350
    type: "expense",
    description: "Cab to Office",
    payment_mode: "upi",
    upi_app: "paytm",
    platform: "Uber",
    transaction_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    account: initialAccounts[1],
    category: initialCategories.find((c) => c.name === "Transportation"),
  },
];

const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();

const initialBudgets: Budget[] = [
  {
    id: "b-1",
    user_id: "local-user",
    category_id: "cat-exp-1", // Food
    month: currentMonth,
    year: currentYear,
    limit_amount_paise: 1500000, // ₹15,000 limit
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: initialCategories.find((c) => c.name === "Food"),
  },
  {
    id: "b-2",
    user_id: "local-user",
    category_id: "cat-exp-8", // Groceries
    month: currentMonth,
    year: currentYear,
    limit_amount_paise: 1200000, // ₹12,000 limit
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: initialCategories.find((c) => c.name === "Groceries"),
  },
  {
    id: "b-3",
    user_id: "local-user",
    category_id: "cat-exp-5", // Bills
    month: currentMonth,
    year: currentYear,
    limit_amount_paise: 2500000, // ₹25,000 limit
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: initialCategories.find((c) => c.name === "Bills"),
  },
];

interface FinanceStoreState {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  customPlatforms: string[];
  overallMonthlyBudgets: Record<string, number>; // key: `${year}-${month}`, value: limit_amount_paise

  // Actions
  addTransaction: (tx: Omit<Transaction, "id" | "created_at" | "updated_at">) => void;
  deleteTransaction: (id: string) => void;
  addAccount: (acc: Omit<Account, "id" | "created_at" | "updated_at" | "current_balance_paise">) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  setBudget: (budget: Omit<Budget, "id" | "created_at" | "updated_at">) => void;
  deleteBudget: (id: string) => void;
  addPlatform: (name: string) => void;
  deletePlatform: (name: string) => void;
  setOverallMonthlyBudget: (month: number, year: number, limit_paise: number) => void;
}

export const useFinanceStore = create<FinanceStoreState>((set) => ({
  accounts: initialAccounts,
  categories: initialCategories,
  transactions: initialTransactions,
  budgets: initialBudgets,
  customPlatforms: ["Swiggy", "Zomato", "Blinkit", "Amazon", "Uber", "In-Store / Offline"],
  overallMonthlyBudgets: {
    [`${currentYear}-${currentMonth}`]: 6000000, // ₹60,000 top-down budget
  },

  addPlatform: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((state) => {
      if (state.customPlatforms.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
        return state;
      }
      return { customPlatforms: [...state.customPlatforms, trimmed] };
    });
  },

  deletePlatform: (name) => {
    set((state) => ({
      customPlatforms: state.customPlatforms.filter((p) => p !== name),
    }));
  },

  setOverallMonthlyBudget: (month, year, limit_paise) => {
    set((state) => ({
      overallMonthlyBudgets: {
        ...state.overallMonthlyBudgets,
        [`${year}-${month}`]: limit_paise,
      },
    }));
  },

  addTransaction: (newTxData) => {
    set((state) => {
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
            return { ...acc, current_balance_paise: acc.current_balance_paise + newTx.amount_paise };
          } else {
            return { ...acc, current_balance_paise: acc.current_balance_paise - newTx.amount_paise };
          }
        }
        if (newTx.type === "transfer" && acc.id === newTx.destination_account_id) {
          return { ...acc, current_balance_paise: acc.current_balance_paise + newTx.amount_paise };
        }
        return acc;
      });

      return {
        transactions: [newTx, ...state.transactions],
        accounts: updatedAccounts,
      };
    });
  },

  deleteTransaction: (id: string) => {
    set((state) => {
      const tx = state.transactions.find((t) => t.id === id);
      if (!tx) return state;

      // Revert balances
      const updatedAccounts = state.accounts.map((acc) => {
        if (acc.id === tx.account_id) {
          if (tx.type === "income") {
            return { ...acc, current_balance_paise: acc.current_balance_paise - tx.amount_paise };
          } else {
            return { ...acc, current_balance_paise: acc.current_balance_paise + tx.amount_paise };
          }
        }
        if (tx.type === "transfer" && acc.id === tx.destination_account_id) {
          return { ...acc, current_balance_paise: acc.current_balance_paise - tx.amount_paise };
        }
        return acc;
      });

      return {
        transactions: state.transactions.filter((t) => t.id !== id),
        accounts: updatedAccounts,
      };
    });
  },

  addAccount: (accData) => {
    set((state) => {
      const newAcc: Account = {
        ...accData,
        id: `acc-${Date.now()}`,
        current_balance_paise: accData.opening_balance_paise,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return { accounts: [...state.accounts, newAcc] };
    });
  },

  updateAccount: (id, updates) => {
    set((state) => ({
      accounts: state.accounts.map((acc) =>
        acc.id === id ? { ...acc, ...updates, updated_at: new Date().toISOString() } : acc
      ),
    }));
  },

  deleteAccount: (id) => {
    set((state) => ({
      accounts: state.accounts.filter((acc) => acc.id !== id),
      transactions: state.transactions.filter((tx) => tx.account_id !== id),
    }));
  },

  setBudget: (budgetData) => {
    set((state) => {
      const existingIdx = state.budgets.findIndex(
        (b) =>
          b.category_id === budgetData.category_id &&
          b.month === budgetData.month &&
          b.year === budgetData.year
      );
      const category = state.categories.find((c) => c.id === budgetData.category_id);
      const now = new Date().toISOString();

      if (existingIdx >= 0) {
        const updated = [...state.budgets];
        updated[existingIdx] = {
          ...updated[existingIdx],
          limit_amount_paise: budgetData.limit_amount_paise,
          updated_at: now,
          category,
        };
        return { budgets: updated };
      } else {
        const newBudget: Budget = {
          ...budgetData,
          id: `b-${Date.now()}`,
          created_at: now,
          updated_at: now,
          category,
        };
        return { budgets: [...state.budgets, newBudget] };
      }
    });
  },

  deleteBudget: (id) => {
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    }));
  },
}));

