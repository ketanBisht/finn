import React, { useState, useMemo } from "react";
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
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
} from "lucide-react-native";
import { Heading, Subheading, Caption, FinancialAmount } from "@/components/ui/typography";
import { useFinanceStore } from "@/store/useFinanceStore";
import { formatCurrencyFromPaise, formatLocalDate } from "@/lib/utils";

const DAYS_OF_WEEK = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
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
        <View>
          <Caption>CALENDAR AUDIT</Caption>
          <Text className="text-xl font-black text-[#121214]">
            Daily Activity
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/transaction/new")}
          className="w-9 h-9 bg-[#FFC83B] rounded-full items-center justify-center border border-[#E8BC52]"
        >
          <Plus size={18} color="#121214" strokeWidth={2.6} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Month Selector Bar */}
        <View className="flex-row items-center justify-between bg-white dark:bg-charcoal-900 rounded-[22px] p-3 border border-[#EAEAE5] dark:border-charcoal-800 mb-4 shadow-sm">
          <TouchableOpacity
            onPress={handlePrevMonth}
            className="w-9 h-9 rounded-full bg-[#F7F7F5] dark:bg-charcoal-800 items-center justify-center"
          >
            <ChevronLeft size={18} color="#121214" strokeWidth={2.5} />
          </TouchableOpacity>

          <View className="flex-row items-center gap-2">
            <CalendarIcon size={16} color="#121214" strokeWidth={2.4} />
            <Text className="text-base font-black text-[#121214] dark:text-[#F4F4F5]">
              {monthName}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleNextMonth}
            className="w-9 h-9 rounded-full bg-[#F7F7F5] dark:bg-charcoal-800 items-center justify-center"
          >
            <ChevronRight size={18} color="#121214" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Monthly Summary Cards */}
        <View className="flex-row gap-2.5 mb-4">
          <View className="flex-1 bg-white dark:bg-charcoal-900 rounded-[22px] p-3.5 border border-[#EAEAE5] dark:border-charcoal-800 shadow-sm">
            <Text className="text-[11px] text-[#71717A] font-bold uppercase tracking-wider">
              Spent
            </Text>
            <FinancialAmount
              amountPaise={monthlyStats.expenseTotal}
              type="expense"
              prefix="₹"
              showDecimals={false}
              className="text-base font-black mt-1"
            />
          </View>

          <View className="flex-1 bg-white dark:bg-charcoal-900 rounded-[22px] p-3.5 border border-[#EAEAE5] dark:border-charcoal-800 shadow-sm">
            <Text className="text-[11px] text-[#71717A] font-bold uppercase tracking-wider">
              Earned
            </Text>
            <FinancialAmount
              amountPaise={monthlyStats.incomeTotal}
              type="income"
              prefix="₹"
              showDecimals={false}
              className="text-base font-black mt-1"
            />
          </View>

          <View className="flex-1 bg-white dark:bg-charcoal-900 rounded-[22px] p-3.5 border border-[#EAEAE5] dark:border-charcoal-800 shadow-sm">
            <Text className="text-[11px] text-[#71717A] font-bold uppercase tracking-wider">
              Daily Avg
            </Text>
            <Text className="text-base font-black text-[#121214] dark:text-[#F4F4F5] mt-1">
              ₹{Math.round(monthlyStats.dailyAveragePaise / 100).toLocaleString("en-IN")}
            </Text>
          </View>
        </View>

        {/* Calendar Grid Container */}
        <View className="bg-white dark:bg-charcoal-900 rounded-[28px] p-4 mb-4 border border-[#EAEAE5] dark:border-charcoal-800 shadow-sm">
          {/* Day of Week Labels */}
          <View className="flex-row justify-between mb-2 border-b border-[#F0EFEA] dark:border-charcoal-800 pb-2">
            {DAYS_OF_WEEK.map((d) => (
              <View key={d} style={{ width: "14.28%", alignItems: "center" }}>
                <Text className="text-xs font-black text-[#71717A] uppercase">
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
                style={{ width: "14.28%", height: 44 }}
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
                  style={{ width: "14.28%", height: 44, padding: 2 }}
                >
                  <TouchableOpacity
                    onPress={() => setSelectedDate(d)}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 14,
                      backgroundColor: selected
                        ? "#FFC83B"
                        : today
                        ? "#F0EFEA"
                        : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: selected ? "900" : today ? "800" : "600",
                        color: selected
                          ? "#121214"
                          : today
                          ? "#121214"
                          : "#475569",
                      }}
                    >
                      {dayNum}
                    </Text>

                    {/* Indicator dots */}
                    <View style={{ flexDirection: "row", gap: 2, marginTop: 2 }}>
                      {hasExpense && (
                        <View
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: selected ? "#121214" : "#EF4444",
                          }}
                        />
                      )}
                      {hasIncome && (
                        <View
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: selected ? "#121214" : "#10B981",
                          }}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Selected Date Details */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <View>
              <Text className="text-xs font-black text-[#121214] dark:text-[#F4F4F5] uppercase tracking-wider">
                {selectedDate.toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              {selectedDayData.expensePaise > 0 && (
                <Text className="text-xs font-black text-rose-600">
                  -₹{Math.round(selectedDayData.expensePaise / 100).toLocaleString("en-IN")}
                </Text>
              )}
              {selectedDayData.incomePaise > 0 && (
                <Text className="text-xs font-black text-emerald-600">
                  +₹{Math.round(selectedDayData.incomePaise / 100).toLocaleString("en-IN")}
                </Text>
              )}
            </View>
          </View>

          {selectedDayData.transactions.length === 0 ? (
            <View className="bg-white dark:bg-charcoal-900 rounded-[24px] items-center py-8 border border-[#EAEAE5] dark:border-charcoal-800">
              <Text className="text-sm font-bold text-[#71717A]">
                No transactions on this date
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/transaction/new")}
                className="mt-3 bg-[#121214] px-4 py-2 rounded-full"
              >
                <Text className="text-white text-xs font-bold">+ Record for Today</Text>
              </TouchableOpacity>
            </View>
          ) : (
            selectedDayData.transactions.map((tx) => {
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
                        <ArrowDownLeft size={16} color="#10B981" />
                      ) : isTransfer ? (
                        <ArrowLeftRight size={16} color="#3B82F6" />
                      ) : (
                        <ArrowUpRight size={16} color="#EF4444" />
                      )}
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-[#121214] dark:text-[#F4F4F5]">
                        {tx.description}
                      </Text>
                      <Text className="text-xs text-[#71717A]">
                        {tx.account?.name || "Account"}
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
