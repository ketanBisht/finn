import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Plus,
  Target,
  Trash2,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Edit2,
  Scale,
  TrendingDown,
  TrendingUp,
  Layers,
  ShieldCheck,
  Zap,
} from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { Caption } from "@/components/ui/typography";
import { useFinanceStore } from "@/store/useFinanceStore";
import { formatCurrencyFromPaise, rupeesToPaise } from "@/lib/utils";

// Categorization helper for the 50/30/20 Rule
const NEEDS_CATEGORIES = ["Bills", "Groceries", "Transportation", "Health", "Education"];
const WANTS_CATEGORIES = ["Food", "Entertainment", "Shopping", "Personal Care", "Travel"];

export default function BudgetsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"plan" | "reality" | "50-30-20">("plan");

  // Modals
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [ceilingModalVisible, setCeilingModalVisible] = useState(false);
  const [limitStr, setLimitStr] = useState("");
  const [ceilingStr, setCeilingStr] = useState("");

  // Selected planning month
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0);

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
  const targetDate = new Date(now.getFullYear(), now.getMonth() + selectedMonthOffset, 1);
  const currentMonth = targetDate.getMonth();
  const currentYear = targetDate.getFullYear();
  const monthNum = currentMonth + 1;
  const monthKey = `${currentYear}-${monthNum}`;

  // Monthly income for the target month
  const monthlyIncomePaise =
    transactions
      .filter((t) => {
        const d = new Date(t.transaction_date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === "income";
      })
      .reduce((sum, t) => sum + t.amount_paise, 0) || rupeesToPaise(120000);

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

  // Top-Down Budget Ceiling (User defines this first, fallback to sum of categories or default ₹60k)
  const userDefinedCeilingPaise =
    overallMonthlyBudgets[monthKey] ??
    (totalAllocatedToCategoriesPaise > 0 ? totalAllocatedToCategoriesPaise : rupeesToPaise(60000));

  const unallocatedBufferPaise = userDefinedCeilingPaise - totalAllocatedToCategoriesPaise;
  const isOverAllocated = unallocatedBufferPaise < 0;
  const allocationPercent = userDefinedCeilingPaise > 0
    ? Math.round((totalAllocatedToCategoriesPaise / userDefinedCeilingPaise) * 100)
    : 0;

  // Reality Metrics
  const netVariancePaise = userDefinedCeilingPaise - totalActualMonthSpendPaise;
  const isOverallUnderBudget = netVariancePaise >= 0;
  const realitySpendPercent = userDefinedCeilingPaise > 0
    ? Math.min(100, Math.round((totalActualMonthSpendPaise / userDefinedCeilingPaise) * 100))
    : 0;

  // Pace & Forecast
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const isCurrentMonth = selectedMonthOffset === 0;
  const dayProgress = isCurrentMonth ? now.getDate() : daysInMonth;
  const projectedMonthSpendPaise =
    dayProgress > 0
      ? Math.round((totalActualMonthSpendPaise / dayProgress) * daysInMonth)
      : totalActualMonthSpendPaise;

  // 50-30-20 Calculations
  const targetNeedsPaise = Math.round(monthlyIncomePaise * 0.5);
  const targetWantsPaise = Math.round(monthlyIncomePaise * 0.3);
  const targetSavingsPaise = Math.round(monthlyIncomePaise * 0.2);

  const actualNeedsSpentPaise = currentBudgets
    .filter((b) => NEEDS_CATEGORIES.includes(b.category?.name || ""))
    .reduce((sum, b) => sum + (categorySpendingMap[b.category_id] || 0), 0);

  const actualWantsSpentPaise = currentBudgets
    .filter((b) => WANTS_CATEGORIES.includes(b.category?.name || ""))
    .reduce((sum, b) => sum + (categorySpendingMap[b.category_id] || 0), 0);

  const monthLabel = targetDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const handleSaveCeiling = () => {
    const val = parseFloat(ceilingStr);
    if (isNaN(val) || val <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid monthly budget ceiling greater than 0");
      return;
    }
    setOverallMonthlyBudget(monthNum, currentYear, rupeesToPaise(val));
    setCeilingStr("");
    setCeilingModalVisible(false);
  };

  const handleCreateCategoryBudget = () => {
    const limit = parseFloat(limitStr);
    if (isNaN(limit) || limit <= 0) {
      Alert.alert("Invalid Limit", "Please enter a valid budget limit greater than 0");
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
    setCategoryModalVisible(false);
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
          <Text className="text-xl font-black text-[#121214]">
            Planning & Reality
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setCategoryModalVisible(true)}
          className="w-9 h-9 bg-[#FFC83B] rounded-full items-center justify-center border border-[#E8BC52]"
        >
          <Plus size={18} color="#121214" strokeWidth={2.6} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Month Selector Bar */}
        <View className="flex-row items-center justify-between bg-white rounded-[22px] p-2.5 border border-[#EAEAE5] mb-3 shadow-sm">
          <TouchableOpacity
            onPress={() => setSelectedMonthOffset(selectedMonthOffset - 1)}
            className="w-8 h-8 rounded-full bg-[#F7F7F5] items-center justify-center"
          >
            <ChevronLeft size={16} color="#121214" strokeWidth={2.5} />
          </TouchableOpacity>

          <Text className="text-sm font-black text-[#121214]">
            {monthLabel} {selectedMonthOffset === 0 ? "(Current)" : ""}
          </Text>

          <TouchableOpacity
            onPress={() => setSelectedMonthOffset(selectedMonthOffset + 1)}
            className="w-8 h-8 rounded-full bg-[#F7F7F5] items-center justify-center"
          >
            <ChevronRight size={16} color="#121214" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* 3-Way Navigation Pill: Top-Down Plan | Expectations vs Reality | 50-30-20 Rule */}
        <View style={{ flexDirection: "row", padding: 4, backgroundColor: "#EAEAE5", borderRadius: 9999, marginBottom: 14 }}>
          <TouchableOpacity
            onPress={() => setActiveTab("plan")}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 9999,
              alignItems: "center",
              backgroundColor: activeTab === "plan" ? "#121214" : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "800",
                color: activeTab === "plan" ? "#FFFFFF" : "#71717A",
              }}
            >
              Plan Envelope
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("reality")}
            style={{
              flex: 1.25,
              paddingVertical: 8,
              borderRadius: 9999,
              alignItems: "center",
              backgroundColor: activeTab === "reality" ? "#FFC83B" : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "800",
                color: "#121214",
              }}
            >
              Expectation vs Reality
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("50-30-20")}
            style={{
              flex: 0.95,
              paddingVertical: 8,
              borderRadius: 9999,
              alignItems: "center",
              backgroundColor: activeTab === "50-30-20" ? "#121214" : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "800",
                color: activeTab === "50-30-20" ? "#FFFFFF" : "#71717A",
              }}
            >
              50/30/20
            </Text>
          </TouchableOpacity>
        </View>

        {/* ----------------- TAB 1: TOP-DOWN PLAN ENVELOPE ----------------- */}
        {activeTab === "plan" && (
          <View>
            {/* Top-Down Budget Master Envelope Card */}
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
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: "800", color: "#121214", opacity: 0.7, textTransform: "uppercase" }}>
                      Monthly Ceiling (Top-Down)
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setCeilingStr((userDefinedCeilingPaise / 100).toString());
                        setCeilingModalVisible(true);
                      }}
                      style={{ padding: 2 }}
                    >
                      <Edit2 size={13} color="#121214" />
                    </TouchableOpacity>
                  </View>
                  <Text style={{ fontSize: 26, fontWeight: "900", color: "#121214", marginTop: 2 }}>
                    {formatCurrencyFromPaise(userDefinedCeilingPaise)}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#121214", opacity: 0.75, marginTop: 2 }}>
                    Total spend ceiling assigned by you
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
                    paddingVertical: 6,
                    borderRadius: 9999,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Edit2 size={11} color="#FFFFFF" />
                  <Text style={{ fontSize: 11, fontWeight: "800", color: "#FFFFFF" }}>
                    Edit Ceiling
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Envelope Division Bar */}
              <View style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: "800", color: "#121214" }}>
                    Envelope Allocated: {allocationPercent}%
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "800",
                      color: isOverAllocated ? "#EF4444" : "#121214",
                    }}
                  >
                    {isOverAllocated
                      ? `Over by ${formatCurrencyFromPaise(Math.abs(unallocatedBufferPaise))}`
                      : `${formatCurrencyFromPaise(unallocatedBufferPaise)} Buffer Remaining`}
                  </Text>
                </View>

                <View style={{ width: "100%", height: 8, backgroundColor: "rgba(0,0,0,0.12)", borderRadius: 4, overflow: "hidden" }}>
                  <View
                    style={{
                      width: `${Math.min(100, allocationPercent)}%`,
                      height: "100%",
                      backgroundColor: isOverAllocated ? "#EF4444" : "#121214",
                      borderRadius: 4,
                    }}
                  />
                </View>
              </View>

              {/* Envelope Breakdown Metrics */}
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 16,
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: "700", color: "#71717A" }}>Divided Slices</Text>
                  <Text style={{ fontSize: 13, fontWeight: "900", color: "#121214", marginTop: 2 }}>
                    {formatCurrencyFromPaise(totalAllocatedToCategoriesPaise)}
                  </Text>
                </View>

                <View
                  style={{
                    flex: 1,
                    backgroundColor: isOverAllocated ? "#FEECEB" : "#FFFFFF",
                    borderRadius: 16,
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: "700", color: isOverAllocated ? "#EF4444" : "#71717A" }}>
                    {isOverAllocated ? "Over-Allocated" : "Unallocated Buffer"}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "900",
                      color: isOverAllocated ? "#EF4444" : "#10B981",
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
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: "700", color: "#71717A" }}>Categories</Text>
                  <Text style={{ fontSize: 13, fontWeight: "900", color: "#121214", marginTop: 2 }}>
                    {currentBudgets.length} Envelopes
                  </Text>
                </View>
              </View>
            </View>

            {/* Category Allocations Section */}
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-sm font-black text-[#121214]">
                  Divided Category Envelopes
                </Text>
                <Caption>Slices of your {formatCurrencyFromPaise(userDefinedCeilingPaise)} ceiling</Caption>
              </View>

              <TouchableOpacity
                onPress={() => setCategoryModalVisible(true)}
                className="flex-row items-center gap-1 bg-[#121214] px-3 py-1.5 rounded-full"
              >
                <Plus size={12} color="#FFFFFF" strokeWidth={2.5} />
                <Text className="text-xs font-bold text-white">Add Slice</Text>
              </TouchableOpacity>
            </View>

            {currentBudgets.length === 0 ? (
              <View className="bg-white rounded-[24px] items-center py-10 px-6 border border-[#EAEAE5] shadow-sm">
                <Target size={36} color="#A1A1AA" />
                <Text className="text-sm font-bold text-[#121214] mt-3">
                  No Categories Allocated Yet
                </Text>
                <Caption className="text-center mt-1 mb-4">
                  Divide your {formatCurrencyFromPaise(userDefinedCeilingPaise)} ceiling into targeted category budgets (Groceries, Food, Bills).
                </Caption>
                <TouchableOpacity
                  onPress={() => setCategoryModalVisible(true)}
                  style={{
                    backgroundColor: "#FFC83B",
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 9999,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "800", color: "#121214" }}>
                    + Allocate First Slice
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              currentBudgets.map((b) => {
                const spent = categorySpendingMap[b.category_id] || 0;
                const limit = b.limit_amount_paise;
                const percentOfCeiling = userDefinedCeilingPaise > 0
                  ? Math.round((limit / userDefinedCeilingPaise) * 100)
                  : 0;
                const percentSpent = Math.min(100, Math.round((spent / limit) * 100));
                const isOver = spent > limit;

                return (
                  <View
                    key={b.id}
                    className="bg-white rounded-[24px] p-4 mb-3 border border-[#EAEAE5] shadow-sm"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center gap-2">
                        <View
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: b.category?.color || "#FFC83B" }}
                        />
                        <Text className="text-sm font-bold text-[#121214]">
                          {b.category?.name || "Category"}
                        </Text>
                        <View className="bg-[#F7F7F5] px-2 py-0.5 rounded-full border border-[#EAEAE5]">
                          <Text className="text-[10px] font-bold text-[#71717A]">
                            {percentOfCeiling}% of ceiling
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-2">
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedCatId(b.category_id);
                            setLimitStr((b.limit_amount_paise / 100).toString());
                            setCategoryModalVisible(true);
                          }}
                          className="p-1 opacity-40 active:opacity-100"
                        >
                          <Edit2 size={13} color="#121214" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => deleteBudget(b.id)}
                          className="p-1 opacity-40 active:opacity-100"
                        >
                          <Trash2 size={13} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Progress Bar of actual spend against allocation */}
                    <View className="w-full bg-[#F0EFEA] rounded-full h-2 overflow-hidden my-2">
                      <View
                        className="h-2 rounded-full"
                        style={{
                          width: `${percentSpent}%`,
                          backgroundColor: isOver ? "#EF4444" : b.category?.color || "#121214",
                        }}
                      />
                    </View>

                    <View className="flex-row justify-between items-center mt-1">
                      <Text className="text-xs text-[#71717A]">
                        Allocated:{" "}
                        <Text className="font-bold text-[#121214]">
                          {formatCurrencyFromPaise(limit)}
                        </Text>
                      </Text>
                      <Text className="text-xs text-[#71717A]">
                        Spent:{" "}
                        <Text
                          className={`font-bold ${
                            isOver ? "text-red-500" : "text-[#121214]"
                          }`}
                        >
                          {formatCurrencyFromPaise(spent)} ({percentSpent}%)
                        </Text>
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ----------------- TAB 2: EXPECTATIONS VS REALITY ----------------- */}
        {activeTab === "reality" && (
          <View>
            {/* Net Scorecard Card */}
            <View
              style={{
                backgroundColor: isOverallUnderBudget ? "#F0FDF4" : "#FEF2F2",
                borderColor: isOverallUnderBudget ? "#BBF7D0" : "#FECACA",
                borderWidth: 1,
                borderRadius: 28,
                padding: 20,
                marginBottom: 16,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <View>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "800",
                      color: isOverallUnderBudget ? "#15803D" : "#B91C1C",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Expectation vs Reality Outcome
                  </Text>
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "900",
                      color: isOverallUnderBudget ? "#166534" : "#991B1B",
                      marginTop: 2,
                    }}
                  >
                    {isOverallUnderBudget
                      ? `+${formatCurrencyFromPaise(netVariancePaise)} Saved`
                      : `-${formatCurrencyFromPaise(Math.abs(netVariancePaise))} Over Budget`}
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: isOverallUnderBudget ? "#DCFCE7" : "#FEE2E2",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 9999,
                    borderWidth: 1,
                    borderColor: isOverallUnderBudget ? "#86EFAC" : "#FCA5A5",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "900",
                      color: isOverallUnderBudget ? "#15803D" : "#B91C1C",
                    }}
                  >
                    {isOverallUnderBudget ? "UNDER BUDGET" : "DEFICIT"}
                  </Text>
                </View>
              </View>

              {/* Side-by-side Expectation vs Reality comparative meters */}
              <View style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#52525B" }}>
                    Expected Ceiling: {formatCurrencyFromPaise(userDefinedCeilingPaise)}
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: "800", color: "#121214" }}>
                    Reality Spent: {formatCurrencyFromPaise(totalActualMonthSpendPaise)} ({realitySpendPercent}%)
                  </Text>
                </View>

                {/* Comparative Dual Bar */}
                <View style={{ width: "100%", height: 10, backgroundColor: "#E4E4E7", borderRadius: 5, overflow: "hidden" }}>
                  <View
                    style={{
                      width: `${realitySpendPercent}%`,
                      height: "100%",
                      backgroundColor: isOverallUnderBudget ? "#16A34A" : "#DC2626",
                      borderRadius: 5,
                    }}
                  />
                </View>
              </View>

              {/* Projection & Pace Insight */}
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  padding: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Zap size={18} color="#D97706" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: "800", color: "#121214" }}>
                    Month-End Reality Projection
                  </Text>
                  <Text style={{ fontSize: 11, color: "#71717A", marginTop: 1 }}>
                    At your current burn rate, you are on track to spend{" "}
                    <Text style={{ fontWeight: "800", color: projectedMonthSpendPaise > userDefinedCeilingPaise ? "#EF4444" : "#10B981" }}>
                      {formatCurrencyFromPaise(projectedMonthSpendPaise)}
                    </Text>{" "}
                    by month end ({daysInMonth - dayProgress} days left).
                  </Text>
                </View>
              </View>
            </View>

            {/* Category-by-Category Expectation vs Reality Breakdown */}
            <Text className="text-sm font-black text-[#121214] mb-3">
              Category Variance Breakdown
            </Text>

            {currentBudgets.length === 0 ? (
              <View className="bg-white rounded-[24px] p-6 items-center border border-[#EAEAE5]">
                <Scale size={32} color="#A1A1AA" />
                <Text className="text-sm font-bold text-[#121214] mt-2">
                  No Category Plans to Compare
                </Text>
                <Caption className="text-center mt-1">
                  Add category envelopes in the "Plan Envelope" tab to see category-by-category expectations vs reality.
                </Caption>
              </View>
            ) : (
              currentBudgets.map((b) => {
                const expectedLimit = b.limit_amount_paise;
                const realitySpent = categorySpendingMap[b.category_id] || 0;
                const variancePaise = expectedLimit - realitySpent;
                const isUnder = variancePaise >= 0;
                const percentSpent = Math.min(100, Math.round((realitySpent / expectedLimit) * 100));

                return (
                  <View
                    key={b.id}
                    className="bg-white rounded-[24px] p-4 mb-3 border border-[#EAEAE5] shadow-sm"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center gap-2">
                        <View
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: b.category?.color || "#121214" }}
                        />
                        <Text className="text-sm font-bold text-[#121214]">
                          {b.category?.name || "Category"}
                        </Text>
                      </View>

                      {/* Variance Badge */}
                      <View
                        style={{
                          backgroundColor: isUnder ? "#DCFCE7" : "#FEE2E2",
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 9999,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "800",
                            color: isUnder ? "#15803D" : "#B91C1C",
                          }}
                        >
                          {isUnder
                            ? `🟢 Saved ${formatCurrencyFromPaise(variancePaise)}`
                            : `🔴 Over by ${formatCurrencyFromPaise(Math.abs(variancePaise))}`}
                        </Text>
                      </View>
                    </View>

                    {/* Comparative Dual Bar */}
                    <View className="mb-2">
                      <View className="w-full bg-[#F4F4F0] rounded-full h-2.5 overflow-hidden">
                        <View
                          className="h-2.5 rounded-full"
                          style={{
                            width: `${percentSpent}%`,
                            backgroundColor: isUnder ? (b.category?.color || "#10B981") : "#EF4444",
                          }}
                        />
                      </View>
                    </View>

                    {/* Side-by-side Expectation vs Reality Metrics */}
                    <View className="flex-row justify-between items-center pt-1 border-t border-[#F4F4F0]">
                      <View>
                        <Text className="text-[10px] text-[#71717A] uppercase font-bold">Expectation (Planned)</Text>
                        <Text className="text-xs font-black text-[#121214]">
                          {formatCurrencyFromPaise(expectedLimit)}
                        </Text>
                      </View>

                      <View className="items-center">
                        <Text className="text-[10px] text-[#71717A] uppercase font-bold">Reality (Spent)</Text>
                        <Text
                          className={`text-xs font-black ${
                            isUnder ? "text-[#121214]" : "text-red-600"
                          }`}
                        >
                          {formatCurrencyFromPaise(realitySpent)} ({percentSpent}%)
                        </Text>
                      </View>

                      <View className="items-end">
                        <Text className="text-[10px] text-[#71717A] uppercase font-bold">Variance</Text>
                        <Text
                          className={`text-xs font-black ${
                            isUnder ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {isUnder ? `+${formatCurrencyFromPaise(variancePaise)}` : `-${formatCurrencyFromPaise(Math.abs(variancePaise))}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}

            {/* Unplanned / Out-of-Budget Reality Transactions */}
            {(() => {
              const budgetedCategoryIds = new Set(currentBudgets.map((b) => b.category_id));
              const unbudgetedSpends = Object.entries(categorySpendingMap).filter(
                ([catId, spent]) => !budgetedCategoryIds.has(catId) && spent > 0
              );

              if (unbudgetedSpends.length === 0) return null;

              return (
                <View className="mt-2 bg-[#FFFBEB] rounded-[24px] p-4 border border-[#FDE68A] mb-4">
                  <View className="flex-row items-center gap-2 mb-2">
                    <AlertTriangle size={16} color="#D97706" />
                    <Text className="text-xs font-extrabold text-[#92400E]">
                      Unbudgeted Reality Spends
                    </Text>
                  </View>
                  <Text className="text-xs text-[#78350F] mb-3">
                    These categories had spending in {monthLabel} without an allocated envelope:
                  </Text>

                  {unbudgetedSpends.map(([catId, spent]) => {
                    const cat = categories.find((c) => c.id === catId);
                    return (
                      <View
                        key={catId}
                        className="flex-row items-center justify-between py-1.5 border-b border-[#FEF3C7]"
                      >
                        <Text className="text-xs font-bold text-[#121214]">
                          {cat?.name || "Uncategorized"}
                        </Text>
                        <Text className="text-xs font-black text-red-600">
                          {formatCurrencyFromPaise(spent)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              );
            })()}
          </View>
        )}

        {/* ----------------- TAB 3: 50-30-20 RULE ----------------- */}
        {activeTab === "50-30-20" && (
          <View className="mb-4">
            <View className="bg-white rounded-[26px] p-5 mb-4 border border-[#EAEAE5] shadow-sm">
              <View className="flex-row items-center gap-2 mb-2">
                <Sparkles size={16} color="#B45309" />
                <Text className="text-xs font-black text-[#121214] uppercase tracking-wider">
                  50 / 30 / 20 Macro Allocation
                </Text>
              </View>
              <Text className="text-xs text-[#71717A] mb-4">
                The gold standard personal finance framework based on monthly income of{" "}
                <Text className="font-bold text-[#121214]">
                  {formatCurrencyFromPaise(monthlyIncomePaise)}
                </Text>
                .
              </Text>

              {/* Needs: 50% */}
              <View className="mb-4 p-3.5 bg-[#F7F7F5] rounded-2xl border border-[#EAEAE5]">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <Text className="text-xs font-extrabold text-[#121214]">
                      Needs (50% Target)
                    </Text>
                  </View>
                  <Text className="text-xs font-black text-[#121214]">
                    {formatCurrencyFromPaise(actualNeedsSpentPaise)} / {formatCurrencyFromPaise(targetNeedsPaise)}
                  </Text>
                </View>
                <Text className="text-[11px] text-[#71717A] mb-2">
                  Rent, Bills, Groceries, Fuel & Health Essentials
                </Text>
                <View className="w-full bg-[#EAEAE5] rounded-full h-1.5 overflow-hidden">
                  <View
                    className="h-1.5 rounded-full bg-blue-500"
                    style={{
                      width: `${Math.min(100, Math.round((actualNeedsSpentPaise / targetNeedsPaise) * 100))}%`,
                    }}
                  />
                </View>
              </View>

              {/* Wants: 30% */}
              <View className="mb-4 p-3.5 bg-[#F7F7F5] rounded-2xl border border-[#EAEAE5]">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <Text className="text-xs font-extrabold text-[#121214]">
                      Wants (30% Target)
                    </Text>
                  </View>
                  <Text className="text-xs font-black text-[#121214]">
                    {formatCurrencyFromPaise(actualWantsSpentPaise)} / {formatCurrencyFromPaise(targetWantsPaise)}
                  </Text>
                </View>
                <Text className="text-[11px] text-[#71717A] mb-2">
                  Dining Out, Food Delivery, Movies, Shopping & Travel
                </Text>
                <View className="w-full bg-[#EAEAE5] rounded-full h-1.5 overflow-hidden">
                  <View
                    className="h-1.5 rounded-full bg-amber-500"
                    style={{
                      width: `${Math.min(100, Math.round((actualWantsSpentPaise / targetWantsPaise) * 100))}%`,
                    }}
                  />
                </View>
              </View>

              {/* Savings & Investments: 20% */}
              <View className="p-3.5 bg-[#F7F7F5] rounded-2xl border border-[#EAEAE5]">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <Text className="text-xs font-extrabold text-[#121214]">
                      Savings & Emergency (20% Target)
                    </Text>
                  </View>
                  <Text className="text-xs font-black text-emerald-600">
                    {formatCurrencyFromPaise(targetSavingsPaise)} Target
                  </Text>
                </View>
                <Text className="text-[11px] text-[#71717A] mb-2">
                  Mutual Funds, Stocks, Emergency Reserve & Cash Buffer
                </Text>
                <View className="w-full bg-[#EAEAE5] rounded-full h-1.5 overflow-hidden">
                  <View
                    className="h-1.5 rounded-full bg-emerald-500"
                    style={{
                      width: "100%",
                    }}
                  />
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ----------------- MODAL: EDIT TOP-DOWN CEILING ----------------- */}
      <Modal
        visible={ceilingModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCeilingModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[32px] p-6 pb-10">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-lg font-black text-[#121214]">
                  Set Monthly Spend Ceiling
                </Text>
                <Caption>Top-down total limit for {monthLabel}</Caption>
              </View>
              <TouchableOpacity
                onPress={() => setCeilingModalVisible(false)}
                className="w-8 h-8 rounded-full bg-[#F7F7F5] items-center justify-center"
              >
                <X size={16} color="#121214" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-[#71717A] mb-3">
              Define the overall monthly amount you wish to allocate. You will then divide this ceiling into categories.
            </Text>

            {/* Quick Ceiling Presets */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {[30000, 50000, 60000, 75000, 100000].map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setCeilingStr(val.toString())}
                  style={{
                    paddingVertical: 7,
                    paddingHorizontal: 12,
                    borderRadius: 9999,
                    backgroundColor: "#F7F7F5",
                    borderWidth: 1,
                    borderColor: "#EAEAE5",
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "800", color: "#121214" }}>
                    ₹{val.toLocaleString("en-IN")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Total Monthly Budget Ceiling (₹)"
              placeholder="e.g. 60000"
              keyboardType="numeric"
              value={ceilingStr}
              onChangeText={setCeilingStr}
              containerClassName="mb-6"
            />

            <TouchableOpacity
              onPress={handleSaveCeiling}
              style={{
                backgroundColor: "#121214",
                paddingVertical: 14,
                borderRadius: 9999,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
                Confirm Monthly Ceiling
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ----------------- MODAL: ALLOCATE CATEGORY SLICE ----------------- */}
      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[32px] p-6 pb-10">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-lg font-black text-[#121214]">
                  Allocate Category Slice
                </Text>
                <Caption>
                  Remaining Buffer: {formatCurrencyFromPaise(Math.max(0, unallocatedBufferPaise))}
                </Caption>
              </View>
              <TouchableOpacity
                onPress={() => setCategoryModalVisible(false)}
                className="w-8 h-8 rounded-full bg-[#F7F7F5] items-center justify-center"
              >
                <X size={16} color="#121214" />
              </TouchableOpacity>
            </View>

            {/* Category Selector Chips */}
            <Text className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider mb-2">
              Select Category
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-4">
              {expenseCategories.map((c) => {
                const isSelected = selectedCatId === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setSelectedCatId(c.id)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 9999,
                      marginRight: 8,
                      backgroundColor: isSelected ? "#FFC83B" : "#F7F7F5",
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
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Quick preset amount chips */}
            <Text className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider mb-2">
              Quick Slice Presets
            </Text>
            <View className="flex-row gap-2 mb-4">
              {[2000, 5000, 10000, 15000, 25000].map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setLimitStr(val.toString())}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 11,
                    borderRadius: 9999,
                    backgroundColor: "#F7F7F5",
                    borderWidth: 1,
                    borderColor: "#EAEAE5",
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "800", color: "#121214" }}>
                    ₹{val.toLocaleString("en-IN")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Category Allocation (₹)"
              placeholder="e.g. 10000"
              keyboardType="numeric"
              value={limitStr}
              onChangeText={setLimitStr}
              containerClassName="mb-6"
            />

            <TouchableOpacity
              onPress={handleCreateCategoryBudget}
              style={{
                backgroundColor: "#121214",
                paddingVertical: 14,
                borderRadius: 9999,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
                Save Category Allocation
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
