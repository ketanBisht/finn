import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Plus,
  Trash2,
  Calendar,
} from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { Caption, FinancialAmount } from "@/components/ui/typography";
import { useFinanceStore } from "@/store/useFinanceStore";

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income" | "transfer">("all");
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>("all");

  const transactions = useFinanceStore((s) => s.transactions);
  const accounts = useFinanceStore((s) => s.accounts);
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction);

  const filteredTransactions = transactions.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      t.description.toLowerCase().includes(q) ||
      (t.platform && t.platform.toLowerCase().includes(q)) ||
      (t.notes && t.notes.toLowerCase().includes(q));
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    const matchesAccount =
      selectedAccountFilter === "all" ||
      t.account_id === selectedAccountFilter ||
      t.destination_account_id === selectedAccountFilter;
    return matchesSearch && matchesType && matchesAccount;
  });

  const handleDelete = (id: string, desc: string) => {
    Alert.alert(
      "Delete Transaction",
      `Delete "${desc}"? The account balance will be adjusted.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteTransaction(id) },
      ]
    );
  };

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
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: "#71717A",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            AUDIT & HISTORY
          </Text>
          <Text style={{ fontSize: 20, fontWeight: "900", color: "#121214" }}>
            Transactions
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/calendar")}
            style={{
              width: 36,
              height: 36,
              backgroundColor: "#FFFFFF",
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#EAEAE5",
            }}
          >
            <Calendar size={17} color="#121214" strokeWidth={2.4} />
          </TouchableOpacity>

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
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 20, marginTop: 4 }}>
        <Input
          placeholder="Search description, merchant, notes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftElement={<Search size={15} color="#A1A1AA" />}
          containerClassName="mb-3"
        />
      </View>

      {/* Type Filter Pills */}
      <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(["all", "expense", "income", "transfer"] as const).map((id) => {
            const labels = { all: "All", expense: "Expenses", income: "Income", transfer: "Transfers" };
            const isActive = typeFilter === id;
            return (
              <TouchableOpacity
                key={id}
                onPress={() => setTypeFilter(id)}
                style={{
                  paddingVertical: 7,
                  paddingHorizontal: 16,
                  borderRadius: 999,
                  marginRight: 8,
                  backgroundColor: isActive ? "#FFC83B" : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: isActive ? "#E8BC52" : "#EAEAE5",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: isActive ? "800" : "600",
                    color: isActive ? "#121214" : "#71717A",
                  }}
                >
                  {labels[id]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Account Quick Filters */}
      {accounts.length > 1 && (
        <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {["all", ...accounts.map((a) => a.id)].map((id) => {
              const isActive = selectedAccountFilter === id;
              const label = id === "all" ? "All Accounts" : accounts.find((a) => a.id === id)?.name ?? id;
              return (
                <TouchableOpacity
                  key={id}
                  onPress={() => setSelectedAccountFilter(id)}
                  style={{
                    paddingVertical: 5,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                    marginRight: 6,
                    backgroundColor: isActive ? "#121214" : "#EAEAE5",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: isActive ? "#FFFFFF" : "#71717A",
                    }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Transaction Count */}
      {filteredTransactions.length > 0 && (
        <View style={{ paddingHorizontal: 20, marginBottom: 6 }}>
          <Text style={{ fontSize: 11, color: "#A1A1AA", fontWeight: "600" }}>
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      {/* Transaction List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredTransactions.length === 0 ? (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 24,
              padding: 48,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#EAEAE5",
              marginTop: 4,
            }}
          >
            <Search size={28} color="#D4D4D8" />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: "#71717A",
                marginTop: 12,
              }}
            >
              {searchQuery ? "No matches found" : "No transactions yet"}
            </Text>
            <Text style={{ fontSize: 12, color: "#A1A1AA", marginTop: 4, textAlign: "center" }}>
              {searchQuery
                ? "Try a different keyword or clear the filter"
                : "Tap + to record your first transaction"}
            </Text>
          </View>
        ) : (
          filteredTransactions.map((tx) => {
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
                {/* Left: icon + details */}
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 12 }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isIncome ? "#E6FBF2" : isTransfer ? "#EBF4FF" : "#FEECEB",
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

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 13, fontWeight: "700", color: "#121214" }}
                      numberOfLines={1}
                    >
                      {tx.description}
                    </Text>
                    <Text style={{ fontSize: 11, color: "#A1A1AA", marginTop: 2 }}>
                      {tx.account?.name ?? "Account"} ·{" "}
                      {new Date(tx.transaction_date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </Text>

                    {/* Platform & UPI badges */}
                    {(tx.platform || tx.upi_app || tx.payment_mode) && (
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 6,
                          marginTop: 5,
                          flexWrap: "wrap",
                        }}
                      >
                        {tx.platform && (
                          <View
                            style={{
                              backgroundColor: "#F7F7F5",
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 999,
                              borderWidth: 1,
                              borderColor: "#EAEAE5",
                            }}
                          >
                            <Text style={{ fontSize: 10, fontWeight: "700", color: "#52525B" }}>
                              {tx.platform}
                            </Text>
                          </View>
                        )}
                        {tx.upi_app ? (
                          <View
                            style={{
                              backgroundColor: "#FFF4D2",
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 999,
                            }}
                          >
                            <Text style={{ fontSize: 10, fontWeight: "800", color: "#B45309" }}>
                              {tx.upi_app === "gpay"
                                ? "GPay"
                                : tx.upi_app === "phonepe"
                                ? "PhonePe"
                                : (tx.upi_app as string).toUpperCase()}
                            </Text>
                          </View>
                        ) : tx.payment_mode ? (
                          <View
                            style={{
                              backgroundColor: "#F0EFEA",
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 999,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: "600",
                                color: "#71717A",
                                textTransform: "capitalize",
                              }}
                            >
                              {tx.payment_mode}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    )}

                    {tx.notes ? (
                      <Text
                        style={{
                          fontSize: 11,
                          color: "#A1A1AA",
                          fontStyle: "italic",
                          marginTop: 3,
                        }}
                        numberOfLines={1}
                      >
                        "{tx.notes}"
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Right: amount + delete */}
                <View style={{ alignItems: "flex-end", paddingLeft: 8 }}>
                  <FinancialAmount
                    amountPaise={tx.amount_paise}
                    type={isIncome ? "income" : isTransfer ? "neutral" : "expense"}
                    prefix={isIncome ? "+" : isTransfer ? "" : "-"}
                    className="text-sm font-black"
                  />
                  <TouchableOpacity
                    onPress={() => handleDelete(tx.id, tx.description)}
                    style={{ padding: 6, marginTop: 2, opacity: 0.35 }}
                    activeOpacity={1}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={13} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
