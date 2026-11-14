import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Wallet,
  Plus,
  Minus,
  CreditCard,
  Building2,
  Coins,
  Calculator,
  X,
  CheckCircle2,
  RotateCcw,
} from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heading, Subheading, Caption, FinancialAmount } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { useFinanceStore } from "@/store/useFinanceStore";
import { AccountType } from "@/types";
import { formatCurrencyFromPaise, rupeesToPaise } from "@/lib/utils";

export default function AccountsScreen() {
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [cashCounterVisible, setCashCounterVisible] = useState(false);

  // New account form state
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("savings");
  const [openingBalanceStr, setOpeningBalanceStr] = useState("0");

  // Cash counter state (number of notes)
  const [notes500, setNotes500] = useState("");
  const [notes200, setNotes200] = useState("");
  const [notes100, setNotes100] = useState("");
  const [notes50, setNotes50] = useState("");
  const [notes20, setNotes20] = useState("");
  const [notes10, setNotes10] = useState("");

  const accounts = useFinanceStore((s) => s.accounts);
  const addAccount = useFinanceStore((s) => s.addAccount);
  const updateAccount = useFinanceStore((s) => s.updateAccount);

  const totalPaise = accounts.reduce((sum, a) => sum + a.current_balance_paise, 0);

  const handleCreateAccount = () => {
    if (!name.trim()) {
      Alert.alert("Name Required", "Please enter an account name");
      return;
    }

    const openingPaise = rupeesToPaise(parseFloat(openingBalanceStr) || 0);

    addAccount({
      user_id: "local-user",
      name: name.trim(),
      type,
      opening_balance_paise: openingPaise,
      currency: "INR",
      is_active: true,
    });

    setName("");
    setOpeningBalanceStr("0");
    setAccountModalVisible(false);
  };

  // Stepper increment / decrement helpers
  const adjustNote = (current: string, setter: (val: string) => void, delta: number) => {
    const num = Math.max(0, (parseInt(current) || 0) + delta);
    setter(num === 0 ? "" : num.toString());
  };

  const handleResetCounter = () => {
    setNotes500("");
    setNotes200("");
    setNotes100("");
    setNotes50("");
    setNotes20("");
    setNotes10("");
  };

  // Calculated physical cash count in rupees
  const countedCashRupees =
    (parseInt(notes500) || 0) * 500 +
    (parseInt(notes200) || 0) * 200 +
    (parseInt(notes100) || 0) * 100 +
    (parseInt(notes50) || 0) * 50 +
    (parseInt(notes20) || 0) * 20 +
    (parseInt(notes10) || 0) * 10;

  const cashAccount = accounts.find((a) => a.type === "cash");
  const cashAccountRupees = cashAccount ? cashAccount.current_balance_paise / 100 : 0;
  const cashDifference = countedCashRupees - cashAccountRupees;

  const handleApplyCashReconciliation = () => {
    if (!cashAccount) {
      Alert.alert("No Cash Account", "No cash account found to update.");
      return;
    }

    Alert.alert(
      "Reconcile Cash Balance",
      `Update your "${cashAccount.name}" balance from ₹${cashAccountRupees} to ₹${countedCashRupees}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Update Balance",
          onPress: () => {
            updateAccount(cashAccount.id, {
              current_balance_paise: countedCashRupees * 100,
            });
            setCashCounterVisible(false);
          },
        },
      ]
    );
  };

  const denominationRows = [
    { denom: 500, val: notes500, set: setNotes500, color: "#64748b" },
    { denom: 200, val: notes200, set: setNotes200, color: "#f97316" },
    { denom: 100, val: notes100, set: setNotes100, color: "#6366f1" },
    { denom: 50, val: notes50, set: setNotes50, color: "#06b6d4" },
    { denom: 20, val: notes20, set: setNotes20, color: "#84cc16" },
    { denom: 10, val: notes10, set: setNotes10, color: "#a16207" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <View className="px-5 pt-3 pb-3 flex-row items-center justify-between">
        <View>
          <Caption>PORTFOLIO</Caption>
          <Heading className="text-xl">Accounts & Wallets</Heading>
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => setCashCounterVisible(true)}
            className="p-2.5 bg-slate-200 dark:bg-slate-800 rounded-full flex-row items-center justify-center shadow-sm"
          >
            <Calculator size={18} color="#059669" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setAccountModalVisible(true)}
            className="p-2.5 bg-emerald-600 rounded-full flex-row items-center justify-center shadow-sm"
          >
            <Plus size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60 }}
      >
        {/* Total Assets Summary Card */}
        <View className="bg-slate-900 rounded-3xl p-6 mb-5 border border-slate-800 shadow-xl">
          <Text className="text-slate-400 text-xs font-semibold tracking-wider uppercase mb-1">
            Total Liquid Balance
          </Text>
          <FinancialAmount
            amountPaise={totalPaise}
            prefix="₹"
            className="text-white text-3xl font-extrabold"
          />
          <Text className="text-slate-400 text-xs mt-2">
            Distributed across {accounts.length} active wallets and bank accounts
          </Text>
        </View>

        {/* Cash Count Banner */}
        <TouchableOpacity
          onPress={() => setCashCounterVisible(true)}
          className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl mb-5 border border-emerald-200 dark:border-emerald-800/60 flex-row items-center justify-between shadow-sm active:opacity-90"
        >
          <View className="flex-row items-center gap-3">
            <View className="p-2.5 bg-emerald-600 rounded-xl">
              <Calculator size={18} color="#ffffff" />
            </View>
            <View>
              <Text className="text-xs font-bold text-emerald-950 dark:text-emerald-100">
                Physical Cash Calculator
              </Text>
              <Text className="text-xs text-emerald-700 dark:text-emerald-300">
                Count notes in your physical wallet
              </Text>
            </View>
          </View>
          <Badge label="Count Now" variant="success" size="sm" />
        </TouchableOpacity>

        {/* Accounts List */}
        <Subheading className="text-base mb-3">All Accounts</Subheading>
        {accounts.map((acc) => {
          const isCash = acc.type === "cash";
          const isSavings = acc.type === "savings";

          return (
            <Card key={acc.id} className="p-4 mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3.5">
                <View
                  className={`w-11 h-11 rounded-2xl items-center justify-center ${
                    isCash
                      ? "bg-amber-100 dark:bg-amber-950"
                      : isSavings
                      ? "bg-blue-100 dark:bg-blue-950"
                      : "bg-purple-100 dark:bg-purple-950"
                  }`}
                >
                  {isCash ? (
                    <Coins size={20} color="#d97706" />
                  ) : isSavings ? (
                    <Building2 size={20} color="#2563eb" />
                  ) : (
                    <CreditCard size={20} color="#9333ea" />
                  )}
                </View>
                <View>
                  <Text className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {acc.name}
                  </Text>
                  <Text className="text-xs text-slate-400 capitalize mt-0.5">
                    {acc.type} Account
                  </Text>
                </View>
              </View>

              <FinancialAmount
                amountPaise={acc.current_balance_paise}
                type="neutral"
                prefix="₹"
                className="text-sm font-bold"
              />
            </Card>
          );
        })}
      </ScrollView>

      {/* Add Account Modal */}
      <Modal visible={accountModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Heading className="text-lg">Add New Account</Heading>
              <TouchableOpacity onPress={() => setAccountModalVisible(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Input
              label="Account Name"
              placeholder="e.g. ICICI Bank, Petty Cash, PayTM"
              value={name}
              onChangeText={setName}
            />

            <Caption className="mb-2">ACCOUNT TYPE</Caption>
            <View className="flex-row gap-2 mb-4">
              {(["cash", "savings", "current", "other"] as AccountType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setType(t)}
                  className={`flex-1 py-2.5 rounded-xl items-center justify-center border capitalize ${
                    type === t
                      ? "bg-emerald-600 border-emerald-600"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold capitalize ${
                      type === t ? "text-white" : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Opening Balance (₹)"
              placeholder="0.00"
              keyboardType="numeric"
              value={openingBalanceStr}
              onChangeText={setOpeningBalanceStr}
            />

            <Button
              title="Create Account"
              variant="primary"
              onPress={handleCreateAccount}
              className="mt-2"
            />
          </View>
        </View>
      </Modal>

      {/* Physical Cash Denomination Reconciliation Modal */}
      <Modal visible={cashCounterVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 max-h-[90%]">
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Caption>PHYSICAL RECONCILIATION</Caption>
                <Heading className="text-lg">Cash Counter</Heading>
              </View>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={handleResetCounter}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800"
                >
                  <RotateCcw size={16} color="#64748b" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setCashCounterVisible(false)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800"
                >
                  <X size={18} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Total Counted Banner */}
            <View className="bg-emerald-600 rounded-2xl p-4 mb-4 shadow-md">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-emerald-100 font-semibold uppercase tracking-wider">
                  Total Counted Cash
                </Text>
                <Badge
                  label={cashDifference === 0 ? "Balanced ✓" : cashDifference > 0 ? `+₹${cashDifference}` : `-₹${Math.abs(cashDifference)}`}
                  variant={cashDifference === 0 ? "success" : cashDifference > 0 ? "warning" : "danger"}
                  size="sm"
                  className="bg-white/20 text-white"
                />
              </View>
              <Text className="text-white text-3xl font-extrabold mt-1">₹{countedCashRupees.toLocaleString("en-IN")}</Text>
              <Text className="text-emerald-100 text-xs mt-1">
                App Cash Balance: ₹{cashAccountRupees.toLocaleString("en-IN")}
              </Text>
            </View>

            {/* Denomination Stepper Rows */}
            <ScrollView showsVerticalScrollIndicator={false} className="mb-2">
              {denominationRows.map((row) => {
                const count = parseInt(row.val) || 0;
                const rowTotal = count * row.denom;

                return (
                  <View
                    key={row.denom}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 8,
                      borderBottomWidth: 1,
                      borderBottomColor: "#f1f5f9",
                    }}
                  >
                    {/* Denomination Badge */}
                    <View
                      style={{
                        width: 70,
                        paddingVertical: 6,
                        paddingHorizontal: 8,
                        borderRadius: 12,
                        backgroundColor: "#f8fafc",
                        borderWidth: 1,
                        borderColor: "#e2e8f0",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "800", color: row.color }}>
                        ₹{row.denom}
                      </Text>
                    </View>

                    {/* Stepper with explicit visible TextInput */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => adjustNote(row.val, row.set, -1)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          backgroundColor: "#f1f5f9",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Minus size={14} color="#475569" />
                      </TouchableOpacity>

                      <View
                        style={{
                          width: 52,
                          height: 36,
                          borderRadius: 10,
                          borderWidth: 1.5,
                          borderColor: count > 0 ? "#10b981" : "#cbd5e1",
                          backgroundColor: "#ffffff",
                          justifyContent: "center",
                        }}
                      >
                        <TextInput
                          value={row.val}
                          onChangeText={(text) => row.set(text.replace(/[^0-9]/g, ""))}
                          placeholder="0"
                          placeholderTextColor="#94a3b8"
                          keyboardType="number-pad"
                          style={{
                            fontSize: 15,
                            fontWeight: "800",
                            color: "#0f172a", // Explicit high-contrast text color
                            textAlign: "center",
                            padding: 0,
                          }}
                        />
                      </View>

                      <TouchableOpacity
                        onPress={() => adjustNote(row.val, row.set, 1)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          backgroundColor: "#10b981",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Plus size={14} color="#ffffff" />
                      </TouchableOpacity>
                    </View>

                    {/* Subtotal */}
                    <View style={{ width: 85, alignItems: "flex-end" }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: count > 0 ? "#0f172a" : "#94a3b8",
                        }}
                      >
                        ₹{rowTotal.toLocaleString("en-IN")}
                      </Text>
                    </View>
                  </View>
                );
              })}

              {/* Action Buttons */}
              <View style={{ gap: 10, marginTop: 16, marginBottom: 20 }}>
                {cashDifference !== 0 && (
                  <Button
                    title={`Reconcile Cash to ₹${countedCashRupees.toLocaleString("en-IN")}`}
                    variant="primary"
                    onPress={handleApplyCashReconciliation}
                  />
                )}
                <Button
                  title="Done Counting"
                  variant={cashDifference === 0 ? "primary" : "outline"}
                  onPress={() => setCashCounterVisible(false)}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
