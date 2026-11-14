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
  Wallet,
  Plus,
  CreditCard,
  Building2,
  Banknote,
  Coins,
  Calculator,
  X,
  CheckCircle2,
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
            className="p-2.5 bg-slate-200 dark:bg-slate-800 rounded-full flex-row items-center justify-center"
          >
            <Banknote size={18} color="#059669" />
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
        <View className="bg-slate-900 rounded-3xl p-6 mb-5 border border-slate-800">
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
          className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl mb-5 border border-emerald-200 dark:border-emerald-800/60 flex-row items-center justify-between"
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
          <Badge label="Open" variant="success" size="sm" />
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

      {/* Cash Counter / Physical Wallet Reconciliation Modal */}
      <Modal visible={cashCounterVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 max-h-[85%]">
            <View className="flex-row items-center justify-between mb-4">
              <Heading className="text-lg">Cash Denomination Count</Heading>
              <TouchableOpacity onPress={() => setCashCounterVisible(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="bg-emerald-600 rounded-2xl p-4 mb-4">
                <Text className="text-xs text-emerald-100 font-semibold uppercase">Total Counted</Text>
                <Text className="text-white text-2xl font-bold mt-1">₹{countedCashRupees}</Text>
                <Text className="text-emerald-200 text-xs mt-1">
                  App Cash Balance: ₹{cashAccountRupees} (Diff: {cashDifference >= 0 ? "+" : ""}₹{cashDifference})
                </Text>
              </View>

              {[
                { denom: "₹500", val: notes500, set: setNotes500 },
                { denom: "₹200", val: notes200, set: setNotes200 },
                { denom: "₹100", val: notes100, set: setNotes100 },
                { denom: "₹50", val: notes50, set: setNotes50 },
                { denom: "₹20", val: notes20, set: setNotes20 },
                { denom: "₹10", val: notes10, set: setNotes10 },
              ].map((row) => (
                <View key={row.denom} className="flex-row items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 w-16">{row.denom}</Text>
                  <Input
                    placeholder="0"
                    keyboardType="number-pad"
                    value={row.val}
                    onChangeText={row.set}
                    containerClassName="w-28 mb-0"
                    className="text-right py-1.5"
                  />
                  <Text className="text-xs font-semibold text-slate-500 w-24 text-right">
                    = ₹{(parseInt(row.val) || 0) * parseInt(row.denom.replace("₹", ""))}
                  </Text>
                </View>
              ))}

              <Button
                title="Done Counting"
                variant="primary"
                className="mt-5 mb-4"
                onPress={() => setCashCounterVisible(false)}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
