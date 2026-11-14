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

  // Switch type and reset category to matching list
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const newFiltered = categories.filter((c) =>
      newType === "income" ? c.type === "income" : c.type === "expense"
    );
    if (newFiltered[0]) {
      setSelectedCategoryId(newFiltered[0].id);
    }
  };

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
        {/* Type Toggle Tabs with stable native styles */}
        <View style={{ flexDirection: "row", padding: 5, backgroundColor: "#e2e8f0", borderRadius: 18, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => handleTypeChange("expense")}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              backgroundColor: type === "expense" ? "#f43f5e" : "transparent",
            }}
          >
            <ArrowUpRight
              size={16}
              color={type === "expense" ? "#ffffff" : "#64748b"}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: type === "expense" ? "#ffffff" : "#475569",
              }}
            >
              Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTypeChange("income")}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              backgroundColor: type === "income" ? "#059669" : "transparent",
            }}
          >
            <ArrowDownLeft
              size={16}
              color={type === "income" ? "#ffffff" : "#64748b"}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: type === "income" ? "#ffffff" : "#475569",
              }}
            >
              Income
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTypeChange("transfer")}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              backgroundColor: type === "transfer" ? "#2563eb" : "transparent",
            }}
          >
            <ArrowLeftRight
              size={16}
              color={type === "transfer" ? "#ffffff" : "#64748b"}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: type === "transfer" ? "#ffffff" : "#475569",
              }}
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
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 16,
                    marginRight: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: isSelected ? "#0f172a" : "#ffffff",
                    borderWidth: 1,
                    borderColor: isSelected ? "#0f172a" : "#e2e8f0",
                  }}
                >
                  <CreditCard
                    size={16}
                    color={isSelected ? "#10b981" : "#94a3b8"}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: isSelected ? "#ffffff" : "#334155",
                    }}
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
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 16,
                      marginRight: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      backgroundColor: isSelected ? "#2563eb" : "#ffffff",
                      borderWidth: 1,
                      borderColor: isSelected ? "#2563eb" : "#e2e8f0",
                    }}
                  >
                    <CreditCard
                      size={16}
                      color={isSelected ? "#ffffff" : "#94a3b8"}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: isSelected ? "#ffffff" : "#334155",
                      }}
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
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {filteredCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedCategoryId(cat.id)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: isSelected ? "#059669" : "#ffffff",
                      borderWidth: 1,
                      borderColor: isSelected ? "#059669" : "#e2e8f0",
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: isSelected ? "#ffffff" : cat.color || "#10b981",
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: isSelected ? "#ffffff" : "#334155",
                      }}
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
            placeholder="e.g. Salary, Client payment, Grocery"
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
