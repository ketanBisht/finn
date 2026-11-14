import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Eye,
  EyeOff,
  Plus,
  Receipt,
  Settings,
  Coffee,
  Train,
  Utensils,
  ShoppingBag,
  Calendar,
  Sparkles,
} from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { Heading, Subheading, Caption, FinancialAmount } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { useFinanceStore } from "@/store/useFinanceStore";
import { formatCurrencyFromPaise, formatLocalDate, rupeesToPaise } from "@/lib/utils";

// Instant 1-tap template chips
const QUICK_EXPENSE_TEMPLATES = [
  { label: "Chai / Tea", amount: 20, icon: Coffee, catName: "Food" },
  { label: "Metro / Auto", amount: 50, icon: Train, catName: "Transportation" },
  { label: "Lunch", amount: 150, icon: Utensils, catName: "Food" },
  { label: "Snacks", amount: 80, icon: ShoppingBag, catName: "Food" },
];

export default function DashboardScreen() {
  const [hideBalances, setHideBalances] = useState(false);

  const accounts = useFinanceStore((s) => s.accounts);
  const transactions = useFinanceStore((s) => s.transactions);
  const budgets = useFinanceStore((s) => s.budgets);
  const categories = useFinanceStore((s) => s.categories);
  const addTransaction = useFinanceStore((s) => s.addTransaction);

  // 1. Total Net Balance across all accounts
  const totalBalancePaise = accounts.reduce(
    (sum, acc) => sum + (acc.is_active ? acc.current_balance_paise : 0),
    0
  );

  // 2. Current Month Calculations
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTransactions = transactions.filter((t) => {
    const d = new Date(t.transaction_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthlyIncomePaise = monthlyTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount_paise, 0);

  const monthlyExpensesPaise = monthlyTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount_paise, 0);

  // 3. Budgets & Daily Safe Pace
  const totalBudgetPaise = budgets
    .filter((b) => b.month === currentMonth + 1 && b.year === currentYear)
    .reduce((sum, b) => sum + b.limit_amount_paise, 0);

  const remainingBudgetPaise = Math.max(0, totalBudgetPaise - monthlyExpensesPaise);
  const budgetUtilizationPercent =
    totalBudgetPaise > 0
      ? Math.min(100, Math.round((monthlyExpensesPaise / totalBudgetPaise) * 100))
      : 0;

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = now.getDate();
  const daysRemaining = Math.max(1, daysInMonth - today + 1);
  const dailyPacePaise = Math.round(remainingBudgetPaise / daysRemaining);

  // 4. Quick Mini-Week Strip for immediate calendar context
  const currentDayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
  const weekDays = Array.from({ length: 7 }).map((_, idx) => {
    const diff = idx - currentDayOfWeek;
    const d = new Date(now);
    d.setDate(now.getDate() + diff);
    const dateStr = formatLocalDate(d);
    const daySpend = transactions
      .filter((t) => t.type === "expense" && formatLocalDate(t.transaction_date) === dateStr)
      .reduce((sum, t) => sum + t.amount_paise, 0);

    return {
      date: d,
      dayNum: d.getDate(),
      dayLabel: ["M", "T", "W", "T", "F", "S", "S"][idx],
      isToday: diff === 0,
      hasSpend: daySpend > 0,
      spendPaise: daySpend,
    };
  });

  // 5. Category Spending Breakdown for current month
  const categoryBreakdown = categories
    .filter((c) => c.type === "expense")
    .map((cat) => {
      const spent = monthlyTransactions
        .filter((t) => t.category_id === cat.id)
        .reduce((sum, t) => sum + t.amount_paise, 0);
      return {
        ...cat,
        spentPaise: spent,
        percent: monthlyExpensesPaise > 0 ? Math.round((spent / monthlyExpensesPaise) * 100) : 0,
      };
    })
    .filter((c) => c.spentPaise > 0)
    .sort((a, b) => b.spentPaise - a.spentPaise)
    .slice(0, 4);

  // Instant 1-tap template recording
  const handleInstantTemplate = (template: typeof QUICK_EXPENSE_TEMPLATES[0]) => {
    const primaryAccount = accounts[0];
    const matchedCategory = categories.find((c) => c.name === template.catName);

    if (!primaryAccount) {
      Alert.alert("Account Needed", "Please configure an account first.");
      return;
    }

    addTransaction({
      user_id: "local-user",
      account_id: primaryAccount.id,
      category_id: matchedCategory?.id || null,
      amount_paise: rupeesToPaise(template.amount),
      type: "expense",
      description: template.label,
      transaction_date: new Date().toISOString(),
    });

    Alert.alert("Recorded!", `Added ₹${template.amount} for ${template.label}`);
  };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      {/* Top Header */}
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-xs font-bold text-emerald-600 tracking-wider uppercase">
            {now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
          </Text>
          <Heading className="text-2xl mt-0.5">Financial Cockpit</Heading>
        </View>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => setHideBalances(!hideBalances)}
            className="p-2.5 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            {hideBalances ? (
              <EyeOff size={16} color="#64748b" />
            ) : (
              <Eye size={16} color="#64748b" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/settings")}
            className="p-2.5 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <Settings size={16} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Prominent Net Worth Card */}
        <View className="bg-slate-900 rounded-3xl p-6 mb-4 shadow-xl border border-slate-800">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-slate-400 text-xs font-bold tracking-wider uppercase">
              Total Net Balance
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/accounts")}
              className="flex-row items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-full"
            >
              <Text className="text-emerald-400 text-xs font-semibold">
                {accounts.length} Accounts
              </Text>
            </TouchableOpacity>
          </View>

          {hideBalances ? (
            <Text className="text-white text-3xl font-extrabold mb-4 mt-1">₹ ••••••••</Text>
          ) : (
            <FinancialAmount
              amountPaise={totalBalancePaise}
              type="neutral"
              prefix="₹"
              className="text-white text-3xl font-extrabold mb-4 mt-0.5"
            />
          )}

          {/* Income vs Spent Bar */}
          <View className="flex-row items-center justify-between pt-4 border-t border-slate-800">
            <View>
              <View className="flex-row items-center gap-1">
                <ArrowDownLeft size={13} color="#10b981" />
                <Text className="text-slate-400 text-xs font-medium">Income</Text>
              </View>
              {hideBalances ? (
                <Text className="text-slate-200 text-xs font-bold mt-0.5">₹ ••••</Text>
              ) : (
                <FinancialAmount
                  amountPaise={monthlyIncomePaise}
                  type="income"
                  showDecimals={false}
                  className="text-white text-sm font-bold mt-0.5"
                />
              )}
            </View>

            <View className="items-end">
              <View className="flex-row items-center gap-1">
                <ArrowUpRight size={13} color="#ef4444" />
                <Text className="text-slate-400 text-xs font-medium">Expenses</Text>
              </View>
              {hideBalances ? (
                <Text className="text-slate-200 text-xs font-bold mt-0.5">₹ ••••</Text>
              ) : (
                <FinancialAmount
                  amountPaise={monthlyExpensesPaise}
                  type="expense"
                  showDecimals={false}
                  className="text-white text-sm font-bold mt-0.5"
                />
              )}
            </View>
          </View>
        </View>

        {/* Hero Add Action Buttons (Right as you open the app) */}
        <View className="flex-row gap-2.5 mb-5">
          <TouchableOpacity
            onPress={() => router.push("/transaction/new?type=expense")}
            className="flex-1 bg-rose-500 py-3.5 px-3 rounded-2xl items-center justify-center flex-row gap-2 shadow-md shadow-rose-900/20 active:opacity-90"
          >
            <Plus size={18} color="#ffffff" strokeWidth={2.5} />
            <Text className="text-white font-bold text-xs">Add Expense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/transaction/new?type=income")}
            className="flex-1 bg-emerald-600 py-3.5 px-3 rounded-2xl items-center justify-center flex-row gap-2 shadow-md shadow-emerald-900/20 active:opacity-90"
          >
            <ArrowDownLeft size={18} color="#ffffff" strokeWidth={2.5} />
            <Text className="text-white font-bold text-xs">Add Income</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/transaction/new?type=transfer")}
            className="py-3.5 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl items-center justify-center flex-row gap-1.5 shadow-sm"
          >
            <ArrowLeftRight size={16} color="#3b82f6" />
            <Text className="text-slate-800 dark:text-slate-200 font-bold text-xs">Transfer</Text>
          </TouchableOpacity>
        </View>

        {/* 1-Tap Quick Routine Templates */}
        <View className="mb-5">
          <View className="flex-row items-center gap-1.5 mb-2">
            <Sparkles size={14} color="#059669" />
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              1-Tap Frequent Expenses
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {QUICK_EXPENSE_TEMPLATES.map((tmpl) => {
              const IconComp = tmpl.icon;
              return (
                <TouchableOpacity
                  key={tmpl.label}
                  onPress={() => handleInstantTemplate(tmpl)}
                  className="px-3.5 py-2.5 bg-white dark:bg-slate-900 rounded-2xl mr-2 border border-slate-200 dark:border-slate-800 flex-row items-center gap-2 shadow-sm active:scale-95"
                >
                  <View className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                    <IconComp size={14} color="#10b981" />
                  </View>
                  <View>
                    <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {tmpl.label}
                    </Text>
                    <Text className="text-xs text-rose-600 font-bold">
                      -₹{tmpl.amount}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Weekly Calendar Strip (Calendar Context at a glance) */}
        <Card className="mb-5 p-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-1.5">
              <Calendar size={16} color="#10b981" />
              <Subheading className="text-sm">This Week's Pace</Subheading>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/calendar")}>
              <Text className="text-xs font-bold text-emerald-600">Full Calendar →</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between items-center">
            {weekDays.map((w, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => router.push("/(tabs)/calendar")}
                className={`items-center py-2 px-2.5 rounded-2xl ${
                  w.isToday
                    ? "bg-emerald-600 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800/60"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    w.isToday ? "text-emerald-100" : "text-slate-400"
                  }`}
                >
                  {w.dayLabel}
                </Text>
                <Text
                  className={`text-sm font-extrabold mt-0.5 ${
                    w.isToday ? "text-white" : "text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {w.dayNum}
                </Text>
                <View
                  className={`w-1.5 h-1.5 rounded-full mt-1 ${
                    w.hasSpend
                      ? w.isToday
                        ? "bg-white"
                        : "bg-rose-500"
                      : "opacity-0"
                  }`}
                />
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Budget Progress & Daily Safe Pace */}
        {totalBudgetPaise > 0 && (
          <Card className="mb-5 p-4">
            <View className="flex-row items-center justify-between mb-2">
              <Subheading className="text-sm">Monthly Budget Goal</Subheading>
              <Badge
                label={`${budgetUtilizationPercent}% Spent`}
                variant={budgetUtilizationPercent > 90 ? "danger" : "success"}
                size="sm"
              />
            </View>

            <View className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden my-2">
              <View
                className={`h-2.5 rounded-full ${
                  budgetUtilizationPercent > 90 ? "bg-rose-500" : "bg-emerald-500"
                }`}
                style={{ width: `${budgetUtilizationPercent}%` }}
              />
            </View>

            <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <View>
                <Text className="text-xs text-slate-400">Safe Daily Allowance</Text>
                <Text className="text-xs text-slate-500 font-medium">{daysRemaining} days left</Text>
              </View>
              <Text className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                {formatCurrencyFromPaise(dailyPacePaise)} / day
              </Text>
            </View>
          </Card>
        )}

        {/* Category Breakdown (Donut Progress) */}
        {categoryBreakdown.length > 0 && (
          <Card className="mb-5 p-4">
            <Subheading className="text-sm mb-3">Top Expenses by Category</Subheading>
            {categoryBreakdown.map((cat) => (
              <View key={cat.id} className="mb-3">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color || "#10b981" }}
                    />
                    <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {cat.name}
                    </Text>
                  </View>
                  <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrencyFromPaise(cat.spentPaise)} ({cat.percent}%)
                  </Text>
                </View>
                <View className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <View
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${cat.percent}%`,
                      backgroundColor: cat.color || "#10b981",
                    }}
                  />
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Recent Transactions */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Subheading className="text-base">Recent Ledger Activity</Subheading>
            <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
              <Text className="text-xs font-bold text-emerald-600">See All →</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length === 0 ? (
            <Card className="items-center py-8">
              <Receipt size={24} color="#94a3b8" />
              <Caption className="text-center mt-2">No recorded activity yet.</Caption>
            </Card>
          ) : (
            recentTransactions.map((tx) => {
              const isIncome = tx.type === "income";
              const isTransfer = tx.type === "transfer";
              return (
                <Card key={tx.id} className="p-3.5 mb-2.5 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`w-10 h-10 rounded-2xl items-center justify-center ${
                        isIncome
                          ? "bg-emerald-100 dark:bg-emerald-950"
                          : isTransfer
                          ? "bg-blue-100 dark:bg-blue-950"
                          : "bg-rose-100 dark:bg-rose-950"
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft size={18} color="#10b981" />
                      ) : isTransfer ? (
                        <ArrowLeftRight size={18} color="#3b82f6" />
                      ) : (
                        <ArrowUpRight size={18} color="#ef4444" />
                      )}
                    </View>
                    <View>
                      <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {tx.description}
                      </Text>
                      <Text className="text-xs text-slate-400">
                        {tx.account?.name || "Account"} •{" "}
                        {new Date(tx.transaction_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </Text>
                    </View>
                  </View>

                  <FinancialAmount
                    amountPaise={tx.amount_paise}
                    type={isIncome ? "income" : isTransfer ? "neutral" : "expense"}
                    prefix={isIncome ? "+" : isTransfer ? "" : "-"}
                    className="text-sm font-bold"
                  />
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button (FAB) - Always accessible right upon app launch */}
      <TouchableOpacity
        onPress={() => router.push("/transaction/new")}
        className="absolute bottom-6 right-6 w-14 h-14 bg-emerald-600 rounded-full items-center justify-center shadow-2xl shadow-emerald-900 border border-emerald-400 active:scale-90"
        style={{ elevation: 8 }}
      >
        <Plus size={26} color="#ffffff" strokeWidth={2.5} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
