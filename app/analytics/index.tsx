import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ArrowLeft,
  PieChart,
  Globe,
  Smartphone,
  TrendingDown,
  Calendar,
  Sparkles,
  Zap,
  CreditCard,
  Building2,
  Coins,
} from "lucide-react-native";
import { Caption, FinancialAmount } from "@/components/ui/typography";
import { useFinanceStore } from "@/store/useFinanceStore";
import { formatCurrencyFromPaise } from "@/lib/utils";

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"platforms" | "upi" | "categories">("platforms");

  const transactions = useFinanceStore((s) => s.transactions);
  const categories = useFinanceStore((s) => s.categories);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Monthly expense transactions
  const monthlyExpenses = transactions.filter((t) => {
    const d = new Date(t.transaction_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === "expense";
  });

  const totalMonthlySpendPaise = monthlyExpenses.reduce((sum, t) => sum + t.amount_paise, 0);

  // 1. Platform Analytics
  const platformSpendMap: Record<string, { totalPaise: number; count: number }> = {};
  monthlyExpenses.forEach((t) => {
    const plat = t.platform || "In-Store / Direct";
    if (!platformSpendMap[plat]) {
      platformSpendMap[plat] = { totalPaise: 0, count: 0 };
    }
    platformSpendMap[plat].totalPaise += t.amount_paise;
    platformSpendMap[plat].count += 1;
  });

  const platformAnalytics = Object.entries(platformSpendMap)
    .map(([platform, data]) => ({
      platform,
      totalPaise: data.totalPaise,
      count: data.count,
      percent: totalMonthlySpendPaise > 0 ? Math.round((data.totalPaise / totalMonthlySpendPaise) * 100) : 0,
    }))
    .sort((a, b) => b.totalPaise - a.totalPaise);

  // 2. UPI App & Payment Mode Analytics
  const upiSpendMap: Record<string, { totalPaise: number; count: number }> = {};
  monthlyExpenses.forEach((t) => {
    const mode = t.upi_app
      ? t.upi_app === "gpay"
        ? "Google Pay"
        : t.upi_app === "phonepe"
        ? "PhonePe"
        : t.upi_app === "paytm"
        ? "Paytm"
        : t.upi_app === "cred"
        ? "CRED UPI"
        : t.upi_app.toUpperCase()
      : t.payment_mode
      ? t.payment_mode.toUpperCase()
      : "Cash / Other";

    if (!upiSpendMap[mode]) {
      upiSpendMap[mode] = { totalPaise: 0, count: 0 };
    }
    upiSpendMap[mode].totalPaise += t.amount_paise;
    upiSpendMap[mode].count += 1;
  });

  const upiAnalytics = Object.entries(upiSpendMap)
    .map(([mode, data]) => ({
      mode,
      totalPaise: data.totalPaise,
      count: data.count,
      percent: totalMonthlySpendPaise > 0 ? Math.round((data.totalPaise / totalMonthlySpendPaise) * 100) : 0,
    }))
    .sort((a, b) => b.totalPaise - a.totalPaise);

  // 3. Category Analytics
  const categoryAnalytics = categories
    .filter((c) => c.type === "expense")
    .map((cat) => {
      const catSpent = monthlyExpenses
        .filter((t) => t.category_id === cat.id)
        .reduce((sum, t) => sum + t.amount_paise, 0);
      return {
        ...cat,
        spentPaise: catSpent,
        percent: totalMonthlySpendPaise > 0 ? Math.round((catSpent / totalMonthlySpendPaise) * 100) : 0,
      };
    })
    .filter((c) => c.spentPaise > 0)
    .sort((a, b) => b.spentPaise - a.spentPaise);

  // Velocity Metrics
  const avgSpendPerTx =
    monthlyExpenses.length > 0 ? Math.round(totalMonthlySpendPaise / monthlyExpenses.length) : 0;

  const largestTx = monthlyExpenses.reduce(
    (max, t) => (t.amount_paise > (max?.amount_paise || 0) ? t : max),
    null as typeof monthlyExpenses[0] | null
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F7F7F5" }}>
      {/* Top Header - Guaranteed Notch Clearance */}
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
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-white border border-[#EAEAE5] items-center justify-center"
          >
            <ArrowLeft size={18} color="#121214" />
          </TouchableOpacity>
          <View>
            <Caption>SPEND INTELLIGENCE</Caption>
            <Text className="text-xl font-black text-[#121214]">
              Analytics & Insights
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Warm Golden Summary Banner */}
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
          <Text style={{ fontSize: 11, fontWeight: "800", color: "#121214", opacity: 0.7, textTransform: "uppercase" }}>
            Total Outflow Tracked
          </Text>
          <Text style={{ fontSize: 26, fontWeight: "900", color: "#121214", marginTop: 2, marginBottom: 12 }}>
            {formatCurrencyFromPaise(totalMonthlySpendPaise)}
          </Text>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                paddingVertical: 8,
                paddingHorizontal: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#71717A" }}>Total Orders</Text>
              <Text style={{ fontSize: 14, fontWeight: "900", color: "#121214", marginTop: 1 }}>
                {monthlyExpenses.length} Txns
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                paddingVertical: 8,
                paddingHorizontal: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#71717A" }}>Avg Ticket</Text>
              <Text style={{ fontSize: 14, fontWeight: "900", color: "#121214", marginTop: 1 }}>
                {formatCurrencyFromPaise(avgSpendPerTx, { showDecimals: false })}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                paddingVertical: 8,
                paddingHorizontal: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#71717A" }}>Top Order</Text>
              <Text style={{ fontSize: 14, fontWeight: "900", color: "#EF4444", marginTop: 1 }}>
                {largestTx ? formatCurrencyFromPaise(largestTx.amount_paise, { showDecimals: false }) : "₹0"}
              </Text>
            </View>
          </View>
        </View>

        {/* Analytics Mode Tabs */}
        <View style={{ flexDirection: "row", padding: 4, backgroundColor: "#EAEAE5", borderRadius: 9999, marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => setActiveTab("platforms")}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 9999,
              alignItems: "center",
              backgroundColor: activeTab === "platforms" ? "#FFC83B" : "transparent",
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "800", color: "#121214" }}>
              Platforms ({platformAnalytics.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("upi")}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 9999,
              alignItems: "center",
              backgroundColor: activeTab === "upi" ? "#FFC83B" : "transparent",
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "800", color: "#121214" }}>
              UPI & Payment
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("categories")}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 9999,
              alignItems: "center",
              backgroundColor: activeTab === "categories" ? "#121214" : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "800",
                color: activeTab === "categories" ? "#FFFFFF" : "#71717A",
              }}
            >
              Categories
            </Text>
          </TouchableOpacity>
        </View>

        {/* 1. Platforms Analytics View */}
        {activeTab === "platforms" && (
          <View className="bg-white rounded-[26px] p-5 mb-4 border border-[#EAEAE5] shadow-sm">
            <View className="flex-row items-center gap-2 mb-3">
              <Globe size={16} color="#121214" />
              <Text className="text-xs font-black text-[#121214] uppercase tracking-wider">
                Spending by Merchant & App
              </Text>
            </View>

            {platformAnalytics.map((item, idx) => (
              <View key={item.platform} className="mb-4">
                <View className="flex-row items-center justify-between mb-1.5">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs font-black text-[#71717A]">#{idx + 1}</Text>
                    <Text className="text-sm font-bold text-[#121214]">{item.platform}</Text>
                    <View className="bg-[#F7F7F5] px-2 py-0.5 rounded-full border border-[#EAEAE5]">
                      <Text className="text-[10px] font-bold text-[#71717A]">{item.count} orders</Text>
                    </View>
                  </View>
                  <Text className="text-sm font-black text-[#121214]">
                    {formatCurrencyFromPaise(item.totalPaise)} ({item.percent}%)
                  </Text>
                </View>
                <View className="w-full bg-[#F0EFEA] rounded-full h-2 overflow-hidden">
                  <View
                    className="h-2 rounded-full bg-[#FFC83B]"
                    style={{ width: `${item.percent}%` }}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 2. UPI & Payment Mode Analytics View */}
        {activeTab === "upi" && (
          <View className="bg-white rounded-[26px] p-5 mb-4 border border-[#EAEAE5] shadow-sm">
            <View className="flex-row items-center gap-2 mb-3">
              <Smartphone size={16} color="#121214" />
              <Text className="text-xs font-black text-[#121214] uppercase tracking-wider">
                UPI & Payment Channel Breakdown
              </Text>
            </View>

            {upiAnalytics.map((item) => (
              <View key={item.mode} className="mb-4">
                <View className="flex-row items-center justify-between mb-1.5">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-bold text-[#121214]">{item.mode}</Text>
                    <Text className="text-xs text-[#71717A]">({item.count} txns)</Text>
                  </View>
                  <Text className="text-sm font-black text-[#121214]">
                    {formatCurrencyFromPaise(item.totalPaise)} ({item.percent}%)
                  </Text>
                </View>
                <View className="w-full bg-[#F0EFEA] rounded-full h-2 overflow-hidden">
                  <View
                    className="h-2 rounded-full bg-[#121214]"
                    style={{ width: `${item.percent}%` }}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 3. Category Analytics View */}
        {activeTab === "categories" && (
          <View className="bg-white rounded-[26px] p-5 mb-4 border border-[#EAEAE5] shadow-sm">
            <View className="flex-row items-center gap-2 mb-3">
              <PieChart size={16} color="#121214" />
              <Text className="text-xs font-black text-[#121214] uppercase tracking-wider">
                Category Expense Share
              </Text>
            </View>

            {categoryAnalytics.map((cat) => (
              <View key={cat.id} className="mb-3.5">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color || "#FFC83B" }}
                    />
                    <Text className="text-xs font-bold text-[#121214]">{cat.name}</Text>
                  </View>
                  <Text className="text-xs font-black text-[#121214]">
                    {formatCurrencyFromPaise(cat.spentPaise)} ({cat.percent}%)
                  </Text>
                </View>
                <View className="w-full bg-[#F0EFEA] rounded-full h-2 overflow-hidden">
                  <View
                    className="h-2 rounded-full"
                    style={{
                      width: `${cat.percent}%`,
                      backgroundColor: cat.color || "#FFC83B",
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

