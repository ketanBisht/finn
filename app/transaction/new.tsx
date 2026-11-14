import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  CreditCard,
  Wallet,
  Tag,
  AlignLeft,
} from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Caption } from "@/components/ui/typography";
import { TransactionType } from "@/types";
import { useFinanceStore } from "@/store/useFinanceStore";
import { rupeesToPaise } from "@/lib/utils";

export default function NewTransactionScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const initialType: TransactionType =
    params.type === "income"
      ? "income"
      : params.type === "transfer"
      ? "transfer"
      : "expense";

  const [type, setType] = useState<TransactionType>(initialType);
  const [amountStr, setAmountStr] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const accounts = useFinanceStore((s) => s.accounts);
  const categories = useFinanceStore((s) => s.categories);
  const addTransaction = useFinanceStore((s) => s.addTransaction);

  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts[0]?.id || ""
  );
  const [destinationAccountId, setDestinationAccountId] = useState(
    accounts[1]?.id || ""
  );

  const filteredCategories = categories.filter((c) =>
    type === "income" ? c.type === "income" : c.type === "expense"
  );

  const [selectedCategoryId, setSelectedCategoryId] = useState(
    filteredCategories[0]?.id || ""
  );

  // Quick preset amount additions
  const handleQuickAdd = (add: number) => {
    const current = parseFloat(amountStr) || 0;
    setAmountStr((current + add).toString());
  };

  const handleSave = () => {
    const cleanAmount = parseFloat(amountStr);
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount greater than 0");
      return;
    }

    if (!selectedAccountId) {
      Alert.alert("Account Required", "Please select an account.");
      return;
    }

    if (type === "transfer" && selectedAccountId === destinationAccountId) {
      Alert.alert("Invalid Transfer", "Source and destination accounts must be different.");
      return;
    }

    const paise = rupeesToPaise(cleanAmount);
    const finalDescription =
      description.trim() ||
      (type === "transfer"
        ? "Account Transfer"
        : categories.find((c) => c.id === selectedCategoryId)?.name || "Transaction");

    addTransaction({
      user_id: "local-user",
      account_id: selectedAccountId,
      category_id: type === "transfer" ? null : selectedCategoryId,
      destination_account_id: type === "transfer" ? destinationAccountId : null,
      amount_paise: paise,
      type,
      description: finalDescription,
      notes: notes.trim() || undefined,
      transaction_date: new Date().toISOString(),
    });

    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type Toggle Tabs */}
        <View className="flex-row p-1.5 bg-slate-200/80 dark:bg-slate-800 rounded-2xl mb-5">
          <TouchableOpacity
            onPress={() => setType("expense")}
            className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 ${
              type === "expense" ? "bg-rose-500 shadow-sm" : ""
            }`}
          >
            <ArrowUpRight
              size={16}
              color={type === "expense" ? "#ffffff" : "#64748b"}
            />
            <Text
              className={`text-xs font-bold ${
                type === "expense" ? "text-white" : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setType("income")}
            className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 ${
              type === "income" ? "bg-emerald-600 shadow-sm" : ""
            }`}
          >
            <ArrowDownLeft
              size={16}
              color={type === "income" ? "#ffffff" : "#64748b"}
            />
            <Text
              className={`text-xs font-bold ${
                type === "income" ? "text-white" : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Income
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setType("transfer")}
            className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 ${
              type === "transfer" ? "bg-blue-600 shadow-sm" : ""
            }`}
          >
            <ArrowLeftRight
              size={16}
              color={type === "transfer" ? "#ffffff" : "#64748b"}
            />
            <Text
              className={`text-xs font-bold ${
                type === "transfer" ? "text-white" : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Transfer
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount Card with Quick Add */}
        <Card className="mb-5 items-center py-6">
          <Caption className="text-center mb-1">ENTER AMOUNT (₹)</Caption>
          <View className="flex-row items-center justify-center mb-3">
            <Text className="text-3xl font-bold text-slate-400 mr-1">₹</Text>
            <Input
              value={amountStr}
              onChangeText={setAmountStr}
              placeholder="0.00"
              keyboardType="numeric"
              className="text-4xl font-extrabold text-slate-900 dark:text-slate-50 text-center tracking-tight"
              containerClassName="mb-0 border-0 bg-transparent w-48"
            />
          </View>

          {/* Quick preset chips */}
          <View className="flex-row gap-2 mt-2">
            {[100, 500, 1000, 2000].map((val) => (
              <TouchableOpacity
                key={val}
                onPress={() => handleQuickAdd(val)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  +₹{val}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Source Account Selection */}
        <View className="mb-5">
          <View className="flex-row items-center gap-1.5 mb-2">
            <Wallet size={16} color="#64748b" />
            <Text className="text-xs font-semibold text-slate-500 uppercase">
              {type === "transfer" ? "Transfer From" : "Account"}
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {accounts.map((acc) => {
              const isSelected = selectedAccountId === acc.id;
              return (
                <TouchableOpacity
                  key={acc.id}
                  onPress={() => setSelectedAccountId(acc.id)}
                  className={`px-4 py-3 rounded-2xl mr-2 flex-row items-center gap-2 border ${
                    isSelected
                      ? "bg-slate-900 border-slate-900 dark:bg-slate-100 dark:border-slate-100"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <CreditCard
                    size={16}
                    color={isSelected ? "#10b981" : "#94a3b8"}
                  />
                  <Text
                    className={`text-xs font-bold ${
                      isSelected
                        ? "text-white dark:text-slate-900"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {acc.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Destination Account Selection for Transfers */}
        {type === "transfer" && (
          <View className="mb-5">
            <View className="flex-row items-center gap-1.5 mb-2">
              <ArrowLeftRight size={16} color="#3b82f6" />
              <Text className="text-xs font-semibold text-slate-500 uppercase">
                Transfer To (Destination)
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
              {accounts.map((acc) => {
                const isSelected = destinationAccountId === acc.id;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    onPress={() => setDestinationAccountId(acc.id)}
                    className={`px-4 py-3 rounded-2xl mr-2 flex-row items-center gap-2 border ${
                      isSelected
                        ? "bg-blue-600 border-blue-600"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <CreditCard
                      size={16}
                      color={isSelected ? "#ffffff" : "#94a3b8"}
                    />
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? "text-white" : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {acc.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Category Selection (Expense / Income) */}
        {type !== "transfer" && (
          <View className="mb-5">
            <View className="flex-row items-center gap-1.5 mb-2">
              <Tag size={16} color="#64748b" />
              <Text className="text-xs font-semibold text-slate-500 uppercase">Category</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {filteredCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedCategoryId(cat.id)}
                    className={`px-3.5 py-2.5 rounded-2xl flex-row items-center gap-1.5 border ${
                      isSelected
                        ? "bg-emerald-600 border-emerald-600"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <View
                      className="w-2.5 h-2.5 rounded-full mr-0.5"
                      style={{ backgroundColor: isSelected ? "#ffffff" : cat.color || "#10b981" }}
                    />
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected ? "text-white" : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Description & Notes */}
        <Card className="mb-6">
          <Input
            label="Description / Merchant"
            placeholder="e.g. Grocery, Metro, Salary, Tea"
            value={description}
            onChangeText={setDescription}
            leftElement={<AlignLeft size={16} color="#94a3b8" />}
          />
          <Input
            label="Notes (Optional)"
            placeholder="Add additional details or reference"
            value={notes}
            onChangeText={setNotes}
            containerClassName="mb-0"
          />
        </Card>

        {/* Save Button */}
        <Button
          title={
            type === "expense"
              ? "Record Expense"
              : type === "income"
              ? "Record Income"
              : "Execute Transfer"
          }
          variant={type === "expense" ? "danger" : type === "transfer" ? "secondary" : "primary"}
          size="lg"
          onPress={handleSave}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
