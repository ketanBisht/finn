import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
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
  Settings,
  Receipt,
  ChevronRight,
  HandCoins,
  Repeat,
  Clock,
} from "lucide-react-native";
import { Caption, FinancialAmount } from "@/components/ui/typography";
import { useFinanceStore } from "@/store/useFinanceStore";
import { useAuthStore } from "@/store/useAuthStore";
import { formatCurrencyFromPaise, daysUntil } from "@/lib/utils";
import { WageLogo } from "@/components/ui/wage-logo";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [hideBalances, setHideBalances] = useState(false);
  const profile = useAuthStore((s) => s.profile);

  const accounts = useFinanceStore((s) => s.accounts);
  const transactions = useFinanceStore((s) => s.transactions);
  const budgets = useFinanceStore((s) => s.budgets);
  const overallMonthlyBudgets = useFinanceStore((s) => s.overallMonthlyBudgets);
  const debts = useFinanceStore((s) => s.debts);
  const subscriptions = useFinanceStore((s) => s.subscriptions);

  const pendingDebts = debts.filter((d) => d.status !== "settled");
  const lentTotal = pendingDebts
    .filter((d) => d.direction === "given")
    .reduce((s, d) => s + (d.amount_paise - d.settled_paise), 0);
  const borrowedTotal = pendingDebts
    .filter((d) => d.direction === "taken")
    .reduce((s, d) => s + (d.amount_paise - d.settled_paise), 0);

  const activeSubscriptions = subscriptions.filter((s) => s.status === "active");
  const upcomingBills = activeSubscriptions
    .filter((s) => daysUntil(s.next_billing_date) <= 7)
    .sort(
      (a, b) =>
        new Date(a.next_billing_date).getTime() -
        new Date(b.next_billing_date).getTime()
    );
  const totalMonthlySubsPaise = activeSubscriptions.reduce((sum, s) => {
    if (s.billing_cycle === "weekly") return sum + s.amount_paise * 4.33;
    if (s.billing_cycle === "quarterly") return sum + s.amount_paise / 3;
    if (s.billing_cycle === "yearly") return sum + s.amount_paise / 12;
    return sum + s.amount_paise;
  }, 0);

  // 1. Total Net Balance across active accounts
  const totalBalancePaise = accounts.reduce(
    (sum, acc) => sum + (acc.is_active ? acc.current_balance_paise : 0),
    0
  );

  // 2. Current Month Calculations
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const greeting =
    now.getHours() < 12
      ? "Good morning"
      : now.getHours() < 17
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

  // 3. Top-Down Budget Ceiling & Safe Pace
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

  const recentTransactions = transactions.slice(0, 5);

  return (
    <View style={{ flex: 1, backgroundColor: "#F7F7F5" }}>
      {/* Top Header - Guaranteed Notch Clearance */}
      <View
        style={{
          paddingTop: Math.max(insets.top, Platform.OS === "android" ? 44 : 20),
          paddingHorizontal: 20,
          paddingBottom: 12,
          backgroundColor: "#F7F7F5",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left: Authentic Wage Logo & Greeting */}
        <View className="flex-row items-center gap-3">
          <WageLogo size={36} />
          <View>
            <Text className="text-[11px] font-bold text-[#71717A] tracking-wider uppercase">
              {greeting}, {profile?.name ? profile.name.split(" ")[0] : "there"}
            </Text>
            <Text className="text-sm font-black text-[#121214]">
              {now.toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </Text>
          </View>
        </View>

        {/* Right: Minimalist Action Icons */}
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => setHideBalances(!hideBalances)}
            className="w-9 h-9 bg-white rounded-full items-center justify-center border border-[#EAEAE5]"
            activeOpacity={0.7}
          >
            {hideBalances ? (
              <EyeOff size={16} color="#71717A" />
            ) : (
              <Eye size={16} color="#71717A" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/settings")}
            className="w-9 h-9 bg-white rounded-full items-center justify-center border border-[#EAEAE5]"
            activeOpacity={0.7}
          >
            <Settings size={16} color="#71717A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Hero Wealth & Cash Flow Card */}
        <View className="bg-white rounded-[26px] p-6 mb-4 border border-[#EAEAE5] shadow-sm">
          <Caption className="mb-1 text-[#71717A]">TOTAL BALANCE</Caption>

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

          {/* Simple Cashflow Summary Row */}
          <View className="flex-row items-center justify-between py-2.5 px-3 bg-[#F7F7F5] rounded-xl mb-5 border border-[#EAEAE5]">
            <View>
              <Text className="text-[10px] font-bold text-[#71717A] uppercase">Income</Text>
              {hideBalances ? (
                <Text className="text-xs font-black text-[#121214] mt-0.5">₹ ••••</Text>
              ) : (
                <Text className="text-xs font-black text-emerald-600 mt-0.5">
                  +{formatCurrencyFromPaise(monthlyIncomePaise)}
                </Text>
              )}
            </View>

            <View className="w-[1px] h-5 bg-[#EAEAE5]" />

            <View>
              <Text className="text-[10px] font-bold text-[#71717A] uppercase">Spent</Text>
              {hideBalances ? (
                <Text className="text-xs font-black text-[#121214] mt-0.5">₹ ••••</Text>
              ) : (
                <Text className="text-xs font-black text-[#121214] mt-0.5">
                  -{formatCurrencyFromPaise(monthlyExpensesPaise)}
                </Text>
              )}
            </View>

            <View className="w-[1px] h-5 bg-[#EAEAE5]" />

            <View>
              <Text className="text-[10px] font-bold text-[#71717A] uppercase">Saved</Text>
              {hideBalances ? (
                <Text className="text-xs font-black text-[#121214] mt-0.5">₹ ••••</Text>
              ) : (
                <Text className="text-xs font-black text-amber-600 mt-0.5">
                  {formatCurrencyFromPaise(netSavingsPaise)}
                </Text>
              )}
            </View>
          </View>

          {/* Clean Primary Actions */}
          <View className="flex-row gap-2.5">
            <TouchableOpacity
              onPress={() => router.push("/transaction/new?type=expense")}
              activeOpacity={0.85}
              style={{
                flex: 1,
                backgroundColor: "#121214",
                paddingVertical: 12,
                borderRadius: 9999,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <ArrowUpRight size={15} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={{ fontSize: 13, fontWeight: "800", color: "#FFFFFF" }}>
                Expense
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/transaction/new?type=income")}
              activeOpacity={0.85}
              style={{
                flex: 1,
                backgroundColor: "#FFBD59",
                paddingVertical: 12,
                borderRadius: 9999,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <ArrowDownLeft size={15} color="#121214" strokeWidth={2.4} />
              <Text style={{ fontSize: 13, fontWeight: "800", color: "#121214" }}>
                Income
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/transaction/new?type=transfer")}
              activeOpacity={0.85}
              style={{
                width: 44,
                height: 44,
                backgroundColor: "#F7F7F5",
                borderRadius: 22,
                borderWidth: 1,
                borderColor: "#EAEAE5",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowLeftRight size={15} color="#121214" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Minimalist Monthly Budget Snapshot */}
        {totalBudgetPaise > 0 && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/(tabs)/budgets")}
            className="bg-white rounded-[24px] p-5 mb-4 border border-[#EAEAE5] shadow-sm"
          >
            <View className="flex-row items-center justify-between mb-2">
              <View>
                <Text className="text-xs font-black text-[#121214] uppercase tracking-wider">
                  {now.toLocaleDateString("en-IN", { month: "long" })} Budget
                </Text>
                <Text className="text-xs text-[#71717A] mt-0.5">
                  {formatCurrencyFromPaise(monthlyExpensesPaise)} of {formatCurrencyFromPaise(totalBudgetPaise)}
                </Text>
              </View>

              <View className="flex-row items-center gap-1">
                <Text className="text-xs font-black text-[#121214]">
                  {budgetUtilizationPercent}%
                </Text>
                <ChevronRight size={14} color="#71717A" />
              </View>
            </View>

            {/* Hairline Progress Bar */}
            <View className="w-full bg-[#F0EFEA] rounded-full h-2 overflow-hidden my-2">
              <View
                className="h-2 rounded-full"
                style={{
                  width: `${budgetUtilizationPercent}%`,
                  backgroundColor: budgetUtilizationPercent > 90 ? "#EF4444" : "#FFBD59",
                }}
              />
            </View>

            <View className="flex-row justify-between items-center mt-1">
              <Text className="text-[11px] font-bold text-[#71717A]">
                {formatCurrencyFromPaise(remainingBudgetPaise)} remaining
              </Text>
              <Text className="text-[11px] font-bold text-[#71717A]">
                Safe pace: {formatCurrencyFromPaise(dailyPacePaise)}/day
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Debts Snapshot Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/(tabs)/debts")}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#EAEAE5",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 3,
            elevation: 1,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <HandCoins size={16} color="#B45309" />
              <Text style={{ fontSize: 12, fontWeight: "900", color: "#121214", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Debts & Udhar
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#71717A" }}>
                {pendingDebts.length} active
              </Text>
              <ChevronRight size={14} color="#71717A" />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1, backgroundColor: "#E6FBF2", borderRadius: 14, padding: 10 }}>
              <Text style={{ fontSize: 10, fontWeight: "800", color: "#059669", textTransform: "uppercase" }}>
                You Lent
              </Text>
              <Text style={{ fontSize: 14, fontWeight: "900", color: "#059669", marginTop: 2 }}>
                {formatCurrencyFromPaise(lentTotal)}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: "#FEECEB", borderRadius: 14, padding: 10 }}>
              <Text style={{ fontSize: 10, fontWeight: "800", color: "#DC2626", textTransform: "uppercase" }}>
                You Owe
              </Text>
              <Text style={{ fontSize: 14, fontWeight: "900", color: "#DC2626", marginTop: 2 }}>
                {formatCurrencyFromPaise(borrowedTotal)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Subscriptions & Recurring Bills Snapshot */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/subscriptions")}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#EAEAE5",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 3,
            elevation: 1,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Repeat size={16} color="#4F46E5" />
              <Text style={{ fontSize: 12, fontWeight: "900", color: "#121214", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Subscriptions & Bills
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#71717A" }}>
                {activeSubscriptions.length} active
              </Text>
              <ChevronRight size={14} color="#71717A" />
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#F7F7F5",
              borderRadius: 14,
              padding: 12,
              borderWidth: 1,
              borderColor: "#EAEAE5",
              marginBottom: upcomingBills.length > 0 ? 10 : 0,
            }}
          >
            <View>
              <Text style={{ fontSize: 10, fontWeight: "800", color: "#71717A", textTransform: "uppercase" }}>
                Monthly Commitment
              </Text>
              <Text style={{ fontSize: 15, fontWeight: "900", color: "#121214", marginTop: 2 }}>
                {formatCurrencyFromPaise(Math.round(totalMonthlySubsPaise), { showDecimals: false })}
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#71717A" }}>/mo</Text>
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 10, fontWeight: "800", color: "#71717A", textTransform: "uppercase" }}>
                Due in 7 Days
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "900",
                  color: upcomingBills.length > 0 ? "#D97706" : "#059669",
                  marginTop: 2,
                }}
              >
                {upcomingBills.length > 0 ? `${upcomingBills.length} upcoming` : "All clear"}
              </Text>
            </View>
          </View>

          {upcomingBills.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 2 }}>
              {upcomingBills.map((bill) => {
                const days = daysUntil(bill.next_billing_date);
                const tag = days <= 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days}d`;
                return (
                  <View
                    key={bill.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: "#FFFBEB",
                      borderColor: "#FDE68A",
                      borderWidth: 1,
                      paddingVertical: 5,
                      paddingHorizontal: 10,
                      borderRadius: 12,
                      marginRight: 8,
                    }}
                  >
                    <Clock size={11} color="#D97706" />
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#121214" }}>
                      {bill.name}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: "800", color: "#D97706" }}>
                      {formatCurrencyFromPaise(bill.amount_paise, { showDecimals: false })}
                    </Text>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: "#92400E" }}>
                      ({tag})
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </TouchableOpacity>

        {/* 3. Recent Activity (Clean & Uncluttered) */}
        <View className="mb-2">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-xs font-black text-[#121214] uppercase tracking-wider">
              Recent Activity
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
              <Text className="text-xs font-bold text-[#71717A]">View All →</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length === 0 ? (
            <View className="bg-white rounded-[22px] items-center py-8 border border-[#EAEAE5]">
              <Receipt size={22} color="#A1A1AA" />
              <Caption className="text-center mt-2">No recorded transactions yet.</Caption>
            </View>
          ) : (
            recentTransactions.map((tx) => {
              const isIncome = tx.type === "income";
              const isTransfer = tx.type === "transfer";
              return (
                <View
                  key={tx.id}
                  className="bg-white rounded-[18px] p-3.5 mb-2 flex-row items-center justify-between border border-[#EAEAE5]"
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
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
                        <ArrowDownLeft size={16} color="#10B981" strokeWidth={2.4} />
                      ) : isTransfer ? (
                        <ArrowLeftRight size={16} color="#3B82F6" strokeWidth={2.4} />
                      ) : (
                        <ArrowUpRight size={16} color="#EF4444" strokeWidth={2.4} />
                      )}
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-[#121214]">
                        {tx.description}
                      </Text>
                      <Text className="text-[11px] text-[#71717A]">
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
                    className="text-xs font-black"
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
