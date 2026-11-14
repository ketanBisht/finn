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
  Zap,
  TrendingUp,
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

  const netSavingsPaise = Math.max(0, monthlyIncomePaise - monthlyExpensesPaise);

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
      dayLabel: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"][idx],
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
    <SafeAreaView className="flex-1 bg-[#F7F7F5] dark:bg-[#0E0E10]" edges={["top"]}>
      {/* Top Header - User Avatar & Greetings */}
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-[#121214] items-center justify-center border-2 border-[#FFC83B]">
            <Text className="text-[#FFC83B] font-black text-sm">KB</Text>
          </View>
          <View>
            <Text className="text-xs font-bold text-[#71717A] tracking-wider uppercase">
              Hey, Ketan
            </Text>
            <Text className="text-base font-black text-[#121214] dark:text-[#F4F4F5]">
              Finn Cockpit
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => setHideBalances(!hideBalances)}
            className="w-10 h-10 bg-white dark:bg-charcoal-900 rounded-full items-center justify-center border border-[#EAEAE5] dark:border-charcoal-800 shadow-sm"
          >
            {hideBalances ? (
              <EyeOff size={16} color="#71717A" />
            ) : (
              <Eye size={16} color="#71717A" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/settings")}
            className="w-10 h-10 bg-white dark:bg-charcoal-900 rounded-full items-center justify-center border border-[#EAEAE5] dark:border-charcoal-800 shadow-sm"
          >
            <Settings size={16} color="#71717A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: Crisp White Dual Balance Card with Pill Action Buttons */}
        <View className="bg-white dark:bg-charcoal-900 rounded-[28px] p-5 mb-4 border border-[#EAEAE5] dark:border-charcoal-800 shadow-sm">
          {/* Two-Column Balances */}
          <View className="flex-row justify-between items-start mb-5">
            <View className="flex-1">
              <Text className="text-[#71717A] text-xs font-bold uppercase tracking-wider mb-1">
                Current Balance
              </Text>
              {hideBalances ? (
                <Text className="text-[#121214] dark:text-white text-2xl font-black">₹ ••••••••</Text>
              ) : (
                <FinancialAmount
                  amountPaise={totalBalancePaise}
                  type="neutral"
                  prefix="₹"
                  className="text-[#121214] dark:text-white text-2xl font-black"
                />
              )}
            </View>

            <View className="flex-1 items-end">
              <Text className="text-[#71717A] text-xs font-bold uppercase tracking-wider mb-1">
                Monthly Savings
              </Text>
              {hideBalances ? (
                <Text className="text-[#121214] dark:text-white text-2xl font-black">₹ ••••</Text>
              ) : (
                <FinancialAmount
                  amountPaise={netSavingsPaise}
                  type="income"
                  prefix="₹"
                  className="text-emerald-600 dark:text-emerald-400 text-2xl font-black"
                />
              )}
            </View>
          </View>

          {/* Dual Pill Action Buttons (Matches Deposit / Withdraw from reference) */}
          <View className="flex-row gap-2.5">
            <TouchableOpacity
              onPress={() => router.push("/transaction/new?type=income")}
              style={{
                flex: 1,
                backgroundColor: "#FFC83B",
                paddingVertical: 13,
                paddingHorizontal: 16,
                borderRadius: 9999,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <ArrowDownLeft size={16} color="#121214" strokeWidth={2.5} />
              <Text style={{ fontSize: 13, fontWeight: "800", color: "#121214" }}>
                Add Income
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/transaction/new?type=expense")}
              style={{
                flex: 1,
                backgroundColor: "#121214",
                paddingVertical: 13,
                paddingHorizontal: 16,
                borderRadius: 9999,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <ArrowUpRight size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={{ fontSize: 13, fontWeight: "800", color: "#FFFFFF" }}>
                Add Expense
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Horizontal Filter / Routine Chips (Inspired by "Top Events" in screenshot) */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-black text-[#121214] dark:text-[#F4F4F5] uppercase tracking-wider">
              Quick Expenses
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
              <Text className="text-xs font-bold text-[#71717A]">Ledger →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {QUICK_EXPENSE_TEMPLATES.map((tmpl, idx) => {
              const IconComp = tmpl.icon;
              const isFirst = idx === 0;
              return (
                <TouchableOpacity
                  key={tmpl.label}
                  onPress={() => handleInstantTemplate(tmpl)}
                  style={{
                    paddingVertical: 9,
                    paddingHorizontal: 14,
                    backgroundColor: isFirst ? "#FFC83B" : "#FFFFFF",
                    borderRadius: 9999,
                    marginRight: 8,
                    borderWidth: 1,
                    borderColor: isFirst ? "#E8BC52" : "#EAEAE5",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <IconComp size={14} color="#121214" strokeWidth={2.4} />
                  <Text style={{ fontSize: 12, fontWeight: "800", color: "#121214" }}>
                    {tmpl.label}
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#121214", opacity: 0.8 }}>
                    ₹{tmpl.amount}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Card 2: Warm Amber Golden Hero Card (The signature matchday card from the screenshot!) */}
        <View
          style={{
            backgroundColor: "#F6CB68",
            borderRadius: 28,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#E8BC52",
          }}
        >
          {/* Top tag & Ongoing pill */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#121214", opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.6 }}>
                Monthly Budget Cockpit
              </Text>
              <Text style={{ fontSize: 15, fontWeight: "900", color: "#121214", marginTop: 2 }}>
                {now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: budgetUtilizationPercent > 90 ? "#EF4444" : "#10B981",
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 9999,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#FFFFFF" }}>
                {budgetUtilizationPercent > 90 ? "High Spend" : "On Track"}
              </Text>
            </View>
          </View>

          {/* Center focal stats (styled like the 2 : 1 match score in the screenshot) */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(0,0,0,0.08)",
              marginBottom: 14,
            }}
          >
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#121214", opacity: 0.7 }}>
                Spent
              </Text>
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#121214", marginTop: 2 }}>
                ₹{Math.round(monthlyExpensesPaise / 100).toLocaleString("en-IN")}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "rgba(0,0,0,0.06)",
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 16,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "800", color: "#121214", opacity: 0.6 }}>
                DAILY PACE
              </Text>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#121214" }}>
                ₹{Math.round(dailyPacePaise / 100).toLocaleString("en-IN")}
              </Text>
            </View>

            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#121214", opacity: 0.7 }}>
                Remaining
              </Text>
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#121214", marginTop: 2 }}>
                ₹{Math.round(remainingBudgetPaise / 100).toLocaleString("en-IN")}
              </Text>
            </View>
          </View>

          {/* Bottom Odds/Metric Pills (Matches 1x 1.8, x 2.0, 2x 6.0 pill tags from screenshot) */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                paddingVertical: 8,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#71717A" }}>Days Left</Text>
              <Text style={{ fontSize: 13, fontWeight: "900", color: "#121214", marginTop: 1 }}>
                {daysRemaining}d
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                paddingVertical: 8,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#71717A" }}>Burn Rate</Text>
              <Text style={{ fontSize: 13, fontWeight: "900", color: "#121214", marginTop: 1 }}>
                {budgetUtilizationPercent}%
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                paddingVertical: 8,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#71717A" }}>Status</Text>
              <Text style={{ fontSize: 13, fontWeight: "900", color: "#121214", marginTop: 1 }}>
                {remainingBudgetPaise > 0 ? "Under Limit" : "Over Budget"}
              </Text>
            </View>
          </View>
        </View>

        {/* Weekly Pace Strip (Clean Calendar Rhythm) */}
        <View className="bg-white dark:bg-charcoal-900 rounded-[28px] p-4 mb-4 border border-[#EAEAE5] dark:border-charcoal-800 shadow-sm">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <View className="flex-row items-center gap-1.5">
              <Calendar size={15} color="#121214" strokeWidth={2.4} />
              <Text className="text-xs font-black text-[#121214] dark:text-[#F4F4F5] uppercase tracking-wider">
                This Week's Activity
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/calendar")}>
              <Text className="text-xs font-bold text-[#FFC83B] dark:text-[#FFC83B]">Full Calendar →</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between items-center">
            {weekDays.map((w, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => router.push("/(tabs)/calendar")}
                style={{
                  alignItems: "center",
                  paddingVertical: 8,
                  paddingHorizontal: 9,
                  borderRadius: 18,
                  backgroundColor: w.isToday ? "#FFC83B" : "#F7F7F5",
                  minWidth: 40,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "800",
                    color: w.isToday ? "#121214" : "#71717A",
                  }}
                >
                  {w.dayLabel}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "900",
                    marginTop: 2,
                    color: "#121214",
                  }}
                >
                  {w.dayNum}
                </Text>
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    marginTop: 4,
                    backgroundColor: w.hasSpend
                      ? w.isToday
                        ? "#121214"
                        : "#EF4444"
                      : "transparent",
                  }}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Top Spending Categories */}
        {categoryBreakdown.length > 0 && (
          <View className="bg-white dark:bg-charcoal-900 rounded-[28px] p-5 mb-4 border border-[#EAEAE5] dark:border-charcoal-800 shadow-sm">
            <Text className="text-xs font-black text-[#121214] dark:text-[#F4F4F5] uppercase tracking-wider mb-3">
              Top Expenses by Category
            </Text>
            {categoryBreakdown.map((cat) => (
              <View key={cat.id} className="mb-3">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color || "#FFC83B" }}
                    />
                    <Text className="text-xs font-bold text-[#121214] dark:text-[#F4F4F5]">
                      {cat.name}
                    </Text>
                  </View>
                  <Text className="text-xs font-bold text-[#71717A]">
                    {formatCurrencyFromPaise(cat.spentPaise)} ({cat.percent}%)
                  </Text>
                </View>
                <View className="w-full bg-[#F0EFEA] dark:bg-charcoal-800 rounded-full h-2 overflow-hidden">
                  <View
                    className="h-2 rounded-full"
                    style={{
                      width: `${cat.percent}%`,
                      backgroundColor: cat.color || "#FFC83B",
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recent Ledger Activity */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-xs font-black text-[#121214] dark:text-[#F4F4F5] uppercase tracking-wider">
              Recent Ledger
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
              <Text className="text-xs font-bold text-[#71717A]">See All →</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length === 0 ? (
            <View className="bg-white dark:bg-charcoal-900 rounded-[24px] items-center py-8 border border-[#EAEAE5] dark:border-charcoal-800">
              <Receipt size={24} color="#71717A" />
              <Caption className="text-center mt-2">No recorded activity yet.</Caption>
            </View>
          ) : (
            recentTransactions.map((tx) => {
              const isIncome = tx.type === "income";
              const isTransfer = tx.type === "transfer";
              return (
                <View
                  key={tx.id}
                  className="bg-white dark:bg-charcoal-900 rounded-[22px] p-3.5 mb-2.5 flex-row items-center justify-between border border-[#EAEAE5] dark:border-charcoal-800 shadow-sm"
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 16,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isIncome
                          ? "#E6FBF2"
                          : isTransfer
                          ? "#EBF4FF"
                          : "#FEECEB",
                      }}
                    >
                      {isIncome ? (
                        <ArrowDownLeft size={18} color="#10B981" />
                      ) : isTransfer ? (
                        <ArrowLeftRight size={18} color="#3B82F6" />
                      ) : (
                        <ArrowUpRight size={18} color="#EF4444" />
                      )}
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-[#121214] dark:text-[#F4F4F5]">
                        {tx.description}
                      </Text>
                      <Text className="text-xs text-[#71717A]">
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
                    className="text-sm font-black"
                  />
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
