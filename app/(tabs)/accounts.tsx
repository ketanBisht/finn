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
import { Input } from "@/components/ui/input";
import { Caption, FinancialAmount } from "@/components/ui/typography";
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

  // Calculate physical cash total from denominations
  const totalCashCalculated =
    (parseInt(notes500) || 0) * 500 +
    (parseInt(notes200) || 0) * 200 +
    (parseInt(notes100) || 0) * 100 +
    (parseInt(notes50) || 0) * 50 +
    (parseInt(notes20) || 0) * 20 +
    (parseInt(notes10) || 0) * 10;

  // Find physical cash account if available
  const cashAccount = accounts.find((a) => a.type === "cash");

  const handleSyncCashAccount = () => {
    if (!cashAccount) {
      Alert.alert(
        "No Cash Account",
        "Create an account of type 'Cash Wallet' first to sync denominations."
      );
      return;
    }

    updateAccount(cashAccount.id, {
      current_balance_paise: rupeesToPaise(totalCashCalculated),
    });

    Alert.alert(
      "Reconciled!",
      `Updated ${cashAccount.name} balance to ₹${totalCashCalculated.toLocaleString("en-IN")}`
    );
    setCashCounterVisible(false);
  };

  const resetCounter = () => {
    setNotes500("");
    setNotes200("");
    setNotes100("");
    setNotes50("");
    setNotes20("");
    setNotes10("");
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F7F7F5] dark:bg-[#0E0E10]" edges={["top"]}>
      {/* Top Header */}
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <View>
          <Caption>PORTFOLIO</Caption>
          <Text className="text-xl font-black text-[#121214] dark:text-[#F4F4F5]">
            Accounts & Wallets
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setAccountModalVisible(true)}
          className="w-9 h-9 bg-[#FFC83B] rounded-full items-center justify-center border border-[#E8BC52]"
        >
          <Plus size={18} color="#121214" strokeWidth={2.6} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Warm Golden Portfolio Card */}
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
                Total Net Liquidity
              </Text>
              <Text style={{ fontSize: 24, fontWeight: "900", color: "#121214", marginTop: 2 }}>
                {formatCurrencyFromPaise(totalPaise)}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "#121214",
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 9999,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#FFFFFF" }}>
                {accounts.length} Active
              </Text>
            </View>
          </View>

          {/* Cash Denomination Quick Pill */}
          <TouchableOpacity
            onPress={() => setCashCounterVisible(true)}
            style={{
              backgroundColor: "#121214",
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 9999,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 4,
            }}
          >
            <Calculator size={16} color="#FFC83B" strokeWidth={2.4} />
            <Text style={{ fontSize: 13, fontWeight: "800", color: "#FFFFFF" }}>
              Physical Cash Denomination Counter
            </Text>
          </TouchableOpacity>
        </View>

        {/* Accounts List */}
        <View className="mb-4">
          <Text className="text-xs font-black text-[#121214] dark:text-[#F4F4F5] uppercase tracking-wider mb-3 px-1">
            Connected Accounts
          </Text>

          {accounts.map((acc) => {
            const isCash = acc.type === "cash";
            const isCurrent = acc.type === "current";

            return (
              <View
                key={acc.id}
                className="bg-white dark:bg-charcoal-900 rounded-[24px] p-4 mb-3 flex-row items-center justify-between border border-[#EAEAE5] dark:border-charcoal-800 shadow-sm"
              >
                <View className="flex-row items-center gap-3">
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 16,
                      backgroundColor: isCash ? "#FFF4D2" : isCurrent ? "#EBF4FF" : "#F7F7F5",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isCash ? (
                      <Coins size={20} color="#B45309" />
                    ) : isCurrent ? (
                      <CreditCard size={20} color="#2563EB" />
                    ) : (
                      <Building2 size={20} color="#121214" />
                    )}
                  </View>

                  <View>
                    <Text className="text-sm font-bold text-[#121214] dark:text-[#F4F4F5]">
                      {acc.name}
                    </Text>
                    <Text className="text-xs text-[#71717A] capitalize">
                      {acc.type.replace("_", " ")}
                    </Text>
                  </View>
                </View>

                <View className="items-end">
                  <FinancialAmount
                    amountPaise={acc.current_balance_paise}
                    type="neutral"
                    className="text-base font-black"
                  />
                  {isCash && (
                    <TouchableOpacity
                      onPress={() => setCashCounterVisible(true)}
                      className="mt-1"
                    >
                      <Text className="text-[11px] font-bold text-[#D97706]">
                        Reconcile Cash →
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Add Account Modal */}
      <Modal
        visible={accountModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAccountModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-charcoal-900 rounded-t-[32px] p-6 pb-10">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-black text-[#121214] dark:text-[#F4F4F5]">
                Add New Account
              </Text>
              <TouchableOpacity
                onPress={() => setAccountModalVisible(false)}
                className="w-8 h-8 rounded-full bg-[#F7F7F5] items-center justify-center"
              >
                <X size={16} color="#121214" />
              </TouchableOpacity>
            </View>

            <Input
              label="Account Name"
              placeholder="e.g. HDFC Salary, Cash Wallet"
              value={name}
              onChangeText={setName}
            />

            {/* Type Selector */}
            <Text className="text-xs font-bold text-[#71717A] uppercase tracking-wider mb-2">
              Account Type
            </Text>
            <View className="flex-row gap-2 mb-4">
              {[
                { id: "savings", label: "Savings / Bank" },
                { id: "cash", label: "Cash Wallet" },
                { id: "current", label: "Current / Biz" },
              ].map((t) => {
                const isSelected = type === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setType(t.id as AccountType)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 14,
                      alignItems: "center",
                      backgroundColor: isSelected ? "#FFC83B" : "#F7F7F5",
                      borderWidth: 1,
                      borderColor: isSelected ? "#E8BC52" : "#EAEAE5",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "800",
                        color: "#121214",
                        textAlign: "center",
                      }}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              label="Current / Opening Balance (₹)"
              placeholder="0"
              keyboardType="numeric"
              value={openingBalanceStr}
              onChangeText={setOpeningBalanceStr}
              containerClassName="mb-6"
            />

            <TouchableOpacity
              onPress={handleCreateAccount}
              style={{
                backgroundColor: "#121214",
                paddingVertical: 14,
                borderRadius: 9999,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Cash Denomination Counter Modal */}
      <Modal
        visible={cashCounterVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCashCounterVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-charcoal-900 rounded-t-[32px] p-6 pb-10 max-h-[90%]">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-lg font-black text-[#121214] dark:text-[#F4F4F5]">
                  Cash Denomination Counter
                </Text>
                <Caption>Count physical Indian Rupee currency notes</Caption>
              </View>
              <TouchableOpacity
                onPress={() => setCashCounterVisible(false)}
                className="w-8 h-8 rounded-full bg-[#F7F7F5] items-center justify-center"
              >
                <X size={16} color="#121214" />
              </TouchableOpacity>
            </View>

            {/* Calculated Total Banner */}
            <View
              style={{
                backgroundColor: "#F6CB68",
                borderRadius: 20,
                padding: 16,
                marginBottom: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1,
                borderColor: "#E8BC52",
              }}
            >
              <View>
                <Text style={{ fontSize: 11, fontWeight: "800", color: "#121214", opacity: 0.7, textTransform: "uppercase" }}>
                  Physical Cash Total
                </Text>
                <Text style={{ fontSize: 22, fontWeight: "900", color: "#121214", marginTop: 2 }}>
                  ₹{totalCashCalculated.toLocaleString("en-IN")}
                </Text>
              </View>

              <TouchableOpacity
                onPress={resetCounter}
                className="p-2 bg-white rounded-full shadow-sm"
              >
                <RotateCcw size={16} color="#121214" />
              </TouchableOpacity>
            </View>

            <ScrollView className="mb-4">
              {[
                { denom: 500, val: notes500, set: setNotes500 },
                { denom: 200, val: notes200, set: setNotes200 },
                { denom: 100, val: notes100, set: setNotes100 },
                { denom: 50, val: notes50, set: setNotes50 },
                { denom: 20, val: notes20, set: setNotes20 },
                { denom: 10, val: notes10, set: setNotes10 },
              ].map(({ denom, val, set }) => {
                const count = parseInt(val) || 0;
                const subtotal = count * denom;

                return (
                  <View
                    key={denom}
                    className="flex-row items-center justify-between py-2 border-b border-[#F0EFEA] dark:border-charcoal-800"
                  >
                    <View className="flex-row items-center gap-2 w-20">
                      <Text className="text-sm font-black text-[#121214] dark:text-[#F4F4F5]">
                        ₹{denom}
                      </Text>
                    </View>

                    {/* Stepper +/- */}
                    <View className="flex-row items-center gap-2">
                      <TouchableOpacity
                        onPress={() => adjustNote(val, set, -1)}
                        className="w-8 h-8 rounded-full bg-[#F7F7F5] items-center justify-center border border-[#EAEAE5]"
                      >
                        <Minus size={14} color="#121214" />
                      </TouchableOpacity>

                      <TextInput
                        placeholder="0"
                        keyboardType="numeric"
                        value={val}
                        onChangeText={set}
                        placeholderTextColor="#A1A1AA"
                        style={{
                          width: 48,
                          height: 36,
                          textAlign: "center",
                          fontSize: 14,
                          fontWeight: "800",
                          color: "#121214",
                          backgroundColor: "#F7F7F5",
                          borderRadius: 10,
                        }}
                      />

                      <TouchableOpacity
                        onPress={() => adjustNote(val, set, 1)}
                        className="w-8 h-8 rounded-full bg-[#FFC83B] items-center justify-center border border-[#E8BC52]"
                      >
                        <Plus size={14} color="#121214" />
                      </TouchableOpacity>
                    </View>

                    <Text className="text-sm font-black text-[#121214] dark:text-[#F4F4F5] w-20 text-right">
                      ₹{subtotal.toLocaleString("en-IN")}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={handleSyncCashAccount}
              style={{
                backgroundColor: "#121214",
                paddingVertical: 14,
                borderRadius: 9999,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
                Reconcile & Update Cash Account
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
