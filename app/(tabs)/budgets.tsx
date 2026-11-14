import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Plus,
  Target,
  Trash2,
  X,
  AlertTriangle,
  TrendingDown,
} from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { Caption } from "@/components/ui/typography";
import { useFinanceStore } from "@/store/useFinanceStore";
import { formatCurrencyFromPaise, rupeesToPaise } from "@/lib/utils";

export default function BudgetsScreen() {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [limitStr, setLimitStr] = useState("");

  const budgets = useFinanceStore((s) => s.budgets);
  const categories = useFinanceStore((s) => s.categories);
  const transactions = useFinanceStore((s) => s.transactions);
  const setBudget = useFinanceStore((s) => s.setBudget);
  const deleteBudget = useFinanceStore((s) => s.deleteBudget);

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const [selectedCatId, setSelectedCatId] = useState(expenseCategories[0]?.id || "");

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Calculate actual spending per category for current month
  const categorySpendingMap = transactions.reduce((acc, tx) => {
    if (tx.type !== "expense" || !tx.category_id) return acc;
    const d = new Date(tx.transaction_date);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      acc[tx.category_id] = (acc[tx.category_id] || 0) + tx.amount_paise;
    }
    return acc;
  }, {} as Record<string, number>);

  const handleCreateBudget = () => {
    const limit = parseFloat(limitStr);
    if (isNaN(limit) || limit <= 0) {
      Alert.alert("Invalid Limit", "Please enter a valid budget limit greater than 0");
      return;
    }

    setBudget({
      user_id: "local-user",
      category_id: selectedCatId,
      month: currentMonth + 1,
      year: currentYear,
      limit_amount_paise: rupeesToPaise(limit),
    });

    setLimitStr("");
    setModalVisible(false);
  };

  const currentBudgets = budgets.filter(
    (b) => b.month === currentMonth + 1 && b.year === currentYear
  );

  const totalBudgetPaise = currentBudgets.reduce(
    (sum, b) => sum + b.limit_amount_paise,
    0
  );

  const totalSpentInBudgetsPaise = currentBudgets.reduce(
    (sum, b) => sum + (categorySpendingMap[b.category_id] || 0),
    0
  );

  const overallPercent =
    totalBudgetPaise > 0
      ? Math.min(100, Math.round((totalSpentInBudgetsPaise / totalBudgetPaise) * 100))
      : 0;

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
          <Caption>PLANNING</Caption>
          <Text className="text-xl font-black text-[#121214]">
            Monthly Budgets
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
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
        {/* Warm Golden Overview Card (Matches screenshot's warm featured card) */}
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
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <View>
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#121214", opacity: 0.7, textTransform: "uppercase" }}>
                Active Target
              </Text>
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#121214", marginTop: 2 }}>
                {formatCurrencyFromPaise(totalBudgetPaise)}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: overallPercent > 90 ? "#EF4444" : "#121214",
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 9999,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#FFFFFF" }}>
                {overallPercent}% Used
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={{ width: "100%", height: 8, backgroundColor: "rgba(0,0,0,0.1)", borderRadius: 4, overflow: "hidden", marginBottom: 14 }}>
            <View
              style={{
                width: `${overallPercent}%`,
                height: "100%",
                backgroundColor: overallPercent > 90 ? "#EF4444" : "#121214",
                borderRadius: 4,
              }}
            />
          </View>

          {/* Bottom Metric Pills */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                paddingVertical: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#71717A" }}>Spent</Text>
              <Text style={{ fontSize: 13, fontWeight: "900", color: "#121214", marginTop: 1 }}>
                {formatCurrencyFromPaise(totalSpentInBudgetsPaise)}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                paddingVertical: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#71717A" }}>Available</Text>
              <Text style={{ fontSize: 13, fontWeight: "900", color: "#121214", marginTop: 1 }}>
                {formatCurrencyFromPaise(Math.max(0, totalBudgetPaise - totalSpentInBudgetsPaise))}
              </Text>
            </View>
          </View>
        </View>

        {/* Budgets List */}
        <View className="mb-4">
          <Text className="text-xs font-black text-[#121214] dark:text-[#F4F4F5] uppercase tracking-wider mb-3 px-1">
            Category Allocations
          </Text>

          {currentBudgets.length === 0 ? (
            <View className="bg-white dark:bg-charcoal-900 rounded-[24px] items-center py-10 border border-[#EAEAE5] dark:border-charcoal-800">
              <Target size={32} color="#A1A1AA" />
              <Text className="text-sm font-bold text-[#121214] dark:text-[#F4F4F5] mt-3">
                No Budgets Configured
              </Text>
              <Caption className="text-center mt-1 mb-4">
                Set monthly spending limits for categories like Food, Fuel, etc.
              </Caption>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={{
                  backgroundColor: "#FFC83B",
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 9999,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "800", color: "#121214" }}>
                  + Set First Budget
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            currentBudgets.map((b) => {
              const spent = categorySpendingMap[b.category_id] || 0;
              const limit = b.limit_amount_paise;
              const percent = Math.min(100, Math.round((spent / limit) * 100));
              const isOver = spent > limit;

              return (
                <View
                  key={b.id}
                  className="bg-white dark:bg-charcoal-900 rounded-[24px] p-4 mb-3 border border-[#EAEAE5] dark:border-charcoal-800 shadow-sm"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2">
                      <View
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: b.category?.color || "#FFC83B" }}
                      />
                      <Text className="text-sm font-bold text-[#121214] dark:text-[#F4F4F5]">
                        {b.category?.name || "Category"}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-2">
                      <View
                        style={{
                          backgroundColor: isOver ? "#FEECEB" : "#F7F7F5",
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 9999,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "800",
                            color: isOver ? "#EF4444" : "#71717A",
                          }}
                        >
                          {percent}%
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => deleteBudget(b.id)}
                        className="p-1 opacity-40 active:opacity-100"
                      >
                        <Trash2 size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View className="w-full bg-[#F0EFEA] dark:bg-charcoal-800 rounded-full h-2 overflow-hidden my-2">
                    <View
                      className="h-2 rounded-full"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: isOver ? "#EF4444" : b.category?.color || "#121214",
                      }}
                    />
                  </View>

                  <View className="flex-row justify-between items-center mt-1">
                    <Text className="text-xs text-[#71717A]">
                      Spent: <Text className="font-bold text-[#121214] dark:text-[#F4F4F5]">{formatCurrencyFromPaise(spent)}</Text>
                    </Text>
                    <Text className="text-xs text-[#71717A]">
                      Limit: <Text className="font-bold text-[#121214] dark:text-[#F4F4F5]">{formatCurrencyFromPaise(limit)}</Text>
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add Budget Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-charcoal-900 rounded-t-[32px] p-6 pb-10">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-black text-[#121214] dark:text-[#F4F4F5]">
                Set Category Budget
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="w-8 h-8 rounded-full bg-[#F7F7F5] items-center justify-center"
              >
                <X size={16} color="#121214" />
              </TouchableOpacity>
            </View>

            {/* Category Selector Chips */}
            <Text className="text-xs font-bold text-[#71717A] uppercase tracking-wider mb-2">
              Select Category
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-5">
              {expenseCategories.map((c) => {
                const isSelected = selectedCatId === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setSelectedCatId(c.id)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 9999,
                      marginRight: 8,
                      backgroundColor: isSelected ? "#FFC83B" : "#F7F7F5",
                      borderWidth: 1,
                      borderColor: isSelected ? "#E8BC52" : "#EAEAE5",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "800",
                        color: "#121214",
                      }}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Input
              label="Monthly Limit (₹)"
              placeholder="e.g. 8000"
              keyboardType="numeric"
              value={limitStr}
              onChangeText={setLimitStr}
              containerClassName="mb-5"
            />

            <TouchableOpacity
              onPress={handleCreateBudget}
              style={{
                backgroundColor: "#121214",
                paddingVertical: 14,
                borderRadius: 9999,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
                Save Budget
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
