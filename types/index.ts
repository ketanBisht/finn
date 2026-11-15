export type TransactionType = "income" | "expense" | "transfer";

export type AccountType =
  | "cash"
  | "savings"
  | "current"
  | "wallet"
  | "credit_card"
  | "investment"
  | "other";

export type PaymentMode =
  | "upi"
  | "card"
  | "netbanking"
  | "cash"
  | "wallet"
  | "other";

export type UPIApp =
  | "gpay"
  | "phonepe"
  | "paytm"
  | "cred"
  | "bhim"
  | "amazon_pay"
  | "other";

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
  institution_name?: string; // e.g. "HDFC", "SBI", "Paytm", "Zerodha"
  color?: string;
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
  payment_mode?: PaymentMode;
  upi_app?: UPIApp | string | null;
  platform?: string | null; // e.g. "Swiggy", "Amazon", "Blinkit", "Zomato", "Uber", "CRED"
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
  rollover?: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface MonthlyBudgetGoal {
  id: string;
  user_id: string;
  month: number; // 1-12
  year: number;
  overall_budget_paise: number; // The user-given total ceiling
  created_at: string;
  updated_at: string;
}

export type DebtDirection = "given" | "taken"; // given = you lent money, taken = you borrowed

export type DebtStatus = "pending" | "partially_settled" | "settled";

export interface Debt {
  id: string;
  user_id: string;
  direction: DebtDirection;
  person_name: string;       // who you lent to / borrowed from
  amount_paise: number;      // original amount
  settled_paise: number;     // how much has been settled
  due_date?: string | null;
  notes?: string | null;
  status: DebtStatus;
  created_at: string;
  updated_at: string;
}

export type SubscriptionBillingCycle = "monthly" | "yearly" | "weekly" | "quarterly";

export type SubscriptionStatus = "active" | "paused" | "cancelled";

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  amount_paise: number;
  billing_cycle: SubscriptionBillingCycle;
  billing_day: number; // 1-31
  next_billing_date: string; // YYYY-MM-DD
  category_id?: string | null;
  account_id?: string | null;
  platform?: string | null;
  payment_mode?: PaymentMode;
  upi_app?: UPIApp | string | null;
  status: SubscriptionStatus;
  auto_log?: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  account?: Account;
}


