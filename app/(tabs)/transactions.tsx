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
  Filter,
} from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Heading, Caption, FinancialAmount } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
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
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <View>
          <Caption>LEDGER</Caption>
          <Heading className="text-xl">Transactions</Heading>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/transaction/new")}
          className="p-2.5 bg-emerald-600 rounded-full flex-row items-center justify-center shadow-sm"
        >
          <Plus size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View className="px-5 mt-2">
        <Input
          placeholder="Search merchant, tag, note..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftElement={<Search size={16} color="#94a3b8" />}
          containerClassName="mb-2"
        />
      </View>

      {/* Filter Tabs */}
      <View className="px-5 mb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
          {[
            { id: "all", label: "All Types" },
            { id: "expense", label: "Expenses" },
            { id: "income", label: "Income" },
            { id: "transfer", label: "Transfers" },
          ].map((tab) => {
            const isSelected = typeFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setTypeFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl mr-2 border ${
                  isSelected
                    ? "bg-slate-900 border-slate-900 dark:bg-slate-100 dark:border-slate-100"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isSelected
                      ? "text-white dark:text-slate-900"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Transactions List */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60 }}
      >
        {filteredTransactions.length === 0 ? (
          <Card className="items-center py-12">
            <Filter size={28} color="#94a3b8" />
            <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2">
              No transactions found
            </Text>
            <Caption className="text-center mt-1">
              Try adjusting your search terms or filters.
            </Caption>
          </Card>
        ) : (
          filteredTransactions.map((tx) => {
            const isIncome = tx.type === "income";
            const isTransfer = tx.type === "transfer";
            return (
              <Card key={tx.id} className="p-4 mb-2.5 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1 mr-2">
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

                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-800 dark:text-slate-200" numberOfLines={1}>
                      {tx.description}
                    </Text>
                    <Text className="text-xs text-slate-400 mt-0.5">
                      {tx.category?.name || (isTransfer ? "Transfer" : "General")} •{" "}
                      {tx.account?.name || "Account"} •{" "}
                      {new Date(tx.transaction_date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </Text>
                  </View>
                </View>

                <View className="items-end gap-1">
                  <FinancialAmount
                    amountPaise={tx.amount_paise}
                    type={isIncome ? "income" : isTransfer ? "neutral" : "expense"}
                    prefix={isIncome ? "+" : isTransfer ? "" : "-"}
                    className="text-sm font-bold"
                  />
                  <TouchableOpacity
                    onPress={() => handleDelete(tx.id, tx.description)}
                    className="p-1"
                  >
                    <Trash2 size={14} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
