/**
 * lib/db.ts
 * ─────────
 * SQLite database layer for Wage.
 * Handles schema creation, migrations, and all CRUD operations.
 * All monetary values stored as INTEGER (paise).
 */

import type { SQLiteDatabase } from "expo-sqlite";
import type {
  Account,
  AccountType,
  Category,
  Transaction,
  Budget,
  TransactionType,
  PaymentMode,
  UPIApp,
  Debt,
  DebtDirection,
  DebtStatus,
} from "@/types";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "@/constants/categories";

// ───────────────────────────── Schema Version ─────────────────────────────
const CURRENT_DB_VERSION = 1;

// ───────────────────────────── Migration ─────────────────────────────
export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  // Enable WAL for better concurrent performance
  await db.execAsync("PRAGMA journal_mode = WAL;");

  // Check current schema version
  const result = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version;"
  );
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= CURRENT_DB_VERSION) return;

  // Version 0 → 1: Initial schema
  if (currentVersion < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income','expense','transfer')),
        icon TEXT,
        color TEXT,
        is_system INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL DEFAULT 'local-user',
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('cash','savings','current','wallet','credit_card','investment','other')),
        opening_balance_paise INTEGER NOT NULL DEFAULT 0,
        current_balance_paise INTEGER NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'INR',
        is_active INTEGER NOT NULL DEFAULT 1,
        institution_name TEXT,
        color TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL DEFAULT 'local-user',
        account_id TEXT NOT NULL,
        category_id TEXT,
        amount_paise INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income','expense','transfer')),
        destination_account_id TEXT,
        description TEXT NOT NULL DEFAULT '',
        notes TEXT,
        transaction_date TEXT NOT NULL,
        payment_mode TEXT,
        upi_app TEXT,
        platform TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (destination_account_id) REFERENCES accounts(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL DEFAULT 'local-user',
        category_id TEXT NOT NULL,
        month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
        year INTEGER NOT NULL,
        limit_amount_paise INTEGER NOT NULL,
        rollover INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        UNIQUE(category_id, month, year)
      );

      CREATE TABLE IF NOT EXISTS monthly_budget_ceilings (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL DEFAULT 'local-user',
        month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
        year INTEGER NOT NULL,
        limit_paise INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(month, year)
      );

      CREATE TABLE IF NOT EXISTS custom_platforms (
        name TEXT PRIMARY KEY NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS debts (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL DEFAULT 'local-user',
        direction TEXT NOT NULL CHECK(direction IN ('given','taken')),
        person_name TEXT NOT NULL,
        amount_paise INTEGER NOT NULL,
        settled_paise INTEGER NOT NULL DEFAULT 0,
        due_date TEXT,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','partially_settled','settled')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
      CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_budgets_month_year ON budgets(month, year);
    `);

    // Seed default categories on first launch
    await seedDefaultCategories(db);
  }

  // Stamp current version
  await db.execAsync(`PRAGMA user_version = ${CURRENT_DB_VERSION};`);
}

// ───────────────────────────── Seed Defaults ─────────────────────────────
async function seedDefaultCategories(db: SQLiteDatabase): Promise<void> {
  const existing = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM categories;"
  );
  if ((existing?.count ?? 0) > 0) return;

  for (let i = 0; i < DEFAULT_EXPENSE_CATEGORIES.length; i++) {
    const cat = DEFAULT_EXPENSE_CATEGORIES[i];
    await db.runAsync(
      `INSERT INTO categories (id, user_id, name, type, icon, color, is_system) VALUES (?, NULL, ?, ?, ?, ?, 1);`,
      `cat-exp-${i + 1}`,
      cat.name,
      cat.type,
      cat.icon,
      cat.color
    );
  }
  for (let i = 0; i < DEFAULT_INCOME_CATEGORIES.length; i++) {
    const cat = DEFAULT_INCOME_CATEGORIES[i];
    await db.runAsync(
      `INSERT INTO categories (id, user_id, name, type, icon, color, is_system) VALUES (?, NULL, ?, ?, ?, ?, 1);`,
      `cat-inc-${i + 1}`,
      cat.name,
      cat.type,
      cat.icon,
      cat.color
    );
  }
}

// ───────────────────────────── Row → Model Helpers ─────────────────────────────
function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    user_id: (row.user_id as string | null) ?? undefined,
    name: row.name as string,
    type: row.type as TransactionType,
    icon: (row.icon as string) ?? undefined,
    color: (row.color as string) ?? undefined,
    is_system: (row.is_system as number) === 1,
    created_at: row.created_at as string,
  };
}

function rowToAccount(row: Record<string, unknown>): Account {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    name: row.name as string,
    type: row.type as AccountType,
    opening_balance_paise: row.opening_balance_paise as number,
    current_balance_paise: row.current_balance_paise as number,
    currency: row.currency as string,
    is_active: (row.is_active as number) === 1,
    institution_name: (row.institution_name as string | null) ?? undefined,
    color: (row.color as string | null) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function rowToTransaction(
  row: Record<string, unknown>,
  accounts: Account[],
  categories: Category[]
): Transaction {
  const account = accounts.find((a) => a.id === row.account_id);
  const destAccount = row.destination_account_id
    ? accounts.find((a) => a.id === row.destination_account_id)
    : undefined;
  const category = row.category_id
    ? categories.find((c) => c.id === row.category_id)
    : undefined;

  return {
    id: row.id as string,
    user_id: row.user_id as string,
    account_id: row.account_id as string,
    category_id: (row.category_id as string | null) ?? undefined,
    amount_paise: row.amount_paise as number,
    type: row.type as TransactionType,
    destination_account_id:
      (row.destination_account_id as string | null) ?? undefined,
    description: row.description as string,
    notes: (row.notes as string | null) ?? undefined,
    transaction_date: row.transaction_date as string,
    payment_mode: (row.payment_mode as PaymentMode | null) ?? undefined,
    upi_app: (row.upi_app as UPIApp | string | null) ?? undefined,
    platform: (row.platform as string | null) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    account,
    destination_account: destAccount,
    category,
  };
}

function rowToBudget(
  row: Record<string, unknown>,
  categories: Category[]
): Budget {
  const category = categories.find((c) => c.id === row.category_id);
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    category_id: row.category_id as string,
    month: row.month as number,
    year: row.year as number,
    limit_amount_paise: row.limit_amount_paise as number,
    rollover: (row.rollover as number) === 1,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    category,
  };
}

// ───────────────────────────── READ Operations ─────────────────────────────

export async function getAllCategories(db: SQLiteDatabase): Promise<Category[]> {
  const rows = await db.getAllAsync("SELECT * FROM categories ORDER BY type, name;");
  return (rows as Record<string, unknown>[]).map(rowToCategory);
}

export async function getAllAccounts(db: SQLiteDatabase): Promise<Account[]> {
  const rows = await db.getAllAsync(
    "SELECT * FROM accounts ORDER BY created_at ASC;"
  );
  return (rows as Record<string, unknown>[]).map(rowToAccount);
}

export async function getAllTransactions(
  db: SQLiteDatabase,
  accounts: Account[],
  categories: Category[]
): Promise<Transaction[]> {
  const rows = await db.getAllAsync(
    "SELECT * FROM transactions ORDER BY transaction_date DESC, created_at DESC;"
  );
  return (rows as Record<string, unknown>[]).map((r) =>
    rowToTransaction(r, accounts, categories)
  );
}

export async function getAllBudgets(
  db: SQLiteDatabase,
  categories: Category[]
): Promise<Budget[]> {
  const rows = await db.getAllAsync("SELECT * FROM budgets ORDER BY year, month;");
  return (rows as Record<string, unknown>[]).map((r) =>
    rowToBudget(r, categories)
  );
}

export async function getOverallMonthlyBudgets(
  db: SQLiteDatabase
): Promise<Record<string, number>> {
  const rows = await db.getAllAsync("SELECT * FROM monthly_budget_ceilings;");
  const result: Record<string, number> = {};
  for (const row of rows as Record<string, unknown>[]) {
    const key = `${row.year}-${row.month}`;
    result[key] = row.limit_paise as number;
  }
  return result;
}

export async function getCustomPlatforms(
  db: SQLiteDatabase
): Promise<string[]> {
  const rows = await db.getAllAsync(
    "SELECT name FROM custom_platforms ORDER BY created_at ASC;"
  );
  return (rows as Record<string, unknown>[]).map((r) => r.name as string);
}

// ───────────────────────────── Full Hydration ─────────────────────────────
export interface HydratedState {
  categories: Category[];
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  overallMonthlyBudgets: Record<string, number>;
  customPlatforms: string[];
  debts: Debt[];
}

export async function hydrateAll(db: SQLiteDatabase): Promise<HydratedState> {
  const categories = await getAllCategories(db);
  const accounts = await getAllAccounts(db);
  const transactions = await getAllTransactions(db, accounts, categories);
  const budgets = await getAllBudgets(db, categories);
  const overallMonthlyBudgets = await getOverallMonthlyBudgets(db);
  const customPlatforms = await getCustomPlatforms(db);
  const debts = await getAllDebts(db);

  return {
    categories,
    accounts,
    transactions,
    budgets,
    overallMonthlyBudgets,
    customPlatforms,
    debts,
  };
}

// ───────────────────────────── WRITE: Accounts ─────────────────────────────

export async function insertAccount(
  db: SQLiteDatabase,
  acc: Omit<Account, "created_at" | "updated_at" | "current_balance_paise"> & {
    id: string;
  }
): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO accounts (id, user_id, name, type, opening_balance_paise, current_balance_paise, currency, is_active, institution_name, color, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    acc.id,
    acc.user_id,
    acc.name,
    acc.type,
    acc.opening_balance_paise,
    acc.opening_balance_paise, // current = opening at creation
    acc.currency,
    acc.is_active ? 1 : 0,
    acc.institution_name ?? null,
    acc.color ?? null,
    now,
    now
  );
}

export async function updateAccountDb(
  db: SQLiteDatabase,
  id: string,
  updates: Partial<Account>
): Promise<void> {
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.name !== undefined) {
    sets.push("name = ?");
    values.push(updates.name);
  }
  if (updates.type !== undefined) {
    sets.push("type = ?");
    values.push(updates.type);
  }
  if (updates.current_balance_paise !== undefined) {
    sets.push("current_balance_paise = ?");
    values.push(updates.current_balance_paise);
  }
  if (updates.is_active !== undefined) {
    sets.push("is_active = ?");
    values.push(updates.is_active ? 1 : 0);
  }
  if (updates.institution_name !== undefined) {
    sets.push("institution_name = ?");
    values.push(updates.institution_name ?? null);
  }
  if (updates.color !== undefined) {
    sets.push("color = ?");
    values.push(updates.color ?? null);
  }

  if (sets.length === 0) return;
  sets.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  await db.runAsync(
    `UPDATE accounts SET ${sets.join(", ")} WHERE id = ?;`,
    ...values
  );
}

export async function deleteAccountDb(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync("DELETE FROM transactions WHERE account_id = ?;", id);
  await db.runAsync("DELETE FROM accounts WHERE id = ?;", id);
}

// ───────────────────────────── WRITE: Transactions ─────────────────────────────

export async function insertTransaction(
  db: SQLiteDatabase,
  tx: Transaction
): Promise<void> {
  await db.runAsync(
    `INSERT INTO transactions (id, user_id, account_id, category_id, amount_paise, type, destination_account_id, description, notes, transaction_date, payment_mode, upi_app, platform, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    tx.id,
    tx.user_id,
    tx.account_id,
    tx.category_id ?? null,
    tx.amount_paise,
    tx.type,
    tx.destination_account_id ?? null,
    tx.description,
    tx.notes ?? null,
    tx.transaction_date,
    tx.payment_mode ?? null,
    tx.upi_app ?? null,
    tx.platform ?? null,
    tx.created_at,
    tx.updated_at
  );
}

export async function deleteTransactionDb(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync("DELETE FROM transactions WHERE id = ?;", id);
}

// Update account balance in DB
export async function updateAccountBalance(
  db: SQLiteDatabase,
  accountId: string,
  newBalancePaise: number
): Promise<void> {
  await db.runAsync(
    "UPDATE accounts SET current_balance_paise = ?, updated_at = ? WHERE id = ?;",
    newBalancePaise,
    new Date().toISOString(),
    accountId
  );
}

// ───────────────────────────── WRITE: Budgets ─────────────────────────────

export async function upsertBudget(
  db: SQLiteDatabase,
  budget: Budget
): Promise<void> {
  await db.runAsync(
    `INSERT INTO budgets (id, user_id, category_id, month, year, limit_amount_paise, rollover, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(category_id, month, year) DO UPDATE SET
       limit_amount_paise = excluded.limit_amount_paise,
       rollover = excluded.rollover,
       updated_at = excluded.updated_at;`,
    budget.id,
    budget.user_id,
    budget.category_id,
    budget.month,
    budget.year,
    budget.limit_amount_paise,
    budget.rollover ? 1 : 0,
    budget.created_at,
    budget.updated_at
  );
}

export async function deleteBudgetDb(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync("DELETE FROM budgets WHERE id = ?;", id);
}

// ───────────────────────────── WRITE: Monthly Ceilings ─────────────────────────────

export async function upsertMonthlyCeiling(
  db: SQLiteDatabase,
  month: number,
  year: number,
  limitPaise: number
): Promise<void> {
  const now = new Date().toISOString();
  const id = `mc-${year}-${month}`;
  await db.runAsync(
    `INSERT INTO monthly_budget_ceilings (id, user_id, month, year, limit_paise, created_at, updated_at)
     VALUES (?, 'local-user', ?, ?, ?, ?, ?)
     ON CONFLICT(month, year) DO UPDATE SET
       limit_paise = excluded.limit_paise,
       updated_at = excluded.updated_at;`,
    id,
    month,
    year,
    limitPaise,
    now,
    now
  );
}

// ───────────────────────────── WRITE: Custom Platforms ─────────────────────────────

export async function insertPlatform(
  db: SQLiteDatabase,
  name: string
): Promise<void> {
  await db.runAsync(
    `INSERT OR IGNORE INTO custom_platforms (name) VALUES (?);`,
    name
  );
}

export async function deletePlatformDb(
  db: SQLiteDatabase,
  name: string
): Promise<void> {
  await db.runAsync("DELETE FROM custom_platforms WHERE name = ?;", name);
}

// ───────────────────────────── WRITE: Categories ─────────────────────────────

export async function insertCategory(
  db: SQLiteDatabase,
  cat: Category
): Promise<void> {
  await db.runAsync(
    `INSERT INTO categories (id, user_id, name, type, icon, color, is_system, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    cat.id,
    cat.user_id ?? null,
    cat.name,
    cat.type,
    cat.icon ?? null,
    cat.color ?? null,
    cat.is_system ? 1 : 0,
    cat.created_at
  );
}


// ───────────────────────────── READ: Debts ─────────────────────────────

function rowToDebt(row: Record<string, unknown>): Debt {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    direction: row.direction as DebtDirection,
    person_name: row.person_name as string,
    amount_paise: row.amount_paise as number,
    settled_paise: row.settled_paise as number,
    due_date: (row.due_date as string | null) ?? undefined,
    notes: (row.notes as string | null) ?? undefined,
    status: row.status as DebtStatus,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getAllDebts(db: SQLiteDatabase): Promise<Debt[]> {
  const rows = await db.getAllAsync(
    "SELECT * FROM debts ORDER BY status ASC, created_at DESC;"
  );
  return (rows as Record<string, unknown>[]).map(rowToDebt);
}

// ───────────────────────────── WRITE: Debts ─────────────────────────────

export async function insertDebt(db: SQLiteDatabase, debt: Debt): Promise<void> {
  await db.runAsync(
    `INSERT INTO debts (id, user_id, direction, person_name, amount_paise, settled_paise, due_date, notes, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    debt.id,
    debt.user_id,
    debt.direction,
    debt.person_name,
    debt.amount_paise,
    debt.settled_paise,
    debt.due_date ?? null,
    debt.notes ?? null,
    debt.status,
    debt.created_at,
    debt.updated_at
  );
}

export async function updateDebtDb(
  db: SQLiteDatabase,
  id: string,
  updates: Partial<Debt>
): Promise<void> {
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.settled_paise !== undefined) {
    sets.push("settled_paise = ?");
    values.push(updates.settled_paise);
  }
  if (updates.status !== undefined) {
    sets.push("status = ?");
    values.push(updates.status);
  }
  if (updates.notes !== undefined) {
    sets.push("notes = ?");
    values.push(updates.notes ?? null);
  }
  if (updates.due_date !== undefined) {
    sets.push("due_date = ?");
    values.push(updates.due_date ?? null);
  }
  if (updates.person_name !== undefined) {
    sets.push("person_name = ?");
    values.push(updates.person_name);
  }
  if (sets.length === 0) return;
  sets.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  await db.runAsync(
    `UPDATE debts SET ${sets.join(", ")} WHERE id = ?;`,
    ...values
  );
}

export async function deleteDebtDb(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync("DELETE FROM debts WHERE id = ?;", id);
}
