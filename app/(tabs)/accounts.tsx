import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Wallet,
  Plus,
  Minus,
  CreditCard,
  Building2,
  Coins,
  Calculator,
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Smartphone,
  TrendingUp,
} from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { Caption, FinancialAmount } from "@/components/ui/typography";
import { useFinanceStore } from "@/store/useFinanceStore";
import { Account, AccountType } from "@/types";
import { formatCurrencyFromPaise, rupeesToPaise } from "@/lib/utils";

export default function AccountsScreen() {
  const insets = useSafeAreaInsets();
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [cashCounterVisible, setCashCounterVisible] = useState(false);

  // New account form state
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("savings");
  const [openingBalanceStr, setOpeningBalanceStr] = useState("");

  // Edit account state
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<AccountType>("savings");
  const [editBalanceStr, setEditBalanceStr] = useState("");

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
  const deleteAccount = useFinanceStore((s) => s.deleteAccount);

  const totalPaise = accounts.reduce((sum, a) => sum + (a.is_active ? a.current_balance_paise : 0), 0);

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
    setOpeningBalanceStr("");
    setAccountModalVisible(false);
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setEditName(acc.name);
    setEditType(acc.type);
    setEditBalanceStr((acc.current_balance_paise / 100).toString());
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editingAccount) return;
    if (!editName.trim()) {
      Alert.alert("Name Required", "Please enter an account name");
      return;
    }

    const newBalancePaise = rupeesToPaise(parseFloat(editBalanceStr) || 0);

    updateAccount(editingAccount.id, {
      name: editName.trim(),
      type: editType,
      current_balance_paise: newBalancePaise,
    });

    setEditModalVisible(false);
    setEditingAccount(null);
  };

  const handleDeleteAccount = () => {
    if (!editingAccount) return;
    if (accounts.length <= 1) {
      Alert.alert("Cannot Delete", "You must keep at least one active account.");
      return;
    }

    Alert.alert(
      "Delete Account",
      `Are you sure you want to delete "${editingAccount.name}"? Transactions linked to this account will also be removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteAccount(editingAccount.id);
            setEditModalVisible(false);
            setEditingAccount(null);
          },
        },
      ]
    );
  };

  // Stepper increment / decrement helpers for cash counter
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

  const getAccountIcon = (accType: AccountType) => {
    switch (accType) {
      case "cash":
        return <Coins size={20} color="#B45309" />;
      case "wallet":
        return <Smartphone size={20} color="#00b9f5" />;
      case "investment":
        return <TrendingUp size={20} color="#059669" />;
      case "credit_card":
        return <CreditCard size={20} color="#2563EB" />;
      case "current":
      case "savings":
      default:
        return <Building2 size={20} color="#121214" />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F7F7F5" }}>
      {/* Top Header - Guaranteed Notch & Status Bar Clearance */}
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
          <Caption>PORTFOLIO & WALLETS</Caption>
          <Text className="text-xl font-black text-[#121214]">
            Accounts & Wallets
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            setName("");
            setOpeningBalanceStr("");
            setType("savings");
            setAccountModalVisible(true);
          }}
          className="w-9 h-9 bg-[#FFC83B] rounded-full items-center justify-center border border-[#E8BC52]"
        >
          <Plus size={18} color="#121214" strokeWidth={2.6} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Warm Golden Net Worth Card */}
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
              <Text style={{ fontSize: 26, fontWeight: "900", color: "#121214", marginTop: 2 }}>
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
                {accounts.length} Accounts
              </Text>
            </View>
          </View>

          {/* Quick Cash Denomination & Add Buttons */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            <TouchableOpacity
              onPress={() => setCashCounterVisible(true)}
              style={{
                flex: 1,
                backgroundColor: "#121214",
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 9999,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Calculator size={15} color="#FFC83B" strokeWidth={2.4} />
              <Text style={{ fontSize: 12, fontWeight: "800", color: "#FFFFFF" }}>
                Cash Counter
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setAccountModalVisible(true)}
              style={{
                backgroundColor: "#FFFFFF",
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 9999,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                borderWidth: 1,
                borderColor: "#E8BC52",
              }}
            >
              <Plus size={15} color="#121214" strokeWidth={2.5} />
              <Text style={{ fontSize: 12, fontWeight: "800", color: "#121214" }}>
                Add New
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Accounts List */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-xs font-black text-[#121214] uppercase tracking-wider">
              Connected Accounts ({accounts.length})
            </Text>
            <Caption>Tap any account to edit</Caption>
          </View>

          {accounts.map((acc) => {
            const isCash = acc.type === "cash";
            const isWallet = acc.type === "wallet";
            const isInvest = acc.type === "investment";

            return (
              <TouchableOpacity
                key={acc.id}
                onPress={() => handleOpenEdit(acc)}
                activeOpacity={0.7}
                className="bg-white rounded-[24px] p-4 mb-3 flex-row items-center justify-between border border-[#EAEAE5] shadow-sm"
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 16,
                      backgroundColor: isCash
                        ? "#FFF4D2"
                        : isWallet
                        ? "#E0F2FE"
                        : isInvest
                        ? "#E6FBF2"
                        : "#F7F7F5",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {getAccountIcon(acc.type)}
                  </View>

                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-sm font-bold text-[#121214]" numberOfLines={1}>
                        {acc.name}
                      </Text>
                      {!acc.is_active && (
                        <View className="bg-[#EAEAE5] px-1.5 py-0.5 rounded">
                          <Text className="text-[9px] font-bold text-[#71717A]">Archived</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-xs text-[#71717A] capitalize mt-0.5">
                      {acc.type === "savings"
                        ? "Savings Bank"
                        : acc.type === "current"
                        ? "Current Account"
                        : acc.type === "wallet"
                        ? "UPI / Digital Wallet"
                        : acc.type === "investment"
                        ? "Investment"
                        : acc.type.replace("_", " ")}
                    </Text>
                  </View>
                </View>

                <View className="items-end pl-2">
                  <FinancialAmount
                    amountPaise={acc.current_balance_paise}
                    type="neutral"
                    className="text-base font-black"
                  />
                  <View className="flex-row items-center gap-1 mt-1">
                    <Edit2 size={12} color="#D97706" />
                    <Text className="text-[11px] font-bold text-[#D97706]">
                      Edit
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
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
          <View className="bg-white rounded-t-[32px] p-6 pb-10 max-h-[92%]">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-lg font-black text-[#121214]">
                  Add New Account or Wallet
                </Text>
                <Caption>Add any bank, UPI wallet, cash or investment</Caption>
              </View>
              <TouchableOpacity
                onPress={() => setAccountModalVisible(false)}
                className="w-8 h-8 rounded-full bg-[#F7F7F5] items-center justify-center"
              >
                <X size={16} color="#121214" />
              </TouchableOpacity>
            </View>

            <Input
              label="Account Name"
              placeholder="e.g. Salary Account, Everyday Bank, Travel Wallet"
              value={name}
              onChangeText={setName}
            />

            {/* Type Selector Pills */}
            <Text className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider mb-2">
              Account / Asset Type
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {[
                { id: "savings", label: "Savings Bank" },
                { id: "current", label: "Current / Biz" },
                { id: "wallet", label: "UPI Wallet" },
                { id: "cash", label: "Cash Wallet" },
                { id: "investment", label: "Investment" },
                { id: "credit_card", label: "Credit Card" },
              ].map((t) => {
                const isSelected = type === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setType(t.id as AccountType)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 13,
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
                      }}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              label="Opening Balance (₹)"
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
                Save Account
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Account Modal (Requested by user: edit bank account and manage) */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[32px] p-6 pb-10 max-h-[92%]">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-lg font-black text-[#121214]">
                  Edit Account
                </Text>
                <Caption>Update name, adjust balance or remove account</Caption>
              </View>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                className="w-8 h-8 rounded-full bg-[#F7F7F5] items-center justify-center"
              >
                <X size={16} color="#121214" />
              </TouchableOpacity>
            </View>

            <Input
              label="Account Name"
              placeholder="Account name"
              value={editName}
              onChangeText={setEditName}
            />

            {/* Type Selector Pills */}
            <Text className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider mb-2">
              Account Type
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {[
                { id: "savings", label: "Savings Bank" },
                { id: "current", label: "Current / Biz" },
                { id: "wallet", label: "UPI Wallet" },
                { id: "cash", label: "Cash Wallet" },
                { id: "investment", label: "Investment" },
                { id: "credit_card", label: "Credit Card" },
              ].map((t) => {
                const isSelected = editType === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setEditType(t.id as AccountType)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 13,
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
                      }}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              label="Adjust Current Balance (₹)"
              placeholder="0"
              keyboardType="numeric"
              value={editBalanceStr}
              onChangeText={setEditBalanceStr}
              helperText="Updates total balance immediately to match your bank statement"
              containerClassName="mb-6"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleDeleteAccount}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 18,
                  borderRadius: 9999,
                  backgroundColor: "#FEECEB",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Trash2 size={18} color="#EF4444" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveEdit}
                style={{
                  flex: 1,
                  backgroundColor: "#121214",
                  paddingVertical: 14,
                  borderRadius: 9999,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
                  Save Changes
                </Text>
              </TouchableOpacity>
            </View>
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
          <View className="bg-white rounded-t-[32px] p-6 pb-10 max-h-[90%]">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-lg font-black text-[#121214]">
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
                    className="flex-row items-center justify-between py-2 border-b border-[#F0EFEA]"
                  >
                    <View className="flex-row items-center gap-2 w-20">
                      <Text className="text-sm font-black text-[#121214]">
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

                    <Text className="text-sm font-black text-[#121214] w-20 text-right">
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
    </View>
  );
}
