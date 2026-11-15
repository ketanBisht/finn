import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Plus,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Trash2,
  Clock,
  TrendingDown,
  TrendingUp,
  HandCoins,
} from "lucide-react-native";
import { Caption } from "@/components/ui/typography";
import { Input } from "@/components/ui/input";
import { useFinanceStore } from "@/store/useFinanceStore";
import { formatCurrencyFromPaise, rupeesToPaise } from "@/lib/utils";
import { DebtDirection } from "@/types";

export default function DebtsScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"all" | "given" | "taken">("all");
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [settleModalVisible, setSettleModalVisible] = useState<string | null>(null);
  const [settleAmountStr, setSettleAmountStr] = useState("");

  // Add form
  const [direction, setDirection] = useState<DebtDirection>("given");
  const [personName, setPersonName] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const debts = useFinanceStore((s) => s.debts);
  const addDebt = useFinanceStore((s) => s.addDebt);
  const settleDebt = useFinanceStore((s) => s.settleDebt);
  const deleteDebt = useFinanceStore((s) => s.deleteDebt);

  const filtered = debts.filter((d) => {
    if (tab === "all") return true;
    return d.direction === tab;
  });

  const pendingOnly = debts.filter((d) => d.status !== "settled");
  const givenTotal = pendingOnly
    .filter((d) => d.direction === "given")
    .reduce((s, d) => s + (d.amount_paise - d.settled_paise), 0);
  const takenTotal = pendingOnly
    .filter((d) => d.direction === "taken")
    .reduce((s, d) => s + (d.amount_paise - d.settled_paise), 0);

  const resetForm = () => {
    setPersonName("");
    setAmountStr("");
    setDueDate("");
    setNotes("");
    setDirection("given");
  };

  const handleAdd = () => {
    if (!personName.trim()) {
      Alert.alert("Required", "Please enter a person's name.");
      return;
    }
    const paise = rupeesToPaise(parseFloat(amountStr) || 0);
    if (paise <= 0) {
      Alert.alert("Required", "Please enter an amount greater than 0.");
      return;
    }
    addDebt({
      user_id: "local-user",
      direction,
      person_name: personName.trim(),
      amount_paise: paise,
      settled_paise: 0,
      due_date: dueDate.trim() || undefined,
      notes: notes.trim() || undefined,
      status: "pending",
    });
    resetForm();
    setAddModalVisible(false);
  };

  const handleSettle = (id: string) => {
    const paise = rupeesToPaise(parseFloat(settleAmountStr) || 0);
    if (paise <= 0) {
      Alert.alert("Required", "Enter an amount to settle.");
      return;
    }
    settleDebt(id, paise);
    setSettleAmountStr("");
    setSettleModalVisible(null);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Remove Debt", `Remove debt entry for "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deleteDebt(id) },
    ]);
  };

  const statusColor = (status: string) => {
    if (status === "settled") return "#10B981";
    if (status === "partially_settled") return "#F59E0B";
    return "#EF4444";
  };

  const statusLabel = (status: string) => {
    if (status === "settled") return "Settled";
    if (status === "partially_settled") return "Partial";
    return "Pending";
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
          <Caption>LENDING & BORROWING</Caption>
          <Text style={{ fontSize: 20, fontWeight: "900", color: "#121214" }}>
            Debts
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => { resetForm(); setAddModalVisible(true); }}
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: "#E6FBF2",
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: "#6EE7B7",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <TrendingUp size={14} color="#059669" />
              <Text style={{ fontSize: 10, fontWeight: "800", color: "#059669", textTransform: "uppercase" }}>
                You Lent
              </Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#059669" }}>
              {formatCurrencyFromPaise(givenTotal)}
            </Text>
            <Text style={{ fontSize: 10, color: "#6EE7B7", fontWeight: "600", marginTop: 2 }}>
              Outstanding receivable
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: "#FEECEB",
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: "#FCA5A5",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <TrendingDown size={14} color="#DC2626" />
              <Text style={{ fontSize: 10, fontWeight: "800", color: "#DC2626", textTransform: "uppercase" }}>
                You Owe
              </Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#DC2626" }}>
              {formatCurrencyFromPaise(takenTotal)}
            </Text>
            <Text style={{ fontSize: 10, color: "#FCA5A5", fontWeight: "600", marginTop: 2 }}>
              Outstanding payable
            </Text>
          </View>
        </View>

        {/* Net Position */}
        {(givenTotal > 0 || takenTotal > 0) && (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              padding: 14,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#EAEAE5",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <HandCoins size={18} color="#B45309" />
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#121214" }}>
                Net Position
              </Text>
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "900",
                color: givenTotal >= takenTotal ? "#059669" : "#DC2626",
              }}
            >
              {givenTotal >= takenTotal ? "+" : "-"}
              {formatCurrencyFromPaise(Math.abs(givenTotal - takenTotal))}
            </Text>
          </View>
        )}

        {/* Filter Tabs */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
          {(["all", "given", "taken"] as const).map((t) => {
            const labels = { all: "All", given: "I Lent", taken: "I Borrowed" };
            const isActive = tab === t;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setTab(t)}
                style={{
                  paddingVertical: 7,
                  paddingHorizontal: 14,
                  borderRadius: 999,
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
                  {labels[t]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Debt List */}
        {filtered.length === 0 ? (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 24,
              padding: 48,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#EAEAE5",
            }}
          >
            <HandCoins size={28} color="#D4D4D8" />
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#71717A", marginTop: 12 }}>
              No debts recorded
            </Text>
            <Text style={{ fontSize: 12, color: "#A1A1AA", marginTop: 4 }}>
              Tap + to add a debt given or taken
            </Text>
          </View>
        ) : (
          filtered.map((debt) => {
            const outstanding = debt.amount_paise - debt.settled_paise;
            const isGiven = debt.direction === "given";
            const isSettled = debt.status === "settled";
            const pct = Math.round((debt.settled_paise / debt.amount_paise) * 100);

            return (
              <View
                key={debt.id}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 20,
                  padding: 16,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: isSettled ? "#D1FAE5" : "#EAEAE5",
                  opacity: isSettled ? 0.75 : 1,
                }}
              >
                {/* Top row */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 14,
                        backgroundColor: isGiven ? "#E6FBF2" : "#FEECEB",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isGiven
                        ? <ArrowUpRight size={18} color="#059669" />
                        : <ArrowDownLeft size={18} color="#DC2626" />
                      }
                    </View>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: "800", color: "#121214" }}>
                        {debt.person_name}
                      </Text>
                      <Text style={{ fontSize: 11, color: "#71717A", marginTop: 1 }}>
                        {isGiven ? "You lent" : "You borrowed"} · {formatCurrencyFromPaise(debt.amount_paise)}
                      </Text>
                    </View>
                  </View>

                  {/* Status badge */}
                  <View
                    style={{
                      backgroundColor: statusColor(debt.status) + "20",
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 999,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "800",
                        color: statusColor(debt.status),
                      }}
                    >
                      {statusLabel(debt.status)}
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                {!isSettled && (
                  <View style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={{ fontSize: 11, color: "#A1A1AA", fontWeight: "600" }}>
                        {formatCurrencyFromPaise(debt.settled_paise)} settled
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: "800", color: "#121214" }}>
                        {formatCurrencyFromPaise(outstanding)} left
                      </Text>
                    </View>
                    <View style={{ height: 5, backgroundColor: "#F0EFEA", borderRadius: 3, overflow: "hidden" }}>
                      <View
                        style={{
                          height: 5,
                          borderRadius: 3,
                          width: `${pct}%`,
                          backgroundColor: isGiven ? "#10B981" : "#F59E0B",
                        }}
                      />
                    </View>
                  </View>
                )}

                {/* Notes / due date */}
                {(debt.notes || debt.due_date) && (
                  <View style={{ flexDirection: "row", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                    {debt.due_date && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Clock size={11} color="#71717A" />
                        <Text style={{ fontSize: 11, color: "#71717A" }}>Due {debt.due_date}</Text>
                      </View>
                    )}
                    {debt.notes && (
                      <Text style={{ fontSize: 11, color: "#A1A1AA", fontStyle: "italic" }}>
                        "{debt.notes}"
                      </Text>
                    )}
                  </View>
                )}

                {/* Action buttons */}
                {!isSettled && (
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => { setSettleAmountStr(""); setSettleModalVisible(debt.id); }}
                      style={{
                        flex: 1,
                        backgroundColor: "#121214",
                        paddingVertical: 10,
                        borderRadius: 999,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <CheckCircle2 size={14} color="#FFC83B" />
                      <Text style={{ fontSize: 12, fontWeight: "800", color: "#FFFFFF" }}>
                        Settle
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDelete(debt.id, debt.person_name)}
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: "#FEECEB",
                        borderRadius: 999,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Trash2 size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}

                {isSettled && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <CheckCircle2 size={14} color="#10B981" />
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#10B981" }}>
                      Fully Settled
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDelete(debt.id, debt.person_name)}
                      style={{ marginLeft: "auto" }}
                    >
                      <Trash2 size={14} color="#A1A1AA" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Debt Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              padding: 24,
              paddingBottom: 36,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: "900", color: "#121214" }}>
                  Record a Debt
                </Text>
                <Caption>Money lent or borrowed</Caption>
              </View>
              <TouchableOpacity
                onPress={() => setAddModalVisible(false)}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#F7F7F5", alignItems: "center", justifyContent: "center" }}
              >
                <X size={16} color="#121214" />
              </TouchableOpacity>
            </View>

            {/* Direction toggle */}
            <Text style={{ fontSize: 11, fontWeight: "800", color: "#71717A", textTransform: "uppercase", marginBottom: 8 }}>
              Type
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
              {([
                { id: "given", label: "I Lent Money", icon: <ArrowUpRight size={14} color={direction === "given" ? "#059669" : "#71717A"} /> },
                { id: "taken", label: "I Borrowed", icon: <ArrowDownLeft size={14} color={direction === "taken" ? "#DC2626" : "#71717A"} /> },
              ] as const).map((opt) => {
                const isActive = direction === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => setDirection(opt.id)}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      paddingVertical: 12,
                      borderRadius: 16,
                      backgroundColor: isActive
                        ? opt.id === "given" ? "#E6FBF2" : "#FEECEB"
                        : "#F7F7F5",
                      borderWidth: 1.5,
                      borderColor: isActive
                        ? opt.id === "given" ? "#10B981" : "#EF4444"
                        : "#EAEAE5",
                    }}
                  >
                    {opt.icon}
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "800",
                        color: isActive
                          ? opt.id === "given" ? "#059669" : "#DC2626"
                          : "#71717A",
                      }}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              label="Person's Name"
              placeholder="e.g. Rahul, Sister, Office friend"
              value={personName}
              onChangeText={setPersonName}
            />
            <Input
              label="Amount (₹)"
              placeholder="0"
              keyboardType="numeric"
              value={amountStr}
              onChangeText={setAmountStr}
            />
            <Input
              label="Due Date (optional)"
              placeholder="e.g. Dec 2026"
              value={dueDate}
              onChangeText={setDueDate}
            />
            <Input
              label="Notes (optional)"
              placeholder="e.g. For trip expenses"
              value={notes}
              onChangeText={setNotes}
              containerClassName="mb-6"
            />

            <TouchableOpacity
              onPress={handleAdd}
              style={{
                backgroundColor: "#121214",
                paddingVertical: 14,
                borderRadius: 999,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
                Save Debt
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Settle Modal */}
      <Modal
        visible={settleModalVisible !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSettleModalVisible(null)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              padding: 24,
              paddingBottom: 36,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#121214" }}>
                Settle Amount
              </Text>
              <TouchableOpacity
                onPress={() => setSettleModalVisible(null)}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#F7F7F5", alignItems: "center", justifyContent: "center" }}
              >
                <X size={16} color="#121214" />
              </TouchableOpacity>
            </View>

            {settleModalVisible && (() => {
              const debt = debts.find((d) => d.id === settleModalVisible);
              if (!debt) return null;
              return (
                <View style={{ marginBottom: 16, padding: 14, backgroundColor: "#F7F7F5", borderRadius: 16 }}>
                  <Text style={{ fontSize: 12, color: "#71717A" }}>Outstanding</Text>
                  <Text style={{ fontSize: 20, fontWeight: "900", color: "#121214", marginTop: 2 }}>
                    {formatCurrencyFromPaise(debt.amount_paise - debt.settled_paise)}
                  </Text>
                </View>
              );
            })()}

            <Input
              label="Amount Settled (₹)"
              placeholder="0"
              keyboardType="numeric"
              value={settleAmountStr}
              onChangeText={setSettleAmountStr}
              containerClassName="mb-6"
            />

            <TouchableOpacity
              onPress={() => settleModalVisible && handleSettle(settleModalVisible)}
              style={{
                backgroundColor: "#121214",
                paddingVertical: 14,
                borderRadius: 999,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
                Confirm Settlement
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
