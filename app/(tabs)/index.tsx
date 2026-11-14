import React, { useState } from "react";
import { View, ScrollView, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Plus,
  Receipt,
  ChevronRight,
} from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heading, Subheading, Body, Caption, FinancialAmount } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { useFinanceStore } from "@/store/useFinanceStore";
import { isSupabaseConfigured } from "@/lib/supabase";
import { formatCurrencyFromPaise } from "@/lib/utils";

export default function DashboardScreen() {
  const [hideBalances, setHideBalances] = useState(false);

  const accounts = useFinanceStore((s) => s.accounts);
  const transactions = useFinanceStore((s) => s.transactions);
  const budgets = useFinanceStore((s) => s.budgets);

  // 1. Total Net Balance across all accounts
  const totalBalancePaise = accounts.reduce(
    (sum, acc) => sum + (acc.is_active ? acc.current_balance_paise : 0),
    0
  );

  // 2. Monthly Calculations (Current Month)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

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

  // 3. Total Monthly Budget
  const totalBudgetPaise = budgets
    .filter((b) => b.month === currentMonth + 1 && b.year === currentYear)
    .reduce((sum, b) => sum + b.limit_amount_paise, 0);

  const remainingBudgetPaise = Math.max(0, totalBudgetPaise - monthlyExpensesPaise);
  const budgetUtilizationPercent =
    totalBudgetPaise > 0
      ? Math.min(100, Math.round((monthlyExpensesPaise / totalBudgetPaise) * 100))
      : 0;

  // Safe daily pace
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = new Date().getDate();
  const daysRemaining = Math.max(1, daysInMonth - today + 1);
  const dailyPacePaise = Math.round(remainingBudgetPaise / daysRemaining);

  const recentTransactions = transactions.slice(0, 5);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Bar */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Caption>FINN FINANCE</Caption>
            <Heading className="text-xl">Dashboard</Heading>
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => setHideBalances(!hideBalances)}
              className="p-2.5 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800"
            >
              {hideBalances ? (
                <EyeOff size={16} color="#64748b" />
              ) : (
                <Eye size={16} color="#64748b" />
              )}
            </TouchableOpacity>
            {isSupabaseConfigured ? (
              <Badge label="Cloud Active" variant="success" size="sm" />
            ) : (
              <Badge label="Local Mode" variant="info" size="sm" />
            )}
          </View>
        </View>

        {/* Net Worth Card */}
        <View className="bg-slate-900 rounded-3xl p-6 mb-5 shadow-xl border border-slate-800">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-slate-400 text-xs font-bold tracking-wider uppercase">
              Total Net Worth
            </Text>
            <Text className="text-emerald-400 text-xs font-semibold">
              {accounts.length} Accounts
            </Text>
          </View>

          {hideBalances ? (
            <Text className="text-white text-3xl font-extrabold mb-4 mt-1">₹ ••••••••</Text>
          ) : (
            <FinancialAmount
              amountPaise={totalBalancePaise}
              type="neutral"
              prefix="₹"
              className="text-white text-3xl font-extrabold mb-4"
            />
          )}

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
                <Text className="text-slate-400 text-xs font-medium">Spent</Text>
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

        {/* 3 Action Buttons: Expense, Income, Transfer */}
        <View className="flex-row gap-2.5 mb-5">
          <TouchableOpacity
            onPress={() => router.push("/transaction/new?type=expense")}
            className="flex-1 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 items-center justify-center flex-row gap-1.5"
          >
            <ArrowUpRight size={16} color="#ef4444" />
            <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">Expense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/transaction/new?type=income")}
            className="flex-1 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 items-center justify-center flex-row gap-1.5"
          >
            <ArrowDownLeft size={16} color="#10b981" />
            <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">Income</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/transaction/new?type=transfer")}
            className="flex-1 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 items-center justify-center flex-row gap-1.5"
          >
            <ArrowLeftRight size={16} color="#3b82f6" />
            <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">Transfer</Text>
          </TouchableOpacity>
        </View>

        {/* Monthly Budget & Daily Pace Card */}
        {totalBudgetPaise > 0 && (
          <Card className="mb-5">
            <View className="flex-row items-center justify-between mb-2">
              <Subheading className="text-base">Monthly Budget</Subheading>
              <Badge
                label={`${budgetUtilizationPercent}% Used`}
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

            <View className="flex-row justify-between mt-1">
              <Caption>Spent: {formatCurrencyFromPaise(monthlyExpensesPaise)}</Caption>
              <Caption>Budget: {formatCurrencyFromPaise(totalBudgetPaise)}</Caption>
            </View>

            {/* Daily Safe Pace */}
            <View className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-slate-500">Safe Daily Pace</Text>
                <Text className="text-xs text-slate-400">{daysRemaining} days left</Text>
              </View>
              <Text className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {formatCurrencyFromPaise(dailyPacePaise)} / day
              </Text>
            </View>
          </Card>
        )}

        {/* Recent Transactions List */}
        <View className="mb-5">
          <View className="flex-row items-center justify-between mb-3">
            <Subheading className="text-base">Recent Activity</Subheading>
            <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
              <Text className="text-xs font-bold text-emerald-600">View All</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length === 0 ? (
            <Card className="items-center py-8">
              <Receipt size={24} color="#94a3b8" />
              <Body className="text-xs text-slate-500 mt-2">No transactions recorded yet.</Body>
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
    </SafeAreaView>
  );
}
