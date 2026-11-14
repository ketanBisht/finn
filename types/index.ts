export type TransactionType = "income" | "expense" | "transfer";

export type AccountType = "cash" | "savings" | "current" | "other";

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  opening_balance_paise: number;
  current_balance_paise: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id?: string | null; // null for system defaults
  name: string;
  type: TransactionType;
  icon?: string;
  color?: string;
  is_system: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id?: string | null;
  amount_paise: number;
  type: TransactionType;
  destination_account_id?: string | null;
  description: string;
  notes?: string;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  // Joined relation fields
  account?: Account;
  destination_account?: Account;
  category?: Category;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month: number; // 1-12
  year: number;
  limit_amount_paise: number;
  created_at: string;
  updated_at: string;
  category?: Category;
}

