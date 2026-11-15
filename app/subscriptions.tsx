/**
 * app/subscriptions.tsx
 * Recurring Subscriptions & Fixed Obligations screen
 */

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Clock,
  Trash2,
  Edit3,
  ChevronRight,
  Pause,
  Play,
  Check,
} from "lucide-react-native";
import { useFinanceStore } from "@/store/useFinanceStore";
import { formatCurrencyFromPaise, rupeesToPaise, daysUntil } from "@/lib/utils";
import { Subscription, SubscriptionBillingCycle, SubscriptionStatus } from "@/types";

// ─── Constants ───────────────────────────────────────────────────────────────

const CYCLES: { label: string; value: SubscriptionBillingCycle }[] = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Yearly", value: "yearly" },
];

const CYCLE_LABELS: Record<SubscriptionBillingCycle, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

const STATUS_CONFIG: Record<
  SubscriptionStatus,
  { label: string; color: string; bg: string }
> = {
  active: { label: "Active", color: "#059669", bg: "#D1FAE5" },
  paused: { label: "Paused", color: "#D97706", bg: "#FEF3C7" },
  cancelled: { label: "Cancelled", color: "#DC2626", bg: "#FEE2E2" },
};

function monthlyEquivalent(paise: number, cycle: SubscriptionBillingCycle): number {
  switch (cycle) {
    case "weekly": return paise * 4.33;
    case "quarterly": return paise / 3;
    case "yearly": return paise / 12;
    default: return paise;
  }
}

function daysLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days}d`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SubscriptionsScreen() {
  const insets = useSafeAreaInsets();
  const {
    subscriptions,
    accounts,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleSubscriptionStatus,
  } = useFinanceStore();

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Subscription | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);

  // Fully customizable form state
  const [form, setForm] = useState({
    name: "",
    amount: "",
    billing_cycle: "monthly" as SubscriptionBillingCycle,
    billing_day: "1",
    notes: "",
    account_id: "",
    status: "active" as SubscriptionStatus,
  });

  // ─── Computed ───

  const active = useMemo(
    () => subscriptions.filter((s) => s.status === "active"),
    [subscriptions]
  );
  const paused = useMemo(
    () => subscriptions.filter((s) => s.status === "paused"),
    [subscriptions]
  );
  const cancelled = useMemo(
    () => subscriptions.filter((s) => s.status === "cancelled"),
    [subscriptions]
  );

  const upcoming7 = useMemo(
    () =>
      active
        .filter((s) => daysUntil(s.next_billing_date) <= 7)
        .sort(
          (a, b) =>
            new Date(a.next_billing_date).getTime() -
            new Date(b.next_billing_date).getTime()
        ),
    [active]
  );

  const totalMonthlyCommitted = useMemo(
    () =>
      active.reduce(
        (sum, s) => sum + monthlyEquivalent(s.amount_paise, s.billing_cycle),
        0
      ),
    [active]
  );

  // ─── Form Actions ───

  function openAdd() {
    setEditTarget(null);
    setForm({
      name: "",
      amount: "",
      billing_cycle: "monthly",
      billing_day: "1",
      notes: "",
      account_id: accounts[0]?.id || "",
      status: "active",
    });
    setShowModal(true);
  }

  function openEdit(sub: Subscription) {
    setEditTarget(sub);
    setForm({
      name: sub.name,
      amount: String(sub.amount_paise / 100),
      billing_cycle: sub.billing_cycle,
      billing_day: String(sub.billing_day),
      notes: sub.notes ?? "",
      account_id: sub.account_id ?? "",
      status: sub.status,
    });
    setShowModal(true);
  }

  function handleSave() {
    const name = form.name.trim();
    const amount = rupeesToPaise(form.amount);
    const billing_day = parseInt(form.billing_day) || 1;

    if (!name) return Alert.alert("Missing Name", "Please enter a name for this obligation.");
    if (amount <= 0) return Alert.alert("Missing Amount", "Please enter a valid amount in ₹.");

    if (editTarget) {
      updateSubscription(editTarget.id, {
        name,
        amount_paise: amount,
        billing_cycle: form.billing_cycle,
        billing_day,
        status: form.status,
        notes: form.notes.trim() || null,
        account_id: form.account_id || null,
      });
    } else {
      addSubscription({
        user_id: "local",
        name,
        amount_paise: amount,
        billing_cycle: form.billing_cycle,
        billing_day,
        status: form.status,
        notes: form.notes.trim() || null,
        account_id: form.account_id || null,
        category_id: null,
        auto_log: false,
      });
    }
    setShowModal(false);
  }

  function confirmDelete(sub: Subscription) {
    Alert.alert("Delete Subscription", `Remove "${sub.name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteSubscription(sub.id) },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F7F7F5" }}>
      {/* Top Header */}
      <View
        style={{
          paddingTop: Math.max(insets.top, Platform.OS === "android" ? 44 : 20),
          paddingHorizontal: 20,
          paddingBottom: 12,
          backgroundColor: "#F7F7F5",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#EAEAE5",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft size={18} color="#121214" />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 10, fontWeight: "700", color: "#A1A1AA", letterSpacing: 1.2, textTransform: "uppercase" }}>
              RECURRING OBLIGATIONS
            </Text>
            <Text style={{ fontSize: 20, fontWeight: "900", color: "#121214" }}>
              Subscriptions & Bills
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={openAdd}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: "#FFC83B",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#E8BC52",
          }}
        >
          <Plus size={20} color="#121214" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Summary Row ── */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { flex: 1.4 }]}>
            <Text style={styles.summaryLabel}>Monthly Committed</Text>
            <Text style={styles.summaryValue}>
              {formatCurrencyFromPaise(Math.round(totalMonthlyCommitted), { showDecimals: false })}
            </Text>
          </View>
          <View style={[styles.summaryCard, { flex: 0.8 }]}>
            <Text style={styles.summaryLabel}>Active</Text>
            <Text style={[styles.summaryValue, { color: "#059669" }]}>{active.length}</Text>
          </View>
          <View style={[styles.summaryCard, { flex: 0.8 }]}>
            <Text style={styles.summaryLabel}>Due Soon</Text>
            <Text style={[styles.summaryValue, { color: upcoming7.length > 0 ? "#D97706" : "#121214" }]}>
              {upcoming7.length}
            </Text>
          </View>
        </View>

        {/* ── Upcoming 7 Days ── */}
        {upcoming7.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Due In Next 7 Days</Text>
            {upcoming7.map((sub) => (
              <UpcomingCard key={sub.id} sub={sub} onEdit={() => openEdit(sub)} />
            ))}
          </View>
        )}

        {/* ── Active ── */}
        <View style={styles.section}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={styles.sectionTitle}>Active Subscriptions ({active.length})</Text>
            <TouchableOpacity onPress={openAdd}>
              <Text style={{ fontSize: 12, fontWeight: "800", color: "#B45309" }}>+ Add Custom</Text>
            </TouchableOpacity>
          </View>

          {active.length === 0 ? (
            <EmptyState onAdd={openAdd} />
          ) : (
            active.map((sub) => (
              <SubCard
                key={sub.id}
                sub={sub}
                onEdit={() => openEdit(sub)}
                onDelete={() => confirmDelete(sub)}
                onToggle={(status) => toggleSubscriptionStatus(sub.id, status)}
              />
            ))
          )}
        </View>

        {/* ── Paused ── */}
        {paused.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Paused ({paused.length})</Text>
            {paused.map((sub) => (
              <SubCard
                key={sub.id}
                sub={sub}
                onEdit={() => openEdit(sub)}
                onDelete={() => confirmDelete(sub)}
                onToggle={(status) => toggleSubscriptionStatus(sub.id, status)}
              />
            ))}
          </View>
        )}

        {/* ── Cancelled ── */}
        {cancelled.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => setShowCancelled((v) => !v)}
            >
              <Text style={styles.sectionTitle}>Cancelled Archive ({cancelled.length})</Text>
              <ChevronRight
                size={16}
                color="#71717A"
                style={{ transform: [{ rotate: showCancelled ? "90deg" : "0deg" }] }}
              />
            </TouchableOpacity>
            {showCancelled &&
              cancelled.map((sub) => (
                <SubCard
                  key={sub.id}
                  sub={sub}
                  onEdit={() => openEdit(sub)}
                  onDelete={() => confirmDelete(sub)}
                  onToggle={(status) => toggleSubscriptionStatus(sub.id, status)}
                />
              ))}
          </View>
        )}
      </ScrollView>

      {/* ── Fully Customizable Add / Edit Modal ── */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F7F5" }}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.modalActionBtn}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editTarget ? "Edit Subscription" : "Add Subscription"}
              </Text>
              <TouchableOpacity onPress={handleSave} style={styles.modalActionBtn}>
                <Text style={styles.modalSave}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
              {/* Custom Name */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Subscription / Obligation Name *</Text>
                <TextInput
                  style={styles.input}
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                  placeholder="e.g. Netflix, Gym, Rent, Electricity, Car EMI"
                  placeholderTextColor="#A1A1AA"
                  autoFocus={!editTarget}
                />
              </View>

              {/* Amount */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Amount (₹) *</Text>
                <TextInput
                  style={[styles.input, { fontSize: 18, fontWeight: "700" }]}
                  value={form.amount}
                  onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
                  placeholder="0"
                  placeholderTextColor="#A1A1AA"
                  keyboardType="numeric"
                />
              </View>

              {/* Billing Cycle */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Billing Frequency</Text>
                <View style={styles.pillRow}>
                  {CYCLES.map((c) => {
                    const activeCycle = form.billing_cycle === c.value;
                    return (
                      <TouchableOpacity
                        key={c.value}
                        style={[styles.pill, activeCycle && styles.pillActive]}
                        onPress={() => setForm((f) => ({ ...f, billing_cycle: c.value }))}
                      >
                        <Text style={[styles.pillText, activeCycle && styles.pillTextActive]}>
                          {c.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Billing Day */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  {form.billing_cycle === "weekly"
                    ? "Day of Week (1=Monday ... 7=Sunday)"
                    : "Day of Month (1 - 31)"}
                </Text>
                <TextInput
                  style={styles.input}
                  value={form.billing_day}
                  onChangeText={(v) => setForm((f) => ({ ...f, billing_day: v }))}
                  placeholder={form.billing_cycle === "weekly" ? "1 - 7" : "1 - 31"}
                  placeholderTextColor="#A1A1AA"
                  keyboardType="number-pad"
                />
              </View>

              {/* Status Picker (when editing) */}
              {editTarget && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Status</Text>
                  <View style={styles.pillRow}>
                    {(["active", "paused", "cancelled"] as SubscriptionStatus[]).map((st) => {
                      const isActive = form.status === st;
                      const cfg = STATUS_CONFIG[st];
                      return (
                        <TouchableOpacity
                          key={st}
                          style={[
                            styles.pill,
                            isActive && { backgroundColor: cfg.bg, borderColor: cfg.color },
                          ]}
                          onPress={() => setForm((f) => ({ ...f, status: st }))}
                        >
                          <Text
                            style={[
                              styles.pillText,
                              isActive && { color: cfg.color, fontWeight: "800" },
                            ]}
                          >
                            {cfg.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Account Association */}
              {accounts.length > 0 && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Deducted From Account</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                      style={[styles.quickChip, !form.account_id && styles.quickChipActive]}
                      onPress={() => setForm((f) => ({ ...f, account_id: "" }))}
                    >
                      <Text style={[styles.quickChipText, !form.account_id && styles.quickChipTextActive]}>
                        None
                      </Text>
                    </TouchableOpacity>
                    {accounts.map((acc) => {
                      const selected = form.account_id === acc.id;
                      return (
                        <TouchableOpacity
                          key={acc.id}
                          style={[styles.quickChip, selected && styles.quickChipActive]}
                          onPress={() => setForm((f) => ({ ...f, account_id: acc.id }))}
                        >
                          <Text style={[styles.quickChipText, selected && styles.quickChipTextActive]}>
                            {acc.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Custom Notes */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Notes / Reminder Info (Optional)</Text>
                <TextInput
                  style={[styles.input, { height: 74, textAlignVertical: "top", paddingTop: 12 }]}
                  value={form.notes}
                  onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
                  placeholder="e.g. Paid via ICICI Auto-debit, shared with roommate"
                  placeholderTextColor="#A1A1AA"
                  multiline
                />
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                onPress={handleSave}
                style={{
                  backgroundColor: "#121214",
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: "center",
                  marginTop: 10,
                }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "800" }}>
                  {editTarget ? "Update Subscription" : "Save Subscription"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function UpcomingCard({ sub, onEdit }: { sub: Subscription; onEdit: () => void }) {
  const days = daysUntil(sub.next_billing_date);
  const urgent = days <= 2;
  return (
    <TouchableOpacity
      style={[styles.upcomingCard, urgent && { borderColor: "#FFC83B", borderWidth: 1.5 }]}
      onPress={onEdit}
      activeOpacity={0.8}
    >
      <View style={[styles.upcomingBadge, { backgroundColor: urgent ? "#FFF3CD" : "#F0FDF4" }]}>
        <Clock size={12} color={urgent ? "#D97706" : "#059669"} strokeWidth={2.5} />
        <Text style={[styles.upcomingBadgeText, { color: urgent ? "#D97706" : "#059669" }]}>
          {daysLabel(days)}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.subName} numberOfLines={1}>{sub.name}</Text>
        <Text style={styles.subCycle}>{CYCLE_LABELS[sub.billing_cycle]}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.upcomingAmount}>
          {formatCurrencyFromPaise(sub.amount_paise, { showDecimals: false })}
        </Text>
        <Text style={{ fontSize: 10, color: "#A1A1AA", fontWeight: "600" }}>Tap to edit</Text>
      </View>
    </TouchableOpacity>
  );
}

function SubCard({
  sub,
  onEdit,
  onDelete,
  onToggle,
}: {
  sub: Subscription;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (s: SubscriptionStatus) => void;
}) {
  const cfg = STATUS_CONFIG[sub.status];
  const days = daysUntil(sub.next_billing_date);

  return (
    <TouchableOpacity style={styles.subCard} activeOpacity={0.85} onPress={onEdit}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Text style={styles.subName} numberOfLines={1}>{sub.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
        <Text style={styles.subMeta}>
          {CYCLE_LABELS[sub.billing_cycle]}
          {sub.status === "active" && ` · ${daysLabel(days)}`}
          {sub.account && ` · ${sub.account.name}`}
        </Text>
        {sub.notes ? <Text style={styles.subNotes} numberOfLines={1}>{sub.notes}</Text> : null}
      </View>

      <View style={{ alignItems: "flex-end", gap: 6 }}>
        <Text style={styles.subAmount}>
          {formatCurrencyFromPaise(sub.amount_paise, { showDecimals: false })}
        </Text>

        {/* Quick action buttons right on card */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {sub.status === "active" ? (
            <TouchableOpacity
              onPress={() => onToggle("paused")}
              style={styles.iconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Pause size={13} color="#D97706" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => onToggle("active")}
              style={styles.iconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Play size={13} color="#059669" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={onEdit}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Edit3 size={13} color="#121214" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDelete}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Trash2 size={13} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.emptyCard}>
      <RefreshCw size={30} color="#D4D4D8" strokeWidth={1.6} />
      <Text style={styles.emptyTitle}>No Subscriptions Yet</Text>
      <Text style={styles.emptyText}>
        Track electricity, Wi-Fi, rent, EMIs, and all your custom recurring bills here.
      </Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onAdd}>
        <Plus size={14} color="#121214" strokeWidth={2.5} />
        <Text style={styles.emptyBtnText}>Add Your First Bill</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 18, marginTop: 4 },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EAEAE5",
  },
  summaryLabel: { fontSize: 10, fontWeight: "700", color: "#A1A1AA", marginBottom: 6, textTransform: "uppercase" },
  summaryValue: { fontSize: 17, fontWeight: "900", color: "#121214" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: "#71717A", textTransform: "uppercase", letterSpacing: 0.6 },
  collapsibleHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  upcomingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#EAEAE5",
  },
  upcomingBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  upcomingBadgeText: { fontSize: 10, fontWeight: "800" },
  upcomingAmount: { fontSize: 15, fontWeight: "900", color: "#121214" },
  subCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#EAEAE5",
  },
  subName: { fontSize: 15, fontWeight: "800", color: "#121214" },
  subCycle: { fontSize: 11, color: "#71717A", marginTop: 2 },
  subMeta: { fontSize: 12, color: "#71717A", marginTop: 2, fontWeight: "500" },
  subNotes: { fontSize: 11, color: "#A1A1AA", marginTop: 4, fontStyle: "italic" },
  subAmount: { fontSize: 16, fontWeight: "900", color: "#121214" },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "800" },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F7F7F5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EAEAE5",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAEAE5",
    gap: 10,
    marginTop: 6,
  },
  emptyTitle: { fontSize: 15, fontWeight: "800", color: "#121214", marginTop: 4 },
  emptyText: { fontSize: 13, color: "#71717A", textAlign: "center", lineHeight: 19 },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFC83B",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  emptyBtnText: { fontSize: 13, fontWeight: "800", color: "#121214" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#EAEAE5",
    backgroundColor: "#FFFFFF",
  },
  modalActionBtn: { padding: 4 },
  modalCancel: { fontSize: 15, color: "#71717A", fontWeight: "600" },
  modalTitle: { fontSize: 16, fontWeight: "900", color: "#121214" },
  modalSave: { fontSize: 15, color: "#B45309", fontWeight: "800" },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: "800", color: "#71717A", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EAEAE5",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#121214",
  },
  pillRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EAEAE5",
    backgroundColor: "#FFFFFF",
  },
  pillActive: { backgroundColor: "#FFC83B", borderColor: "#FFC83B" },
  pillText: { fontSize: 13, fontWeight: "600", color: "#71717A" },
  pillTextActive: { color: "#121214", fontWeight: "800" },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EAEAE5",
    backgroundColor: "#FFFFFF",
    marginRight: 8,
  },
  quickChipActive: { backgroundColor: "#FFC83B", borderColor: "#FFC83B" },
  quickChipText: { fontSize: 12, fontWeight: "600", color: "#71717A" },
  quickChipTextActive: { color: "#121214", fontWeight: "800" },
});
