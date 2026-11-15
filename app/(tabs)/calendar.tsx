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
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
} from "lucide-react-native";
import { Caption, FinancialAmount } from "@/components/ui/typography";
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

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDays = lastDayOfMonth.getDate();

  let firstDayIndex = firstDayOfMonth.getDay() - 1;
  if (firstDayIndex === -1) firstDayIndex = 6;

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
      if (tx.type === "expense") map[dateKey].expensePaise += tx.amount_paise;
      else if (tx.type === "income") map[dateKey].incomePaise += tx.amount_paise;
    });

    return map;
  }, [transactions]);

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

    return { expenseTotal, incomeTotal, dailyAveragePaise };
  }, [year, month, totalDays, transactionsByDate]);

  const selectedDateKey = formatLocalDate(selectedDate);
  const selectedDayData = transactionsByDate[selectedDateKey] || {
    transactions: [],
    expensePaise: 0,
    incomePaise: 0,
  };

  const handlePrevMonth = () => {
    const d = new Date(year, month - 1, 1);
    setCurrentDate(d);
    setSelectedDate(d);
  };

  const handleNextMonth = () => {
    const d = new Date(year, month + 1, 1);
    setCurrentDate(d);
    setSelectedDate(d);
  };

  const isToday = (dayNum: number) => {
    const today = new Date();
    return (
      today.getDate() === dayNum &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isSelected = (dayNum: number) =>
    selectedDate.getDate() === dayNum &&
    selectedDate.getMonth() === month &&
    selectedDate.getFullYear() === year;

  const monthName = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#F7F7F5" }}>
      {/* Header */}
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
          <Text style={{ fontSize: 20, fontWeight: "900", color: "#121214" }}>
            Daily Activity
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/transaction/new")}
          style={{
            width: 36,
            height: 36,
            backgroundColor: "#FFC83B",
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#E8BC52",
          }}
        >
          <Plus size={18} color="#121214" strokeWidth={2.6} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Month Selector */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FFFFFF",
            borderRadius: 22,
            padding: 10,
            borderWidth: 1,
            borderColor: "#EAEAE5",
            marginBottom: 14,
          }}
        >
          <TouchableOpacity
            onPress={handlePrevMonth}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#F7F7F5",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronLeft size={18} color="#121214" strokeWidth={2.5} />
          </TouchableOpacity>

          <Text style={{ fontSize: 15, fontWeight: "900", color: "#121214" }}>
            {monthName}
          </Text>

          <TouchableOpacity
            onPress={handleNextMonth}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#F7F7F5",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronRight size={18} color="#121214" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Monthly Summary Cards */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          {[
            {
              label: "SPENT",
              value: formatCurrencyFromPaise(monthlyStats.expenseTotal),
              color: "#EF4444",
            },
            {
              label: "EARNED",
              value: formatCurrencyFromPaise(monthlyStats.incomeTotal),
              color: "#10B981",
            },
            {
              label: "DAILY AVG",
              value: formatCurrencyFromPaise(monthlyStats.dailyAveragePaise),
              color: "#121214",
            },
          ].map((item) => (
            <View
              key={item.label}
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                padding: 14,
                borderWidth: 1,
                borderColor: "#EAEAE5",
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "800",
                  color: "#71717A",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {item.label}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "900",
                  color: item.color,
                  marginTop: 4,
                }}
              >
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 28,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#EAEAE5",
          }}
        >
          {/* Day headers */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 8,
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: "#F0EFEA",
            }}
          >
            {DAYS_OF_WEEK.map((d) => (
              <View key={d} style={{ width: "14.28%", alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color: "#A1A1AA",
                    textTransform: "uppercase",
                  }}
                >
                  {d}
                </Text>
              </View>
            ))}
          </View>

          {/* Day cells */}
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <View key={`blank-${i}`} style={{ width: "14.28%", height: 46 }} />
            ))}

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
                  key={`day-${dayNum}`}
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
                        ? "#FFC83B"
                        : today
                        ? "#F0EFEA"
                        : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: selected ? "900" : today ? "800" : "500",
                        color: selected ? "#121214" : today ? "#121214" : "#52525B",
                      }}
                    >
                      {dayNum}
                    </Text>
                    {/* Dot indicators */}
                    <View style={{ flexDirection: "row", gap: 2, marginTop: 1 }}>
                      {hasExpense && (
                        <View
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: selected ? "#7C3AED" : "#EF4444",
                          }}
                        />
                      )}
                      {hasIncome && (
                        <View
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: selected ? "#059669" : "#10B981",
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

        {/* Selected Date Transactions */}
        <View style={{ marginBottom: 8, paddingHorizontal: 2 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "800",
                color: "#121214",
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              {selectedDate.toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {selectedDayData.expensePaise > 0 && (
                <Text style={{ fontSize: 12, fontWeight: "900", color: "#EF4444" }}>
                  -{formatCurrencyFromPaise(selectedDayData.expensePaise)}
                </Text>
              )}
              {selectedDayData.incomePaise > 0 && (
                <Text style={{ fontSize: 12, fontWeight: "900", color: "#10B981" }}>
                  +{formatCurrencyFromPaise(selectedDayData.incomePaise)}
                </Text>
              )}
            </View>
          </View>

          {selectedDayData.transactions.length === 0 ? (
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 24,
                padding: 32,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#EAEAE5",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#A1A1AA" }}>
                No transactions on this date
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/transaction/new")}
                style={{
                  marginTop: 12,
                  backgroundColor: "#121214",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 999,
                }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>
                  + Record for Today
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            selectedDayData.transactions.map((tx) => {
              const isIncome = tx.type === "income";
              const isTransfer = tx.type === "transfer";

              return (
                <View
                  key={tx.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 20,
                    padding: 14,
                    marginBottom: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderWidth: 1,
                    borderColor: "#EAEAE5",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
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
                      <Text
                        style={{ fontSize: 13, fontWeight: "700", color: "#121214" }}
                      >
                        {tx.description}
                      </Text>
                      <Text style={{ fontSize: 11, color: "#71717A", marginTop: 2 }}>
                        {tx.account?.name || "Account"}
                        {tx.platform ? ` · ${tx.platform}` : ""}
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
