import React, { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
} from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { Heading, Subheading, Caption, FinancialAmount } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { useFinanceStore } from "@/store/useFinanceStore";
import { formatCurrencyFromPaise, formatLocalDate } from "@/lib/utils";

const DAYS_OF_WEEK = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export default function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const transactions = useFinanceStore((s) => s.transactions);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days in month calculation
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDays = lastDayOfMonth.getDate();

  // Day of week offset for the 1st day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  // We align Monday = 0, ..., Sunday = 6
  let firstDayIndex = firstDayOfMonth.getDay() - 1;
  if (firstDayIndex === -1) firstDayIndex = 6;

  // Transactions mapped by YYYY-MM-DD using local time
  const transactionsByDate = useMemo(() => {
    const map: Record<
      string,
      { transactions: typeof transactions; expensePaise: number; incomePaise: number }
    > = {};

    transactions.forEach((tx) => {
      const dateKey = formatLocalDate(tx.transaction_date);
      if (!map[dateKey]) {
        map[dateKey] = { transactions: [], expensePaise: 0, incomePaise: 0 };
      }
      map[dateKey].transactions.push(tx);
      if (tx.type === "expense") {
        map[dateKey].expensePaise += tx.amount_paise;
      } else if (tx.type === "income") {
        map[dateKey].incomePaise += tx.amount_paise;
      }
    });

    return map;
  }, [transactions]);

  // Monthly aggregates
  const monthlyStats = useMemo(() => {
    let expenseTotal = 0;
    let incomeTotal = 0;
    let daysWithExpenses = 0;

    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      const dateKey = formatLocalDate(d);
      const dayData = transactionsByDate[dateKey];
      if (dayData) {
        expenseTotal += dayData.expensePaise;
        incomeTotal += dayData.incomePaise;
        if (dayData.expensePaise > 0) daysWithExpenses++;
      }
    }

    const dailyAveragePaise =
      daysWithExpenses > 0 ? Math.round(expenseTotal / daysWithExpenses) : 0;

    return { expenseTotal, incomeTotal, dailyAveragePaise, daysWithExpenses };
  }, [year, month, totalDays, transactionsByDate]);

  // Selected date key in local time
  const selectedDateKey = formatLocalDate(selectedDate);
  const selectedDayData = transactionsByDate[selectedDateKey] || {
    transactions: [],
    expensePaise: 0,
    incomePaise: 0,
  };

  const handlePrevMonth = () => {
    const newMonthDate = new Date(year, month - 1, 1);
    setCurrentDate(newMonthDate);
    setSelectedDate(newMonthDate);
  };

  const handleNextMonth = () => {
    const newMonthDate = new Date(year, month + 1, 1);
    setCurrentDate(newMonthDate);
    setSelectedDate(newMonthDate);
  };

  const isToday = (dayNum: number) => {
    const today = new Date();
    return (
      today.getDate() === dayNum &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isSelected = (dayNum: number) => {
    return (
      selectedDate.getDate() === dayNum &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };

  const monthName = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      {/* Top Header */}
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <View>
          <Caption>CALENDAR VIEW</Caption>
          <Heading className="text-xl">Daily Activity</Heading>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/transaction/new")}
          className="p-2.5 bg-emerald-600 rounded-full flex-row items-center justify-center shadow-sm"
        >
          <Plus size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Month Selector Bar */}
        <View className="flex-row items-center justify-between bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 mb-4 shadow-sm">
          <TouchableOpacity
            onPress={handlePrevMonth}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 active:opacity-70"
          >
            <ChevronLeft size={18} color="#64748b" />
          </TouchableOpacity>

          <View className="flex-row items-center gap-2">
            <CalendarIcon size={16} color="#10b981" />
            <Text className="text-base font-bold text-slate-800 dark:text-slate-100">
              {monthName}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleNextMonth}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 active:opacity-70"
          >
            <ChevronRight size={18} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Monthly Summary Cards */}
        <View className="flex-row gap-2.5 mb-4">
          <Card className="flex-1 p-3.5 border-rose-100 dark:border-rose-950/40">
            <Text className="text-xs text-slate-400 font-medium">Month Spent</Text>
            <FinancialAmount
              amountPaise={monthlyStats.expenseTotal}
              type="expense"
              prefix="₹"
              showDecimals={false}
              className="text-base font-bold mt-1"
            />
          </Card>
          <Card className="flex-1 p-3.5 border-emerald-100 dark:border-emerald-950/40">
            <Text className="text-xs text-slate-400 font-medium">Month Earned</Text>
            <FinancialAmount
              amountPaise={monthlyStats.incomeTotal}
              type="income"
              prefix="₹"
              showDecimals={false}
              className="text-base font-bold mt-1"
            />
          </Card>
          <Card className="flex-1 p-3.5 border-blue-100 dark:border-blue-950/40">
            <Text className="text-xs text-slate-400 font-medium">Daily Avg</Text>
            <Text className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">
              ₹{Math.round(monthlyStats.dailyAveragePaise / 100).toLocaleString("en-IN")}
            </Text>
          </Card>
        </View>

        {/* Calendar Grid Container */}
        <Card className="p-4 mb-4">
          {/* Day of Week Labels */}
          <View className="flex-row justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
            {DAYS_OF_WEEK.map((d) => (
              <View key={d} style={{ width: "14.28%", alignItems: "center" }}>
                <Text className="text-xs font-bold text-slate-400 uppercase">
                  {d}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Day Cells */}
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {/* Blank leading slots */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <View
                key={`blank-${i}`}
                style={{ width: "14.28%", height: 46 }}
              />
            ))}

            {/* Days of current month */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const dayNum = i + 1;
              const d = new Date(year, month, dayNum);
              const dateKey = formatLocalDate(d);
              const dayInfo = transactionsByDate[dateKey];
              const hasExpense = Boolean(dayInfo && dayInfo.expensePaise > 0);
              const hasIncome = Boolean(dayInfo && dayInfo.incomePaise > 0);
              const selected = isSelected(dayNum);
              const today = isToday(dayNum);

              return (
                <View
                  key={`day-wrap-${dayNum}`}
                  style={{ width: "14.28%", height: 46, padding: 2 }}
                >
                  <TouchableOpacity
                    onPress={() => setSelectedDate(d)}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 14,
                      backgroundColor: selected
                        ? "#10b981"
                        : today
                        ? "#ecfdf5"
                        : "transparent",
                      borderWidth: today && !selected ? 1 : 0,
                      borderColor: "#10b981",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: selected
                          ? "#ffffff"
                          : today
                          ? "#059669"
                          : "#334155",
                      }}
                    >
                      {dayNum}
                    </Text>

                    {/* Indicator Dots */}
                    <View style={{ flexDirection: "row", gap: 2, marginTop: 2, height: 5, alignItems: "center" }}>
                      {hasExpense && (
                        <View
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: selected ? "#ffffff" : "#ef4444",
                          }}
                        />
                      )}
                      {hasIncome && (
                        <View
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: selected ? "#ffffff" : "#10b981",
                          }}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Selected Date Details */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-xs text-slate-400 uppercase font-semibold">
                SELECTED DAY
              </Text>
              <Subheading className="text-base">
                {selectedDate.toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Subheading>
            </View>

            {selectedDayData.transactions.length > 0 && (
              <Badge
                label={`${selectedDayData.transactions.length} record${
                  selectedDayData.transactions.length > 1 ? "s" : ""
                }`}
                variant="default"
              />
            )}
          </View>

          {selectedDayData.transactions.length === 0 ? (
            <Card className="items-center py-8">
              <CalendarIcon size={24} color="#94a3b8" />
              <Text className="text-xs text-slate-500 mt-2">
                No financial records on this date
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/transaction/new")}
                className="mt-3 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex-row items-center gap-1.5"
              >
                <Plus size={14} color="#059669" />
                <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  Add Record for this Day
                </Text>
              </TouchableOpacity>
            </Card>
          ) : (
            selectedDayData.transactions.map((tx) => {
              const isIncome = tx.type === "income";
              const isTransfer = tx.type === "transfer";
              return (
                <Card key={tx.id} className="p-3.5 mb-2 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`w-9 h-9 rounded-xl items-center justify-center ${
                        isIncome
                          ? "bg-emerald-100 dark:bg-emerald-950"
                          : isTransfer
                          ? "bg-blue-100 dark:bg-blue-950"
                          : "bg-rose-100 dark:bg-rose-950"
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft size={16} color="#10b981" />
                      ) : isTransfer ? (
                        <ArrowLeftRight size={16} color="#3b82f6" />
                      ) : (
                        <ArrowUpRight size={16} color="#ef4444" />
                      )}
                    </View>
                    <View>
                      <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {tx.description}
                      </Text>
                      <Text className="text-xs text-slate-400">
                        {tx.account?.name || "Account"} •{" "}
                        {tx.category?.name || (isTransfer ? "Transfer" : "General")}
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
