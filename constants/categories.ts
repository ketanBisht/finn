import { TransactionType } from "@/types";

export interface DefaultCategoryDefinition {
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
}

export const DEFAULT_EXPENSE_CATEGORIES: DefaultCategoryDefinition[] = [
  { name: "Food", type: "expense", icon: "Utensils", color: "#f97316" },
  { name: "Shopping", type: "expense", icon: "ShoppingBag", color: "#ec4899" },
  { name: "Transportation", type: "expense", icon: "Car", color: "#3b82f6" },
  { name: "Entertainment", type: "expense", icon: "Film", color: "#a855f7" },
  { name: "Bills", type: "expense", icon: "Receipt", color: "#eab308" },
  { name: "Healthcare", type: "expense", icon: "HeartPulse", color: "#ef4444" },
  { name: "Education", type: "expense", icon: "GraduationCap", color: "#06b6d4" },
  { name: "Groceries", type: "expense", icon: "ShoppingCart", color: "#84cc16" },
  { name: "Travel", type: "expense", icon: "Plane", color: "#6366f1" },
  { name: "Personal Care", type: "expense", icon: "Smile", color: "#14b8a6" },
  { name: "Other", type: "expense", icon: "MoreHorizontal", color: "#64748b" },
];

export const DEFAULT_INCOME_CATEGORIES: DefaultCategoryDefinition[] = [
  { name: "Salary", type: "income", icon: "Briefcase", color: "#10b981" },
  { name: "Freelancing", type: "income", icon: "Laptop", color: "#06b6d4" },
  { name: "Business", type: "income", icon: "TrendingUp", color: "#8b5cf6" },
  { name: "Investments", type: "income", icon: "PiggyBank", color: "#f59e0b" },
  { name: "Gifts", type: "income", icon: "Gift", color: "#ec4899" },
  { name: "Other", type: "income", icon: "PlusCircle", color: "#64748b" },
];

