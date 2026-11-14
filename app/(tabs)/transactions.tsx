import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Plus,
  Trash2,
} from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { Heading, Caption, FinancialAmount } from "@/components/ui/typography";
import { useFinanceStore } from "@/store/useFinanceStore";

export default function TransactionsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income" | "transfer">("all");
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>("all");

  const transactions = useFinanceStore((s) => s.transactions);
  const accounts = useFinanceStore((s) => s.accounts);
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction);

  const filteredTransactions = transactions.filter((t) => {
    // Search match
    const matchesSearch =
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    // Type filter
    const matchesType = typeFilter === "all" || t.type === typeFilter;

    // Account filter
    const matchesAccount =
      selectedAccountFilter === "all" ||
      t.account_id === selectedAccountFilter ||
      t.destination_account_id === selectedAccountFilter;

    return matchesSearch && matchesType && matchesAccount;
  });

  const handleDelete = (id: string, desc: string) => {
    Alert.alert(
      "Delete Transaction",
      `Are you sure you want to delete "${desc}"? The account balance will be automatically adjusted.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteTransaction(id) },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F7F7F5] dark:bg-[#0E0E10]" edges={["top"]}>
      {/* Header with Live Ledger pill tag */}
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-[11px] font-bold text-[#71717A] tracking-wider uppercase">
            AUDIT & HISTORY
          </Text>
          <Text className="text-xl font-black text-[#121214] dark:text-[#F4F4F5]">
            Transactions
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          {/* Black Live Ledger Pill (Inspired by Live Match pill in reference) */}
          <View className="bg-[#121214] px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-emerald-400" />
            <Text className="text-white text-[11px] font-extrabold tracking-wide">
              Live Ledger
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/transaction/new")}
            className="w-9 h-9 bg-[#FFC83B] rounded-full items-center justify-center border border-[#E8BC52]"
          >
            <Plus size={18} color="#121214" strokeWidth={2.6} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      <View className="px-5 mt-2">
        <Input
          placeholder="Search merchant, tag, notes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftElement={<Search size={16} color="#71717A" />}
          containerClassName="mb-2"
        />
      </View>

      {/* Segmented Filter Pills (Inspired by [Match] [Odds] [H2H] [Standing] from reference) */}
      <View className="px-5 mb-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {[
            { id: "all", label: "All" },
            { id: "expense", label: "Expenses" },
            { id: "income", label: "Income" },
            { id: "transfer", label: "Transfers" },
          ].map((tab) => {
            const isSelected = typeFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setTypeFilter(tab.id as any)}
                style={{
                  paddingVertical: 7,
                  paddingHorizontal: 16,
                  borderRadius: 9999,
                  marginRight: 8,
                  backgroundColor: isSelected ? "#FFC83B" : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: isSelected ? "#E8BC52" : "#EAEAE5",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: isSelected ? "800" : "600",
                    color: isSelected ? "#121214" : "#71717A",
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Accounts Horizontal Quick Filters */}
      {accounts.length > 1 && (
        <View className="px-5 mb-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            <TouchableOpacity
              onPress={() => setSelectedAccountFilter("all")}
              style={{
                paddingVertical: 4,
                paddingHorizontal: 10,
                borderRadius: 9999,
                marginRight: 6,
                backgroundColor: selectedAccountFilter === "all" ? "#121214" : "#EAEAE5",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: selectedAccountFilter === "all" ? "#FFFFFF" : "#71717A",
                }}
              >
                All Accounts
              </Text>
            </TouchableOpacity>

            {accounts.map((acc) => (
              <TouchableOpacity
                key={acc.id}
                onPress={() => setSelectedAccountFilter(acc.id)}
                style={{
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                  borderRadius: 9999,
                  marginRight: 6,
                  backgroundColor: selectedAccountFilter === acc.id ? "#121214" : "#EAEAE5",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: selectedAccountFilter === acc.id ? "#FFFFFF" : "#71717A",
                  }}
                >
                  {acc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Transactions List */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredTransactions.length === 0 ? (
          <View className="bg-white dark:bg-charcoal-900 rounded-[24px] items-center py-12 border border-[#EAEAE5] dark:border-charcoal-800 mt-2">
            <Search size={32} color="#A1A1AA" />
            <Text className="text-sm font-bold text-[#121214] dark:text-[#F4F4F5] mt-3">
              No Transactions Found
            </Text>
            <Caption className="text-center mt-1">
              Try adjusting your search query or filters.
            </Caption>
          </View>
        ) : (
          filteredTransactions.map((tx) => {
            const isIncome = tx.type === "income";
            const isTransfer = tx.type === "transfer";

            return (
              <View
                key={tx.id}
                className="bg-white dark:bg-charcoal-900 rounded-[22px] p-4 mb-2.5 flex-row items-center justify-between border border-[#EAEAE5] dark:border-charcoal-800 shadow-sm"
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 16,
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
                      <ArrowDownLeft size={18} color="#10B981" />
                    ) : isTransfer ? (
                      <ArrowLeftRight size={18} color="#3B82F6" />
                    ) : (
                      <ArrowUpRight size={18} color="#EF4444" />
                    )}
                  </View>

                  <View className="flex-1">
                    <Text className="text-sm font-bold text-[#121214] dark:text-[#F4F4F5]">
                      {tx.description}
                    </Text>
                    <Text className="text-xs text-[#71717A] mt-0.5">
                      {tx.account?.name || "Account"} •{" "}
                      {new Date(tx.transaction_date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                    {tx.notes ? (
                      <Text className="text-[11px] text-[#A1A1AA] italic mt-0.5" numberOfLines={1}>
                        "{tx.notes}"
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View className="items-end pl-2">
                  <FinancialAmount
                    amountPaise={tx.amount_paise}
                    type={isIncome ? "income" : isTransfer ? "neutral" : "expense"}
                    prefix={isIncome ? "+" : isTransfer ? "" : "-"}
                    className="text-base font-black"
                  />
                  <TouchableOpacity
                    onPress={() => handleDelete(tx.id, tx.description)}
                    className="p-1 mt-1 opacity-40 active:opacity-100"
                  >
                    <Trash2 size={14} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
