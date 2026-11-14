import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Plus,
  Target,
  AlertCircle,
  TrendingDown,
  Trash2,
  X,
} from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heading, Subheading, Body, Caption } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { useFinanceStore } from "@/store/useFinanceStore";
import { formatCurrencyFromPaise, rupeesToPaise } from "@/lib/utils";

export default function BudgetsScreen() {
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

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="px-5 pt-3 pb-3 flex-row items-center justify-between">
        <View>
          <Caption>PLANNING</Caption>
          <Heading className="text-xl">Monthly Budgets</Heading>
        </View>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="p-2.5 bg-emerald-600 rounded-full flex-row items-center justify-center shadow-sm"
        >
          <Plus size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60 }}
      >
        {budgets.length === 0 ? (
          <Card className="items-center py-12">
            <Target size={32} color="#94a3b8" />
            <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-2">
              No budgets configured
            </Text>
            <Caption className="text-center mt-1 max-w-[240px]">
              Set category-wise monthly spending limits to prevent overspending.
            </Caption>
            <Button
              title="Set First Budget"
              size="sm"
              className="mt-4"
              onPress={() => setModalVisible(true)}
            />
          </Card>
        ) : (
          budgets.map((b) => {
            const spentPaise = categorySpendingMap[b.category_id] || 0;
            const remainingPaise = b.limit_amount_paise - spentPaise;
            const percent = Math.min(100, Math.round((spentPaise / b.limit_amount_paise) * 100));
            const isOverspent = remainingPaise < 0;

            return (
              <Card key={b.id} className="p-4 mb-3.5">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: b.category?.color || "#10b981" }}
                    />
                    <Text className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {b.category?.name || "Category"}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Badge
                      label={isOverspent ? "Overspent!" : `${percent}%`}
                      variant={isOverspent ? "danger" : percent > 85 ? "warning" : "success"}
                      size="sm"
                    />
                    <TouchableOpacity
                      onPress={() => deleteBudget(b.id)}
                      className="p-1"
                    >
                      <Trash2 size={14} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Progress Bar */}
                <View className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden my-2">
                  <View
                    className={`h-2.5 rounded-full ${
                      isOverspent
                        ? "bg-rose-500"
                        : percent > 85
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </View>

                <View className="flex-row justify-between items-center mt-1">
                  <Text className="text-xs text-slate-500">
                    Spent: <Text className="font-semibold">{formatCurrencyFromPaise(spentPaise)}</Text>
                  </Text>
                  <Text className="text-xs text-slate-500">
                    Limit: <Text className="font-semibold">{formatCurrencyFromPaise(b.limit_amount_paise)}</Text>
                  </Text>
                </View>

                {isOverspent ? (
                  <View className="flex-row items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <AlertCircle size={14} color="#ef4444" />
                    <Text className="text-xs font-semibold text-rose-600">
                      Exceeded by {formatCurrencyFromPaise(Math.abs(remainingPaise))}
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center justify-between mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Text className="text-xs text-slate-400">Remaining to spend</Text>
                    <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrencyFromPaise(remainingPaise)}
                    </Text>
                  </View>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* New Budget Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Heading className="text-lg">Set Category Budget</Heading>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Caption className="mb-2">SELECT EXPENSE CATEGORY</Caption>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 mb-4">
              {expenseCategories.map((c) => {
                const isSelected = selectedCatId === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setSelectedCatId(c.id)}
                    className={`px-3 py-2 rounded-xl mr-2 border ${
                      isSelected
                        ? "bg-emerald-600 border-emerald-600"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? "text-white" : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Input
              label="Monthly Limit Amount (₹)"
              placeholder="e.g. 15000"
              keyboardType="numeric"
              value={limitStr}
              onChangeText={setLimitStr}
            />

            <Button
              title="Save Budget Limit"
              variant="primary"
              onPress={handleCreateBudget}
              className="mt-2"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
