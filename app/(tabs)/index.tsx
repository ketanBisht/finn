import React from "react";
import { View, ScrollView, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  AlertCircle,
} from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heading, Subheading, Body, Caption, FinancialAmount } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function DashboardScreen() {
  // Foundational mockup values for Phase 1 verification
  const totalBalancePaise = 24500000; // ₹2,45,000.00
  const monthlyIncomePaise = 12000000; // ₹1,20,000.00
  const monthlyExpensesPaise = 4250000; // ₹42,500.00
  const remainingBudgetPaise = 3750000; // ₹37,500.00

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-5">
          <View>
            <Caption>WELCOME BACK</Caption>
            <Heading className="text-xl">Financial Overview</Heading>
          </View>
          <View className="flex-row items-center gap-2">
            {isSupabaseConfigured ? (
              <Badge label="Cloud Sync" variant="success" />
            ) : (
              <Badge label="Setup Mode" variant="warning" />
            )}
          </View>
        </View>

        {/* Total Net Balance Card */}
        <View className="bg-emerald-600 rounded-3xl p-6 mb-5 shadow-lg shadow-emerald-900/20">
          <Text className="text-emerald-100 text-xs font-semibold tracking-wider uppercase mb-1">
            Total Net Balance
          </Text>
          <FinancialAmount
            amountPaise={totalBalancePaise}
            type="neutral"
            prefix="₹"
            className="text-white text-3xl font-extrabold mb-4"
          />

          <View className="flex-row items-center justify-between pt-4 border-t border-emerald-500/40">
            <View>
              <Text className="text-emerald-200 text-xs font-medium">Income This Month</Text>
              <FinancialAmount
                amountPaise={monthlyIncomePaise}
                type="neutral"
                prefix="₹"
                className="text-white text-sm font-semibold"
              />
            </View>
            <View className="items-end">
              <Text className="text-emerald-200 text-xs font-medium">Expenses This Month</Text>
              <FinancialAmount
                amountPaise={monthlyExpensesPaise}
                type="neutral"
                prefix="₹"
                className="text-white text-sm font-semibold"
              />
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="flex-row gap-3 mb-5">
          <Button
            title="Add Income"
            variant="secondary"
            className="flex-1 bg-white border border-slate-200"
            leftIcon={<ArrowDownLeft size={16} color="#10b981" />}
            onPress={() => router.push("/transaction/new?type=income")}
          />
          <Button
            title="Add Expense"
            variant="secondary"
            className="flex-1 bg-white border border-slate-200"
            leftIcon={<ArrowUpRight size={16} color="#ef4444" />}
            onPress={() => router.push("/transaction/new?type=expense")}
          />
        </View>

        {/* Monthly Budget Summary Card */}
        <Card className="mb-5">
          <View className="flex-row items-center justify-between mb-3">
            <Subheading className="text-base">Monthly Budget</Subheading>
            <Badge label="On Track" variant="success" size="sm" />
          </View>
          <View className="flex-row items-center justify-between mb-2">
            <Body className="text-xs">Remaining to spend</Body>
            <FinancialAmount
              amountPaise={remainingBudgetPaise}
              type="neutral"
              className="text-sm font-semibold text-slate-800"
            />
          </View>
          {/* Progress Bar */}
          <View className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <View
              className="bg-emerald-500 h-2.5 rounded-full"
              style={{ width: "53%" }}
            />
          </View>
          <View className="flex-row justify-between mt-2">
            <Caption>Spent: ₹42,500</Caption>
            <Caption>Budget: ₹80,000</Caption>
          </View>
        </Card>

        {/* Foundation & Architecture Status Card */}
        <Card className="mb-5 bg-emerald-50/50 border-emerald-100">
          <View className="flex-row items-start gap-3">
            <ShieldCheck size={22} color="#059669" className="mt-0.5" />
            <View className="flex-1">
              <Text className="text-emerald-950 font-bold text-sm">
                Phase 1 Architecture Active
              </Text>
              <Text className="text-emerald-800 text-xs mt-1 leading-5">
                • Expo Router navigation initialized{"\n"}
                • NativeWind styling loaded{"\n"}
                • TanStack Query & Zustand stores active{"\n"}
                • Supabase client with SecureStore configured{"\n"}
                • Integer-paise financial precision enabled
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

