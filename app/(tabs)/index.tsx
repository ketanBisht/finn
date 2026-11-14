import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  Fuel,
  Wallet,
  Building2,
  Coins,
  ChevronRight,
  TrendingDown,
  ShieldCheck,
  PieChart,
} from "lucide-react-native";
import { Heading, Subheading, Caption, FinancialAmount } from "@/components/ui/typography";
import { useFinanceStore } from "@/store/useFinanceStore";
import { formatCurrencyFromPaise, formatLocalDate, rupeesToPaise } from "@/lib/utils";

// Instant 1-tap template chips
const QUICK_EXPENSE_TEMPLATES = [
  { label: "Chai / Tea", amount: 20, icon: Coffee, catName: "Food" },
  { label: "Metro / Auto", amount: 50, icon: Train, catName: "Transportation" },
  { label: "Lunch", amount: 150, icon: Utensils, catName: "Food" },
  { label: "Groceries", amount: 500, icon: ShoppingBag, catName: "Groceries" },
  { label: "Fuel / Petrol", amount: 200, icon: Fuel, catName: "Transportation" },
];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [hideBalances, setHideBalances] = useState(false);

  const accounts = useFinanceStore((s) => s.accounts);
  const transactions = useFinanceStore((s) => s.transactions);
  const budgets = useFinanceStore((s) => s.budgets);
  const categories = useFinanceStore((s) => s.categories);
  const addTransaction = useFinanceStore((s) => s.addTransaction);
  const overallMonthlyBudgets = useFinanceStore((s) => s.overallMonthlyBudgets);

  // 1. Total Net Balance across all accounts
  const totalBalancePaise = accounts.reduce(
    (sum, acc) => sum + (acc.is_active ? acc.current_balance_paise : 0),
    0
  );

  // 2. Current Month Calculations
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Dynamic friendly greeting based on time of day
  const currentHour = now.getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 17
      ? "Good afternoon"
      : "Good evening";

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
  const monthKey = `${currentYear}-${currentMonth + 1}`;
  const totalBudgetPaise =
    overallMonthlyBudgets[monthKey] ??
    budgets
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
    <View style={{ flex: 1, backgroundColor: "#F7F7F5" }}>
      {/* Top Header - Guaranteed Notch & Status Bar Clearance */}
      <View
        style={{
          paddingTop: Math.max(insets.top, Platform.OS === "android" ? 44 : 20),
          paddingHorizontal: 20,
          paddingBottom: 10,
          backgroundColor: "#F7F7F5",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-[#121214] items-center justify-center border-2 border-[#FFC83B]">
            <Text className="text-[#FFC83B] font-black text-sm">KB</Text>
          </View>
          <View>
            <Text className="text-[11px] font-bold text-[#71717A] tracking-wider uppercase">
              {greeting}, Ketan
            </Text>
            <Text className="text-base font-black text-[#121214]">
              {now.toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => setHideBalances(!hideBalances)}
            className="w-10 h-10 bg-white rounded-full items-center justify-center border border-[#EAEAE5] shadow-sm"
          >
            {hideBalances ? (
              <EyeOff size={17} color="#71717A" />
            ) : (
              <Eye size={17} color="#71717A" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/settings")}
            className="w-10 h-10 bg-white rounded-full items-center justify-center border border-[#EAEAE5] shadow-sm"
          >
            <Settings size={17} color="#71717A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: Crisp White Balance & Cash Flow Card */}
        <View className="bg-white rounded-[28px] p-5 mb-4 border border-[#EAEAE5] shadow-sm">
          {/* Header Row */}
          <View className="flex-row items-center justify-between mb-1.5">
            <Text className="text-[#71717A] text-[11px] font-extrabold uppercase tracking-wider">
              Total Net Worth
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/accounts")}
              className="flex-row items-center gap-1.5 bg-[#F7F7F5] px-2.5 py-1 rounded-full border border-[#EAEAE5]"
            >
              <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <Text className="text-[#121214] text-[11px] font-bold">
                {accounts.length} Accounts
              </Text>
            </TouchableOpacity>
          </View>

          {/* Main Balance Display */}
          {hideBalances ? (
            <Text className="text-[#121214] text-3xl font-black mb-4">₹ ••••••••</Text>
          ) : (
            <FinancialAmount
              amountPaise={totalBalancePaise}
              type="neutral"
              prefix="₹"
              className="text-[#121214] text-3xl font-black mb-4"
            />
          )}

          {/* Monthly In / Out / Net Mini-Strip */}
          <View className="flex-row items-center justify-between py-3 px-3.5 bg-[#F7F7F5] rounded-2xl mb-4 border border-[#EAEAE5]">
            <View>
              <View className="flex-row items-center gap-1">
                <ArrowDownLeft size={13} color="#10B981" strokeWidth={2.4} />
                <Text className="text-[11px] font-bold text-[#71717A]">Income</Text>
              </View>
              {hideBalances ? (
                <Text className="text-[#121214] text-xs font-black mt-0.5">₹ ••••</Text>
              ) : (
                <FinancialAmount
                  amountPaise={monthlyIncomePaise}
                  type="income"
                  showDecimals={false}
                  className="text-xs font-black mt-0.5"
                />
              )}
            </View>

            <View className="w-[1px] h-6 bg-[#EAEAE5]" />

            <View>
              <View className="flex-row items-center gap-1">
                <ArrowUpRight size={13} color="#EF4444" strokeWidth={2.4} />
                <Text className="text-[11px] font-bold text-[#71717A]">Expenses</Text>
              </View>
              {hideBalances ? (
                <Text className="text-[#121214] text-xs font-black mt-0.5">₹ ••••</Text>
              ) : (
                <FinancialAmount
                  amountPaise={monthlyExpensesPaise}
                  type="expense"
                  showDecimals={false}
                  className="text-xs font-black mt-0.5"
                />
              )}
            </View>

            <View className="w-[1px] h-6 bg-[#EAEAE5]" />

            <View>
              <View className="flex-row items-center gap-1">
                <ShieldCheck size={13} color="#B45309" strokeWidth={2.4} />
                <Text className="text-[11px] font-bold text-[#71717A]">Net Saved</Text>
              </View>
              {hideBalances ? (
                <Text className="text-[#121214] text-xs font-black mt-0.5">₹ ••••</Text>
              ) : (
                <FinancialAmount
                  amountPaise={netSavingsPaise}
                  type="income"
                  showDecimals={false}
                  className="text-xs font-black mt-0.5"
                />
              )}
            </View>
          </View>

          {/* 3 Prominent User-Friendly Action Buttons */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => router.push("/transaction/new?type=expense")}
              style={{
                flex: 1.2,
                backgroundColor: "#121214",
                paddingVertical: 12,
                borderRadius: 9999,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <ArrowUpRight size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={{ fontSize: 13, fontWeight: "900", color: "#FFFFFF" }}>
                Add Expense
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/transaction/new?type=income")}
              style={{
                flex: 1.1,
                backgroundColor: "#FFC83B",
                paddingVertical: 12,
                borderRadius: 9999,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <ArrowDownLeft size={16} color="#121214" strokeWidth={2.5} />
              <Text style={{ fontSize: 13, fontWeight: "900", color: "#121214" }}>
                Add Income
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/transaction/new?type=transfer")}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 14,
                backgroundColor: "#FFFFFF",
                borderRadius: 9999,
                borderWidth: 1,
                borderColor: "#EAEAE5",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowLeftRight size={16} color="#121214" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Wallets & Accounts Quick Strip */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2 px-1">
            <Text className="text-xs font-black text-[#121214] uppercase tracking-wider">
              My Accounts
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/accounts")}>
              <Text className="text-xs font-bold text-[#71717A]">Manage →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {accounts.map((acc) => {
              const isCash = acc.type === "cash";
              return (
                <TouchableOpacity
                  key={acc.id}
                  onPress={() => router.push("/(tabs)/accounts")}
                  className="bg-white rounded-2xl p-3 mr-2.5 border border-[#EAEAE5] flex-row items-center gap-2.5 shadow-sm min-w-[130px]"
                >
                  <View
                    className="w-8 h-8 rounded-xl items-center justify-center"
                    style={{ backgroundColor: isCash ? "#FFF4D2" : "#F7F7F5" }}
                  >
                    {isCash ? (
                      <Coins size={16} color="#B45309" strokeWidth={2.4} />
                    ) : (
                      <Building2 size={16} color="#121214" strokeWidth={2.4} />
                    )}
                  </View>
                  <View>
                    <Text className="text-[11px] font-bold text-[#71717A]" numberOfLines={1}>
                      {acc.name}
                    </Text>
                    {hideBalances ? (
                      <Text className="text-xs font-black text-[#121214]">₹ ••••</Text>
                    ) : (
                      <FinancialAmount
                        amountPaise={acc.current_balance_paise}
                        type="neutral"
                        showDecimals={false}
                        className="text-xs font-black text-[#121214]"
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Spend Intelligence & Analytics Shortcut */}
        <TouchableOpacity
          onPress={() => router.push("/analytics")}
          activeOpacity={0.8}
          style={{
            backgroundColor: "#121214",
            borderRadius: 22,
            paddingVertical: 12,
            paddingHorizontal: 16,
            marginBottom: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: "#FFC83B", alignItems: "center", justifyContent: "center" }}>
              <PieChart size={18} color="#121214" />
            </View>
            <View>
              <Text style={{ fontSize: 13, fontWeight: "900", color: "#FFFFFF" }}>
                Spend Intelligence & UPI Analytics
              </Text>
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#A1A1AA" }}>
                Platform breakdown • UPI vs Cards • Trends
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color="#FFC83B" />
        </TouchableOpacity>

        {/* Card 2: Proportionate, Sleek Warm Golden Budget Card */}
        {totalBudgetPaise > 0 && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/(tabs)/budgets")}
            style={{
              backgroundColor: "#F6CB68",
              borderRadius: 26,
              padding: 18,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#E8BC52",
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <View>
                <Text style={{ fontSize: 10, fontWeight: "800", color: "#121214", opacity: 0.7, textTransform: "uppercase" }}>
                  Monthly Budget Ceiling
                </Text>
                <Text style={{ fontSize: 14, fontWeight: "900", color: "#121214", marginTop: 1 }}>
                  {now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                </Text>
              </View>

              <View className="flex-row items-center gap-1.5">
                <View
                  style={{
                    backgroundColor: budgetUtilizationPercent > 90 ? "#EF4444" : "#10B981",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 9999,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: "900", color: "#FFFFFF" }}>
                    {budgetUtilizationPercent > 90 ? "High Spend" : "On Track"}
                  </Text>
                </View>
                <Text style={{ fontSize: 10, fontWeight: "800", color: "#121214", opacity: 0.7 }}>
                  Reality →
                </Text>
              </View>
            </View>

            {/* Daily Pace Hero Metric */}
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.6)",
                borderRadius: 18,
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <View>
                <Text style={{ fontSize: 10, fontWeight: "800", color: "#71717A", textTransform: "uppercase" }}>
                  Safe Daily Allowance
                </Text>
                <Text style={{ fontSize: 20, fontWeight: "900", color: "#121214", marginTop: 1 }}>
                  ₹{Math.round(dailyPacePaise / 100).toLocaleString("en-IN")}
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#71717A" }}> / day</Text>
                </Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#71717A" }}>
                  {daysRemaining} days left
                </Text>
                <Text style={{ fontSize: 13, fontWeight: "900", color: "#121214", marginTop: 1 }}>
                  {budgetUtilizationPercent}% Used
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={{ width: "100%", height: 6, backgroundColor: "rgba(0,0,0,0.1)", borderRadius: 3, overflow: "hidden", marginBottom: 12 }}>
              <View
                style={{
                  width: `${budgetUtilizationPercent}%`,
                  height: "100%",
                  backgroundColor: budgetUtilizationPercent > 90 ? "#EF4444" : "#121214",
                  borderRadius: 3,
                }}
              />
            </View>

            {/* Bottom 3 Pill Metrics */}
            <View style={{ flexDirection: "row", gap: 6 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 14,
                  paddingVertical: 7,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: "700", color: "#71717A" }}>Spent</Text>
                <Text style={{ fontSize: 12, fontWeight: "900", color: "#121214", marginTop: 1 }}>
                  ₹{Math.round(monthlyExpensesPaise / 100).toLocaleString("en-IN")}
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 14,
                  paddingVertical: 7,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: "700", color: "#71717A" }}>Available</Text>
                <Text style={{ fontSize: 12, fontWeight: "900", color: "#121214", marginTop: 1 }}>
                  ₹{Math.round(remainingBudgetPaise / 100).toLocaleString("en-IN")}
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 14,
                  paddingVertical: 7,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: "700", color: "#71717A" }}>Status</Text>
                <Text style={{ fontSize: 12, fontWeight: "900", color: "#121214", marginTop: 1 }}>
                  {remainingBudgetPaise > 0 ? "Under Limit" : "Over Budget"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* 1-Tap Quick Expenses (Faster habit recording) */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2 px-1">
            <Text className="text-xs font-black text-[#121214] uppercase tracking-wider">
              1-Tap Routine Expenses
            </Text>
            <Caption>Instant Log</Caption>
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
                    paddingHorizontal: 13,
                    backgroundColor: isFirst ? "#FFC83B" : "#FFFFFF",
                    borderRadius: 9999,
                    marginRight: 8,
                    borderWidth: 1,
                    borderColor: isFirst ? "#E8BC52" : "#EAEAE5",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 2,
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

        {/* Weekly Spend Activity Strip */}
        <View className="bg-white rounded-[26px] p-4 mb-4 border border-[#EAEAE5] shadow-sm">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <View className="flex-row items-center gap-1.5">
              <Calendar size={15} color="#121214" strokeWidth={2.4} />
              <Text className="text-xs font-black text-[#121214] uppercase tracking-wider">
                This Week's Activity
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/calendar")}>
              <Text className="text-xs font-bold text-[#D97706]">Full Calendar →</Text>
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

        {/* Top Spending Categories Breakdown */}
        {categoryBreakdown.length > 0 && (
          <View className="bg-white rounded-[26px] p-5 mb-4 border border-[#EAEAE5] shadow-sm">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-black text-[#121214] uppercase tracking-wider">
                Top Categories
              </Text>
              <Text className="text-xs font-bold text-[#71717A]">This Month</Text>
            </View>

            {categoryBreakdown.map((cat) => (
              <View key={cat.id} className="mb-3">
                <View className="flex-row items-center justify-between mb-1.5">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color || "#FFC83B" }}
                    />
                    <Text className="text-xs font-bold text-[#121214]">
                      {cat.name}
                    </Text>
                  </View>
                  <Text className="text-xs font-black text-[#121214]">
                    {formatCurrencyFromPaise(cat.spentPaise)} ({cat.percent}%)
                  </Text>
                </View>
                <View className="w-full bg-[#F0EFEA] rounded-full h-2 overflow-hidden">
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
            <Text className="text-xs font-black text-[#121214] uppercase tracking-wider">
              Recent Transactions
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
              <Text className="text-xs font-bold text-[#D97706]">View All →</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length === 0 ? (
            <View className="bg-white rounded-[24px] items-center py-8 border border-[#EAEAE5]">
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
                  className="bg-white rounded-[20px] p-3.5 mb-2.5 flex-row items-center justify-between border border-[#EAEAE5] shadow-sm"
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 14,
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
                        <ArrowDownLeft size={17} color="#10B981" strokeWidth={2.4} />
                      ) : isTransfer ? (
                        <ArrowLeftRight size={17} color="#3B82F6" strokeWidth={2.4} />
                      ) : (
                        <ArrowUpRight size={17} color="#EF4444" strokeWidth={2.4} />
                      )}
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-[#121214]">
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
    </View>
  );
}
