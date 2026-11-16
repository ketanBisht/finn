import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Plus,
  Target,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Edit2,
  TrendingDown,
  TrendingUp,
  Sparkles,
  PieChart,
  Layers,
  CheckCircle2,
  AlertCircle,
  Utensils,
  ShoppingBag,
  Car,
  Film,
  Receipt,
  HeartPulse,
  GraduationCap,
  ShoppingCart,
  Plane,
  Smile,
  MoreHorizontal,
} from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { Caption } from "@/components/ui/typography";
import { useFinanceStore } from "@/store/useFinanceStore";
import { formatCurrencyFromPaise, rupeesToPaise } from "@/lib/utils";
import { Budget } from "@/types";

export default function BudgetsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"slices" | "reality">("slices");

  // Modals
  const [sliceModalVisible, setSliceModalVisible] = useState(false);
  const [ceilingModalVisible, setCeilingModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [limitStr, setLimitStr] = useState("");
  const [ceilingStr, setCeilingStr] = useState("");

  // Month navigation
  const [monthOffset, setMonthOffset] = useState(0);

  const budgets = useFinanceStore((s) => s.budgets);
  const categories = useFinanceStore((s) => s.categories);
  const transactions = useFinanceStore((s) => s.transactions);
  const setBudget = useFinanceStore((s) => s.setBudget);
  const deleteBudget = useFinanceStore((s) => s.deleteBudget);
  const overallMonthlyBudgets = useFinanceStore((s) => s.overallMonthlyBudgets);
  const setOverallMonthlyBudget = useFinanceStore((s) => s.setOverallMonthlyBudget);

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const [selectedCatId, setSelectedCatId] = useState(expenseCategories[0]?.id || "");

  const now = new Date();
  const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const currentMonth = targetDate.getMonth();
  const currentYear = targetDate.getFullYear();
  const monthNum = currentMonth + 1;
  const monthKey = `${currentYear}-${monthNum}`;

  // Actual spending per category for selected month
  const categorySpendingMap = transactions.reduce((acc, tx) => {
    if (tx.type !== "expense" || !tx.category_id) return acc;
    const d = new Date(tx.transaction_date);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      acc[tx.category_id] = (acc[tx.category_id] || 0) + tx.amount_paise;
    }
    return acc;
  }, {} as Record<string, number>);

  const totalActualMonthSpendPaise = Object.values(categorySpendingMap).reduce((a, b) => a + b, 0);

  // Category Budgets for the active month
  const currentBudgets = budgets.filter(
    (b) => b.month === monthNum && b.year === currentYear
  );

  const totalAllocatedToCategoriesPaise = currentBudgets.reduce(
    (sum, b) => sum + b.limit_amount_paise,
    0
  );

  // Top-Down Budget Ceiling (fallback: allocated sum or default ₹60k)
  const userDefinedCeilingPaise =
    overallMonthlyBudgets[monthKey] ??
    (totalAllocatedToCategoriesPaise > 0 ? totalAllocatedToCategoriesPaise : rupeesToPaise(60000));

  const unallocatedBufferPaise = userDefinedCeilingPaise - totalAllocatedToCategoriesPaise;
  const isOverAllocated = unallocatedBufferPaise < 0;
  const allocationPercent = userDefinedCeilingPaise > 0
    ? Math.round((totalAllocatedToCategoriesPaise / userDefinedCeilingPaise) * 100)
    : 0;

  // Actual Spend vs Ceiling
  const remainingCeilingPaise = Math.max(0, userDefinedCeilingPaise - totalActualMonthSpendPaise);
  const spendPercentOfCeiling = userDefinedCeilingPaise > 0
    ? Math.min(100, Math.round((totalActualMonthSpendPaise / userDefinedCeilingPaise) * 100))
    : 0;

  // Days and Safe Daily Pace
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const isCurrentMonth = monthOffset === 0;
  const today = isCurrentMonth ? now.getDate() : 1;
  const daysRemaining = Math.max(1, daysInMonth - today + 1);
  const safeDailyPacePaise = Math.round(remainingCeilingPaise / daysRemaining);

  const monthLabel = targetDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const handleSaveCeiling = () => {
    const val = parseFloat(ceilingStr);
    if (isNaN(val) || val <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid monthly ceiling greater than ₹0");
      return;
    }
    setOverallMonthlyBudget(monthNum, currentYear, rupeesToPaise(val));
    setCeilingStr("");
    setCeilingModalVisible(false);
  };

  const handleSaveCategorySlice = () => {
    const limit = parseFloat(limitStr);
    if (isNaN(limit) || limit <= 0) {
      Alert.alert("Invalid Amount", "Please enter a budget limit greater than ₹0");
      return;
    }

    setBudget({
      user_id: "local-user",
      category_id: selectedCatId,
      month: monthNum,
      year: currentYear,
      limit_amount_paise: rupeesToPaise(limit),
    });

    setLimitStr("");
    setEditingBudget(null);
    setSliceModalVisible(false);
  };

  const handleOpenEditSlice = (b: Budget) => {
    setEditingBudget(b);
    setSelectedCatId(b.category_id);
    setLimitStr((b.limit_amount_paise / 100).toString());
    setSliceModalVisible(true);
  };

  const handleDeleteSlice = (id: string, catName: string) => {
    Alert.alert("Remove Slice", `Remove budget for "${catName}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deleteBudget(id) },
    ]);
  };

  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case "Utensils": return <Utensils size={18} color="#f97316" />;
      case "ShoppingBag": return <ShoppingBag size={18} color="#ec4899" />;
      case "Car": return <Car size={18} color="#3b82f6" />;
      case "Film": return <Film size={18} color="#a855f7" />;
      case "Receipt": return <Receipt size={18} color="#eab308" />;
      case "HeartPulse": return <HeartPulse size={18} color="#ef4444" />;
      case "GraduationCap": return <GraduationCap size={18} color="#06b6d4" />;
      case "ShoppingCart": return <ShoppingCart size={18} color="#84cc16" />;
      case "Plane": return <Plane size={18} color="#6366f1" />;
      case "Smile": return <Smile size={18} color="#14b8a6" />;
      default: return <MoreHorizontal size={18} color="#64748b" />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F7F7F5" }}>
      {/* Top Header */}
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
          <Caption>TOP-DOWN BUDGETING</Caption>
          <Text style={{ fontSize: 20, fontWeight: "900", color: "#121214" }}>
            Monthly Budget
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            setEditingBudget(null);
            setLimitStr("");
            setSelectedCatId(expenseCategories[0]?.id || "");
            setSliceModalVisible(true);
          }}
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
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Month Selector Bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FFFFFF",
            borderRadius: 22,
            padding: 10,
            borderWidth: 1,
            borderColor: "#EAEAE5",
            marginBottom: 14,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.03,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          <TouchableOpacity
            onPress={() => setMonthOffset(monthOffset - 1)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: "#F7F7F5",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronLeft size={16} color="#121214" strokeWidth={2.5} />
          </TouchableOpacity>

          <Text style={{ fontSize: 14, fontWeight: "900", color: "#121214" }}>
            {monthLabel} {isCurrentMonth ? "(This Month)" : ""}
          </Text>

          <TouchableOpacity
            onPress={() => setMonthOffset(monthOffset + 1)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: "#F7F7F5",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronRight size={16} color="#121214" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Master Ceiling Envelope Card */}
        <View
          style={{
            backgroundColor: "#F6CB68",
            borderRadius: 26,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#E8BC52",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <View>
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#121214", opacity: 0.7, textTransform: "uppercase" }}>
                Monthly Spend Ceiling
              </Text>
              <Text style={{ fontSize: 28, fontWeight: "900", color: "#121214", marginTop: 2 }}>
                {formatCurrencyFromPaise(userDefinedCeilingPaise)}
              </Text>
              <Text style={{ fontSize: 11, color: "#121214", opacity: 0.7, marginTop: 2 }}>
                {totalActualMonthSpendPaise > 0
                  ? `${formatCurrencyFromPaise(totalActualMonthSpendPaise)} spent so far`
                  : "No expenses recorded yet"}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                setCeilingStr((userDefinedCeilingPaise / 100).toString());
                setCeilingModalVisible(true);
              }}
              style={{
                backgroundColor: "#121214",
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 9999,
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Edit2 size={11} color="#FFC83B" />
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#FFFFFF" }}>
                Edit
              </Text>
            </TouchableOpacity>
          </View>

          {/* Progress bar: Actual Spent of Ceiling */}
          <View style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#121214" }}>
                Budget Used: {spendPercentOfCeiling}%
              </Text>
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#121214" }}>
                {formatCurrencyFromPaise(remainingCeilingPaise)} left
              </Text>
            </View>

            <View style={{ width: "100%", height: 8, backgroundColor: "rgba(0,0,0,0.12)", borderRadius: 4, overflow: "hidden" }}>
              <View
                style={{
                  width: `${spendPercentOfCeiling}%`,
                  height: "100%",
                  backgroundColor: spendPercentOfCeiling > 90 ? "#DC2626" : "#121214",
                  borderRadius: 4,
                }}
              />
            </View>
          </View>

          {/* Quick Metrics Row */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                padding: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#71717A" }}>
                Allocated Slices
              </Text>
              <Text style={{ fontSize: 13, fontWeight: "900", color: "#121214", marginTop: 2 }}>
                {formatCurrencyFromPaise(totalAllocatedToCategoriesPaise)}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: isOverAllocated ? "#FEECEB" : "#FFFFFF",
                borderRadius: 16,
                padding: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "700", color: isOverAllocated ? "#DC2626" : "#71717A" }}>
                {isOverAllocated ? "Over-Allocated" : "Reserve Buffer"}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "900",
                  color: isOverAllocated ? "#DC2626" : "#059669",
                  marginTop: 2,
                }}
              >
                {formatCurrencyFromPaise(Math.abs(unallocatedBufferPaise))}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                padding: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#71717A" }}>
                Daily Pace
              </Text>
              <Text style={{ fontSize: 13, fontWeight: "900", color: "#121214", marginTop: 2 }}>
                {formatCurrencyFromPaise(safeDailyPacePaise)}/d
              </Text>
            </View>
          </View>
        </View>

        {/* 2-Way Tab Bar: Category Slices vs Reality Breakdown */}
        <View style={{ flexDirection: "row", backgroundColor: "#EAEAE5", borderRadius: 9999, padding: 4, marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => setActiveTab("slices")}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: 9999,
              alignItems: "center",
              backgroundColor: activeTab === "slices" ? "#121214" : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "800",
                color: activeTab === "slices" ? "#FFFFFF" : "#71717A",
              }}
            >
              Category Envelopes ({currentBudgets.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("reality")}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: 9999,
              alignItems: "center",
              backgroundColor: activeTab === "reality" ? "#FFC83B" : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "800",
                color: "#121214",
              }}
            >
              Planned vs Reality
            </Text>
          </TouchableOpacity>
        </View>

        {/* ---------------- TAB 1: CATEGORY SLICES ---------------- */}
        {activeTab === "slices" && (
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, paddingHorizontal: 2 }}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#71717A", textTransform: "uppercase", letterSpacing: 0.6 }}>
                Active Category Slices
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setEditingBudget(null);
                  setLimitStr("");
                  setSliceModalVisible(true);
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "800", color: "#D97706" }}>
                  + New Slice
                </Text>
              </TouchableOpacity>
            </View>

            {currentBudgets.length === 0 ? (
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 24,
                  padding: 36,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#EAEAE5",
                }}
              >
                <Target size={32} color="#D4D4D8" />
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#121214", marginTop: 10 }}>
                  No Category Envelopes Yet
                </Text>
                <Text style={{ fontSize: 12, color: "#71717A", textAlign: "center", marginTop: 4, marginBottom: 16 }}>
                  Divide your {formatCurrencyFromPaise(userDefinedCeilingPaise)} monthly budget into specific slices (Food, Groceries, Travel).
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setEditingBudget(null);
                    setLimitStr("");
                    setSliceModalVisible(true);
                  }}
                  style={{
                    backgroundColor: "#121214",
                    paddingVertical: 11,
                    paddingHorizontal: 20,
                    borderRadius: 9999,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "800", color: "#FFFFFF" }}>
                    + Add First Slice
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              currentBudgets.map((b) => {
                const spent = categorySpendingMap[b.category_id] || 0;
                const limit = b.limit_amount_paise;
                const percentSpent = Math.min(100, Math.round((spent / limit) * 100));
                const remaining = limit - spent;
                const isOver = spent > limit;
                const cat = b.category;

                return (
                  <View
                    key={b.id}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: 22,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: isOver ? "#FCA5A5" : "#EAEAE5",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.03,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  >
                    {/* Top Row: Icon + Name + Actions */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 14,
                            backgroundColor: cat?.color ? `${cat.color}15` : "#F7F7F5",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {getCategoryIcon(cat?.icon)}
                        </View>
                        <View>
                          <Text style={{ fontSize: 14, fontWeight: "800", color: "#121214" }}>
                            {cat?.name || "Category"}
                          </Text>
                          <Text style={{ fontSize: 11, color: "#71717A", marginTop: 1 }}>
                            {Math.round((limit / userDefinedCeilingPaise) * 100)}% of ceiling
                          </Text>
                        </View>
                      </View>

                      {/* Edit / Delete */}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <TouchableOpacity
                          onPress={() => handleOpenEditSlice(b)}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: "#F7F7F5",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Edit2 size={13} color="#121214" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleDeleteSlice(b.id, cat?.name || "budget")}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: "#FEECEB",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Trash2 size={13} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={{ marginBottom: 10 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: "#121214" }}>
                          {formatCurrencyFromPaise(spent)} of {formatCurrencyFromPaise(limit)}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "800",
                            color: isOver ? "#DC2626" : percentSpent > 80 ? "#D97706" : "#059669",
                          }}
                        >
                          {isOver
                            ? `Over by ${formatCurrencyFromPaise(spent - limit)}`
                            : `${formatCurrencyFromPaise(remaining)} left (${100 - percentSpent}%)`}
                        </Text>
                      </View>

                      <View style={{ height: 6, backgroundColor: "#F0EFEA", borderRadius: 3, overflow: "hidden" }}>
                        <View
                          style={{
                            height: 6,
                            borderRadius: 3,
                            width: `${percentSpent}%`,
                            backgroundColor: isOver
                              ? "#DC2626"
                              : percentSpent > 80
                              ? "#F59E0B"
                              : "#10B981",
                          }}
                        />
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ---------------- TAB 2: PLANNED VS REALITY ---------------- */}
        {activeTab === "reality" && (
          <View>
            <View style={{ marginBottom: 14, paddingHorizontal: 2 }}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#71717A", textTransform: "uppercase", letterSpacing: 0.6 }}>
                Variance Audit & Reality Check
              </Text>
            </View>

            {/* Reality High-level Card */}
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 22,
                padding: 16,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: "#EAEAE5",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#121214" }}>
                  Net Variance This Month
                </Text>
                <View
                  style={{
                    backgroundColor: remainingCeilingPaise > 0 ? "#E6FBF2" : "#FEECEB",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "800",
                      color: remainingCeilingPaise > 0 ? "#059669" : "#DC2626",
                    }}
                  >
                    {remainingCeilingPaise > 0 ? "Under Ceiling" : "Exceeded Ceiling"}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1, backgroundColor: "#F7F7F5", borderRadius: 14, padding: 12 }}>
                  <Text style={{ fontSize: 10, fontWeight: "800", color: "#71717A", textTransform: "uppercase" }}>
                    Planned Ceiling
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: "900", color: "#121214", marginTop: 2 }}>
                    {formatCurrencyFromPaise(userDefinedCeilingPaise)}
                  </Text>
                </View>

                <View style={{ flex: 1, backgroundColor: "#F7F7F5", borderRadius: 14, padding: 12 }}>
                  <Text style={{ fontSize: 10, fontWeight: "800", color: "#71717A", textTransform: "uppercase" }}>
                    Actual Spent
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: "900", color: "#121214", marginTop: 2 }}>
                    {formatCurrencyFromPaise(totalActualMonthSpendPaise)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Per-Category Reality Breakdown */}
            {currentBudgets.length === 0 ? (
              <View style={{ backgroundColor: "#FFFFFF", borderRadius: 22, padding: 32, alignItems: "center", borderWidth: 1, borderColor: "#EAEAE5" }}>
                <Text style={{ fontSize: 13, color: "#71717A", fontWeight: "600" }}>
                  Allocate category slices in Tab 1 to see variances.
                </Text>
              </View>
            ) : (
              currentBudgets.map((b) => {
                const spent = categorySpendingMap[b.category_id] || 0;
                const limit = b.limit_amount_paise;
                const variance = limit - spent;
                const isUnder = variance >= 0;

                return (
                  <View
                    key={`reality-${b.id}`}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: 18,
                      padding: 14,
                      marginBottom: 10,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderWidth: 1,
                      borderColor: "#EAEAE5",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          backgroundColor: isUnder ? "#E6FBF2" : "#FEECEB",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isUnder
                          ? <TrendingDown size={16} color="#059669" />
                          : <TrendingUp size={16} color="#DC2626" />
                        }
                      </View>
                      <View>
                        <Text style={{ fontSize: 13, fontWeight: "800", color: "#121214" }}>
                          {b.category?.name}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#71717A", marginTop: 1 }}>
                          Planned {formatCurrencyFromPaise(limit)} · Spent {formatCurrencyFromPaise(spent)}
                        </Text>
                      </View>
                    </View>

                    <View style={{ alignItems: "flex-end" }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "900",
                          color: isUnder ? "#059669" : "#DC2626",
                        }}
                      >
                        {isUnder ? "+" : "-"}{formatCurrencyFromPaise(Math.abs(variance))}
                      </Text>
                      <Text style={{ fontSize: 10, color: isUnder ? "#059669" : "#DC2626", fontWeight: "700", marginTop: 1 }}>
                        {isUnder ? "Saved" : "Exceeded"}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Edit Ceiling Modal */}
      <Modal
        visible={ceilingModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCeilingModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderTopLeftRadius: 32,
                borderTopRightRadius: 32,
                padding: 24,
                paddingBottom: 36,
                maxHeight: "90%",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: "900", color: "#121214" }}>
                    Set Monthly Ceiling
                  </Text>
                  <Caption>Top-down total spending budget for {monthLabel}</Caption>
                </View>
                <TouchableOpacity
                  onPress={() => setCeilingModalVisible(false)}
                  style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#F7F7F5", alignItems: "center", justifyContent: "center" }}
                >
                  <X size={16} color="#121214" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
              >
                <Input
                  label="Overall Ceiling Amount (₹)"
                  placeholder="e.g. 50000"
                  keyboardType="numeric"
                  value={ceilingStr}
                  onChangeText={setCeilingStr}
                  helperText="You will divide this master budget into category envelopes"
                  containerClassName="mb-6"
                />

                <TouchableOpacity
                  onPress={handleSaveCeiling}
                  style={{
                    backgroundColor: "#121214",
                    paddingVertical: 14,
                    borderRadius: 9999,
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
                    Save Ceiling
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add / Edit Category Slice Modal */}
      <Modal
        visible={sliceModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSliceModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderTopLeftRadius: 32,
                borderTopRightRadius: 32,
                padding: 24,
                paddingBottom: 36,
                maxHeight: "90%",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: "900", color: "#121214" }}>
                    {editingBudget ? "Edit Category Slice" : "Allocate Category Slice"}
                  </Text>
                  <Caption>Slice of your {formatCurrencyFromPaise(userDefinedCeilingPaise)} ceiling</Caption>
                </View>
                <TouchableOpacity
                  onPress={() => setSliceModalVisible(false)}
                  style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#F7F7F5", alignItems: "center", justifyContent: "center" }}
                >
                  <X size={16} color="#121214" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
              >
                <Text style={{ fontSize: 11, fontWeight: "800", color: "#71717A", textTransform: "uppercase", marginBottom: 8 }}>
                  Select Expense Category
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {expenseCategories.map((c) => {
                      const isSelected = selectedCatId === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          onPress={() => setSelectedCatId(c.id)}
                          style={{
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: 14,
                            backgroundColor: isSelected ? "#FFC83B" : "#F7F7F5",
                            borderWidth: 1,
                            borderColor: isSelected ? "#E8BC52" : "#EAEAE5",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {getCategoryIcon(c.icon)}
                          <Text style={{ fontSize: 12, fontWeight: "800", color: "#121214" }}>
                            {c.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                <Input
                  label="Allocated Amount (₹)"
                  placeholder="e.g. 15000"
                  keyboardType="numeric"
                  value={limitStr}
                  onChangeText={setLimitStr}
                  helperText={`Unallocated buffer: ${formatCurrencyFromPaise(unallocatedBufferPaise)}`}
                  containerClassName="mb-6"
                />

                <TouchableOpacity
                  onPress={handleSaveCategorySlice}
                  style={{
                    backgroundColor: "#121214",
                    paddingVertical: 14,
                    borderRadius: 9999,
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
                    {editingBudget ? "Update Slice" : "Allocate Slice"}
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
