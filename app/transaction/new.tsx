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
  X,
} from "lucide-react-native";
import { Input } from "@/components/ui/input";
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
    <SafeAreaView className="flex-1 bg-[#F7F7F5] dark:bg-[#0E0E10]" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <View>
          <Caption>RECORD ENTRY</Caption>
          <Text className="text-xl font-black text-[#121214] dark:text-[#F4F4F5]">
            New Transaction
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-white dark:bg-charcoal-900 border border-[#EAEAE5] items-center justify-center"
        >
          <X size={18} color="#121214" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Type Toggle Tabs (Pill Controls inspired by screenshot) */}
        <View style={{ flexDirection: "row", padding: 5, backgroundColor: "#EAEAE5", borderRadius: 9999, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => handleTypeChange("expense")}
            style={{
              flex: 1,
              paddingVertical: 11,
              borderRadius: 9999,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              backgroundColor: type === "expense" ? "#121214" : "transparent",
            }}
          >
            <ArrowUpRight
              size={16}
              color={type === "expense" ? "#FFFFFF" : "#71717A"}
              strokeWidth={2.4}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "800",
                color: type === "expense" ? "#FFFFFF" : "#71717A",
              }}
            >
              Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTypeChange("income")}
            style={{
              flex: 1,
              paddingVertical: 11,
              borderRadius: 9999,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              backgroundColor: type === "income" ? "#FFC83B" : "transparent",
            }}
          >
            <ArrowDownLeft
              size={16}
              color={type === "income" ? "#121214" : "#71717A"}
              strokeWidth={2.4}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "800",
                color: type === "income" ? "#121214" : "#71717A",
              }}
            >
              Income
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTypeChange("transfer")}
            style={{
              flex: 1,
              paddingVertical: 11,
              borderRadius: 9999,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              backgroundColor: type === "transfer" ? "#121214" : "transparent",
            }}
          >
            <ArrowLeftRight
              size={16}
              color={type === "transfer" ? "#FFFFFF" : "#71717A"}
              strokeWidth={2.4}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "800",
                color: type === "transfer" ? "#FFFFFF" : "#71717A",
              }}
            >
              Transfer
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount Card with Quick Add */}
        <View className="bg-white dark:bg-charcoal-900 rounded-[28px] p-6 mb-5 items-center border border-[#EAEAE5] dark:border-charcoal-800 shadow-sm">
          <Caption className="text-center mb-1">ENTER AMOUNT (₹)</Caption>
          <View className="flex-row items-center justify-center mb-3">
            <Text className="text-3xl font-black text-[#A1A1AA] mr-1">₹</Text>
            <Input
              value={amountStr}
              onChangeText={setAmountStr}
              placeholder="0.00"
              keyboardType="numeric"
              className="text-4xl font-black text-[#121214] dark:text-[#F4F4F5] text-center tracking-tight"
              containerClassName="mb-0 border-0 bg-transparent w-48 shadow-none"
            />
          </View>

          {/* Quick preset chips */}
          <View className="flex-row gap-2 mt-2">
            {[100, 500, 1000, 2000].map((val) => (
              <TouchableOpacity
                key={val}
                onPress={() => handleQuickAdd(val)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: "#F7F7F5",
                  borderRadius: 9999,
                  borderWidth: 1,
                  borderColor: "#EAEAE5",
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "800", color: "#121214" }}>
                  +₹{val}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Source Account Selection */}
        <View className="mb-5">
          <View className="flex-row items-center gap-1.5 mb-2 px-1">
            <Wallet size={15} color="#71717A" strokeWidth={2.4} />
            <Text className="text-xs font-black text-[#121214] dark:text-[#F4F4F5] uppercase tracking-wider">
              {type === "transfer" ? "Source Account" : "Account"}
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {accounts.map((acc) => {
              const isSelected = selectedAccountId === acc.id;
              return (
                <TouchableOpacity
                  key={acc.id}
                  onPress={() => setSelectedAccountId(acc.id)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 9999,
                    marginRight: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: isSelected ? "#121214" : "#FFFFFF",
                    borderWidth: 1,
                    borderColor: isSelected ? "#121214" : "#EAEAE5",
                  }}
                >
                  <CreditCard
                    size={15}
                    color={isSelected ? "#FFC83B" : "#71717A"}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "800",
                      color: isSelected ? "#FFFFFF" : "#121214",
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
            <View className="flex-row items-center gap-1.5 mb-2 px-1">
              <ArrowLeftRight size={15} color="#71717A" strokeWidth={2.4} />
              <Text className="text-xs font-black text-[#121214] dark:text-[#F4F4F5] uppercase tracking-wider">
                Destination Account
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {accounts.map((acc) => {
                const isSelected = destinationAccountId === acc.id;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    onPress={() => setDestinationAccountId(acc.id)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 9999,
                      marginRight: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      backgroundColor: isSelected ? "#FFC83B" : "#FFFFFF",
                      borderWidth: 1,
                      borderColor: isSelected ? "#E8BC52" : "#EAEAE5",
                    }}
                  >
                    <CreditCard
                      size={15}
                      color={isSelected ? "#121214" : "#71717A"}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "800",
                        color: "#121214",
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
            <View className="flex-row items-center gap-1.5 mb-2 px-1">
              <Tag size={15} color="#71717A" strokeWidth={2.4} />
              <Text className="text-xs font-black text-[#121214] dark:text-[#F4F4F5] uppercase tracking-wider">
                Category
              </Text>
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
                      paddingVertical: 9,
                      borderRadius: 9999,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: isSelected ? "#FFC83B" : "#FFFFFF",
                      borderWidth: 1,
                      borderColor: isSelected ? "#E8BC52" : "#EAEAE5",
                    }}
                  >
                    <View
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 4,
                        backgroundColor: isSelected ? "#121214" : cat.color || "#121214",
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "800",
                        color: "#121214",
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
        <View className="bg-white dark:bg-charcoal-900 rounded-[28px] p-5 mb-6 border border-[#EAEAE5] dark:border-charcoal-800 shadow-sm">
          <Input
            label="Description / Merchant"
            placeholder="e.g. Swiggy, Uber, Client Payment"
            value={description}
            onChangeText={setDescription}
            leftElement={<AlignLeft size={16} color="#71717A" />}
          />
          <Input
            label="Notes (Optional)"
            placeholder="Reference number or note"
            value={notes}
            onChangeText={setNotes}
            containerClassName="mb-0"
          />
        </View>

        {/* Save Button (Pill Button) */}
        <TouchableOpacity
          onPress={handleSave}
          style={{
            backgroundColor: type === "income" ? "#FFC83B" : "#121214",
            paddingVertical: 16,
            borderRadius: 9999,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "900",
              color: type === "income" ? "#121214" : "#FFFFFF",
            }}
          >
            {type === "expense"
              ? "Record Expense"
              : type === "income"
              ? "Record Income"
              : "Execute Transfer"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
