import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Settings,
  Database,
  Shield,
  Download,
  Trash2,
  CheckCircle,
  HelpCircle,
  FileSpreadsheet,
  ArrowLeft,
} from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { Caption } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useFinanceStore } from "@/store/useFinanceStore";
import { WageLogo, WageBadge } from "@/components/ui/wage-logo";
import { WageLoadingScreen } from "@/components/ui/wage-loading-screen";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [showLoadingPreview, setShowLoadingPreview] = useState(false);
  const accounts = useFinanceStore((s) => s.accounts);
  const transactions = useFinanceStore((s) => s.transactions);
  const budgets = useFinanceStore((s) => s.budgets);

  const handleExportData = async () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      version: "1.0.0",
      accounts,
      transactions,
      budgets,
    };

    try {
      await Share.share({
        title: "Wage Finance Backup",
        message: JSON.stringify(backupData, null, 2),
      });
    } catch (e: any) {
      Alert.alert("Export Error", e?.message || "Failed to export data");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F7F7F5" }}>
      {/* Header - Guaranteed Notch Clearance */}
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
            <Caption>PREFERENCES</Caption>
            <Text className="text-xl font-black text-[#121214]">
              Settings
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Minimalist Wage Brand Section */}
        <View className="items-center py-4 mb-2">
          <WageLogo size={72} />
          <TouchableOpacity
            onPress={() => setShowLoadingPreview(true)}
            activeOpacity={0.7}
            className="mt-3 px-3.5 py-1.5 rounded-full bg-white border border-[#EAEAE5]"
          >
            <Text className="text-xs font-bold text-[#71717A]">
              Preview Loading Screen
            </Text>
          </TouchableOpacity>
        </View>

        {/* Backend & Sync Status */}
        <View className="bg-white dark:bg-charcoal-900 rounded-[24px] p-5 mb-4 border border-[#EAEAE5] dark:border-charcoal-800 shadow-sm">
          <View className="flex-row items-center justify-between pb-3.5 border-b border-[#F0EFEA] dark:border-charcoal-800">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-[#FFF4D2] items-center justify-center">
                <Database size={18} color="#B45309" />
              </View>
              <View>
                <Text className="text-sm font-bold text-[#121214] dark:text-[#F4F4F5]">
                  Storage Mode
                </Text>
                <Text className="text-xs text-[#71717A]">
                  {isSupabaseConfigured ? "Connected to Supabase" : "Self-Contained Local Mode"}
                </Text>
              </View>
            </View>
            <Badge
              label={isSupabaseConfigured ? "Cloud Active" : "Local Mode"}
              variant={isSupabaseConfigured ? "success" : "gold"}
              size="sm"
            />
          </View>

          <View className="flex-row items-center justify-between pt-3.5">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-[#F7F7F5] items-center justify-center">
                <Shield size={18} color="#121214" />
              </View>
              <Text className="text-sm font-bold text-[#121214] dark:text-[#F4F4F5]">
                Primary Currency
              </Text>
            </View>
            <Text className="text-xs font-black text-[#121214] dark:text-[#F4F4F5]">INR (₹)</Text>
          </View>
        </View>

        {/* Independent Data Portability */}
        <View className="bg-white dark:bg-charcoal-900 rounded-[24px] p-5 mb-4 border border-[#EAEAE5] dark:border-charcoal-800 shadow-sm">
          <Caption className="mb-3">DATA BACKUP & PRIVACY</Caption>
          <TouchableOpacity
            onPress={handleExportData}
            className="flex-row items-center justify-between py-3 border-b border-[#F0EFEA] dark:border-charcoal-800"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-[#FFC83B] items-center justify-center">
                <Download size={18} color="#121214" />
              </View>
              <View>
                <Text className="text-sm font-bold text-[#121214] dark:text-[#F4F4F5]">
                  Export Complete Backup
                </Text>
                <Text className="text-xs text-[#71717A]">
                  JSON file with all accounts & ledger history
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <View className="flex-row items-center justify-between pt-3">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-[#E6FBF2] items-center justify-center">
                <CheckCircle size={18} color="#10B981" />
              </View>
              <View>
                <Text className="text-sm font-bold text-[#121214] dark:text-[#F4F4F5]">
                  100% Privacy Guarantee
                </Text>
                <Text className="text-xs text-[#71717A]">
                  No banking credentials or telemetry collected
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* App Info */}
        <View className="bg-white dark:bg-charcoal-900 rounded-[24px] p-5 mb-5 border border-[#EAEAE5] dark:border-charcoal-800 shadow-sm">
          <Caption className="mb-2">ABOUT APPLICATION</Caption>
          <View className="flex-row justify-between py-1.5 border-b border-[#F0EFEA] dark:border-charcoal-800">
            <Text className="text-xs text-[#71717A]">App Name</Text>
            <Text className="text-xs font-black text-[#121214] dark:text-[#F4F4F5]">Wage</Text>
          </View>
          <View className="flex-row justify-between py-1.5 border-b border-[#F0EFEA] dark:border-charcoal-800">
            <Text className="text-xs text-[#71717A]">Version</Text>
            <Text className="text-xs font-black text-[#121214] dark:text-[#F4F4F5]">1.0.0 (Wage Intelligence)</Text>
          </View>
          <View className="flex-row justify-between py-1.5">
            <Text className="text-xs text-[#71717A]">Design Language</Text>
            <Text className="text-xs font-black text-[#121214] dark:text-[#F4F4F5]">Warm Gold & Floating Dock</Text>
          </View>
        </View>
      </ScrollView>

      {showLoadingPreview && (
        <WageLoadingScreen
          minDurationMs={2000}
          onFinish={() => setShowLoadingPreview(false)}
        />
      )}
    </View>
  );
}
