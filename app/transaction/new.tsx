import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  Platform as RNPlatform,
  KeyboardAvoidingView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  CreditCard,
  Wallet,
  Tag,
  AlignLeft,
  X,
  Smartphone,
  Globe,
  Plus,
  Trash2,
} from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { Caption } from "@/components/ui/typography";
import { TransactionType, PaymentMode, UPIApp } from "@/types";
import { useFinanceStore } from "@/store/useFinanceStore";
import { rupeesToPaise } from "@/lib/utils";

const UPI_APPS: { id: UPIApp; label: string; color: string }[] = [
  { id: "gpay", label: "Google Pay", color: "#4285F4" },
  { id: "phonepe", label: "PhonePe", color: "#5f259f" },
  { id: "paytm", label: "Paytm", color: "#00b9f5" },
  { id: "cred", label: "CRED UPI", color: "#121214" },
  { id: "amazon_pay", label: "Amazon Pay", color: "#FF9900" },
  { id: "bhim", label: "BHIM", color: "#00796B" },
];

export default function NewTransactionScreen() {
  const insets = useSafeAreaInsets();
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

  // Platform & UPI tracking
  const [platform, setPlatform] = useState<string>("Swiggy");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("upi");
  const [upiApp, setUpiApp] = useState<UPIApp>("gpay");

  // Custom Platform Modal State
  const [platformModalVisible, setPlatformModalVisible] = useState(false);
  const [newPlatformInput, setNewPlatformInput] = useState("");

  const accounts = useFinanceStore((s) => s.accounts);
  const categories = useFinanceStore((s) => s.categories);
  const addTransaction = useFinanceStore((s) => s.addTransaction);
  const customPlatforms = useFinanceStore((s) => s.customPlatforms);
  const addPlatform = useFinanceStore((s) => s.addPlatform);
  const deletePlatform = useFinanceStore((s) => s.deletePlatform);

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

  const handleSelectPlatform = (platName: string) => {
    setPlatform(platName);
    if (!description.trim() || customPlatforms.some((p) => p === description)) {
      setDescription(`${platName} Order`);
    }
  };

  const handleAddNewCustomPlatform = () => {
    const trimmed = newPlatformInput.trim();
    if (!trimmed) {
      Alert.alert("Name Required", "Please enter merchant / platform name");
      return;
    }
    addPlatform(trimmed);
    setPlatform(trimmed);
    if (!description.trim()) {
      setDescription(`${trimmed} Payment`);
    }
    setNewPlatformInput("");
    setPlatformModalVisible(false);
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
        : platform
        ? `${platform} Payment`
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
      platform: type === "expense" ? platform : undefined,
      payment_mode: paymentMode,
      upi_app: paymentMode === "upi" ? upiApp : undefined,
      transaction_date: new Date().toISOString(),
    });

    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F7F7F5" }}>
      {/* Header - Guaranteed Notch Clearance */}
      <View
        style={{
          paddingTop: Math.max(insets.top, RNPlatform.OS === "android" ? 44 : 20),
          paddingHorizontal: 20,
          paddingBottom: 10,
          backgroundColor: "#F7F7F5",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Caption>RECORD ENTRY</Caption>
          <Text className="text-xl font-black text-[#121214]">
            New Transaction
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-white border border-[#EAEAE5] items-center justify-center"
        >
          <X size={18} color="#121214" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={RNPlatform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={false}
        >
        {/* Type Toggle Tabs */}
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
        <View className="bg-white rounded-[28px] p-6 mb-5 items-center border border-[#EAEAE5] shadow-sm">
          <Caption className="text-center mb-1">ENTER AMOUNT (₹)</Caption>
          <View className="flex-row items-center justify-center mb-3">
            <Text className="text-3xl font-black text-[#A1A1AA] mr-1">₹</Text>
            <Input
              value={amountStr}
              onChangeText={setAmountStr}
              placeholder="0.00"
              keyboardType="numeric"
              className="text-4xl font-black text-[#121214] text-center tracking-tight"
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

        {/* Online Platform / Merchant Selector (Customizable & user-added) */}
        {type === "expense" && (
          <View className="mb-5">
            <View className="flex-row items-center justify-between mb-2 px-1">
              <View className="flex-row items-center gap-1.5">
                <Globe size={15} color="#71717A" strokeWidth={2.4} />
                <Text className="text-xs font-black text-[#121214] uppercase tracking-wider">
                  Platform / Merchant
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPlatformModalVisible(true)}
                className="flex-row items-center gap-1 bg-[#F7F7F5] px-2.5 py-0.5 rounded-full border border-[#EAEAE5]"
              >
                <Plus size={12} color="#121214" strokeWidth={2.5} />
                <Text className="text-[11px] font-bold text-[#121214]">Add Custom</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {customPlatforms.map((platName) => {
                const isSelected = platform === platName;
                return (
                  <TouchableOpacity
                    key={platName}
                    onPress={() => handleSelectPlatform(platName)}
                    style={{
                      paddingHorizontal: 13,
                      paddingVertical: 8,
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
                        fontWeight: "800",
                        color: "#121214",
                      }}
                    >
                      {platName}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                onPress={() => setPlatformModalVisible(true)}
                style={{
                  paddingHorizontal: 13,
                  paddingVertical: 8,
                  borderRadius: 9999,
                  marginRight: 8,
                  backgroundColor: "#F7F7F5",
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: "#71717A",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Plus size={13} color="#121214" />
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#121214" }}>
                  + New
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Payment Mode & UPI App Selector (Requested by user) */}
        {type !== "transfer" && (
          <View className="mb-5">
            <View className="flex-row items-center gap-1.5 mb-2 px-1">
              <Smartphone size={15} color="#71717A" strokeWidth={2.4} />
              <Text className="text-xs font-black text-[#121214] uppercase tracking-wider">
                Payment Mode & UPI App
              </Text>
            </View>

            {/* Mode Selector */}
            <View className="flex-row gap-2 mb-2.5">
              {[
                { id: "upi", label: "UPI" },
                { id: "card", label: "Card" },
                { id: "cash", label: "Cash" },
                { id: "netbanking", label: "NetBanking" },
              ].map((m) => {
                const isSelected = paymentMode === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => setPaymentMode(m.id as PaymentMode)}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 14,
                      alignItems: "center",
                      backgroundColor: isSelected ? "#121214" : "#FFFFFF",
                      borderWidth: 1,
                      borderColor: isSelected ? "#121214" : "#EAEAE5",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "800",
                        color: isSelected ? "#FFFFFF" : "#71717A",
                      }}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* UPI Apps Selector */}
            {paymentMode === "upi" && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mt-1">
                {UPI_APPS.map((app) => {
                  const isSelected = upiApp === app.id;
                  return (
                    <TouchableOpacity
                      key={app.id}
                      onPress={() => setUpiApp(app.id)}
                      style={{
                        paddingHorizontal: 13,
                        paddingVertical: 7,
                        borderRadius: 9999,
                        marginRight: 6,
                        backgroundColor: isSelected ? "#FFC83B" : "#FFFFFF",
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
                        {app.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}

        {/* Source Account Selection */}
        <View className="mb-5">
          <View className="flex-row items-center gap-1.5 mb-2 px-1">
            <Wallet size={15} color="#71717A" strokeWidth={2.4} />
            <Text className="text-xs font-black text-[#121214] uppercase tracking-wider">
              {type === "transfer" ? "Source Account" : "Paid From Account"}
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
              <Text className="text-xs font-black text-[#121214] uppercase tracking-wider">
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
              <Text className="text-xs font-black text-[#121214] uppercase tracking-wider">
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
        <View className="bg-white rounded-[28px] p-5 mb-6 border border-[#EAEAE5] shadow-sm">
          <Input
            label="Description / Title"
            placeholder="e.g. Swiggy Order, Grocery, Rent"
            value={description}
            onChangeText={setDescription}
            leftElement={<AlignLeft size={16} color="#71717A" />}
          />
          <Input
            label="Notes (Optional)"
            placeholder="Reference ID or item details"
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
      </KeyboardAvoidingView>

      {/* Add Custom Platform / Merchant Modal */}
      <Modal
        visible={platformModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPlatformModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={RNPlatform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-[32px] p-6 pb-10">
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-lg font-black text-[#121214]">
                    Add Custom Platform / Merchant
                  </Text>
                  <Caption>Add any app, website, or local store</Caption>
                </View>
                <TouchableOpacity
                  onPress={() => setPlatformModalVisible(false)}
                  className="w-8 h-8 rounded-full bg-[#F7F7F5] items-center justify-center"
                >
                  <X size={16} color="#121214" />
                </TouchableOpacity>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
                showsVerticalScrollIndicator={false}
              >
                <Input
                  label="Merchant / Platform Name"
                  placeholder="e.g. Zepto, Myntra, Local Bakery, Cult.fit"
                  value={newPlatformInput}
                  onChangeText={setNewPlatformInput}
                  containerClassName="mb-6"
                />

                <TouchableOpacity
                  onPress={handleAddNewCustomPlatform}
                  style={{
                    backgroundColor: "#121214",
                    paddingVertical: 14,
                    borderRadius: 9999,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
                    Save & Select Platform
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
