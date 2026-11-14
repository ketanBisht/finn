import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Settings,
  Database,
  Shield,
  Download,
  Trash2,
  CheckCircle,
  HelpCircle,
  FileSpreadsheet,
} from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heading, Caption, Body } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useFinanceStore } from "@/store/useFinanceStore";

export default function SettingsScreen() {
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
        title: "Finn Finance Backup",
        message: JSON.stringify(backupData, null, 2),
      });
    } catch (e: any) {
      Alert.alert("Export Error", e?.message || "Failed to export data");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 60 }}
      >
        <View className="mb-5">
          <Caption>CONFIG & TOOLS</Caption>
          <Heading className="text-xl">Settings</Heading>
        </View>

        {/* Backend & Sync Status */}
        <Card className="mb-4">
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <View className="flex-row items-center gap-3">
              <Database size={18} color="#10b981" />
              <View>
                <Text className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Storage Mode
                </Text>
                <Text className="text-xs text-slate-400">
                  {isSupabaseConfigured ? "Connected to Supabase" : "Self-Contained Local Mode"}
                </Text>
              </View>
            </View>
            <Badge
              label={isSupabaseConfigured ? "Cloud Active" : "Local Fast Mode"}
              variant={isSupabaseConfigured ? "success" : "info"}
              size="sm"
            />
          </View>

          <View className="flex-row items-center justify-between pt-3">
            <View className="flex-row items-center gap-3">
              <Shield size={18} color="#64748b" />
              <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Primary Currency
              </Text>
            </View>
            <Text className="text-xs font-bold text-slate-900 dark:text-slate-100">INR (₹)</Text>
          </View>
        </Card>

        {/* Independent Data Portability */}
        <Card className="mb-4">
          <Caption className="mb-3">DATA BACKUP & PRIVACY</Caption>
          <TouchableOpacity
            onPress={handleExportData}
            className="flex-row items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800"
          >
            <View className="flex-row items-center gap-3">
              <Download size={18} color="#2563eb" />
              <View>
                <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Export Complete Backup
                </Text>
                <Text className="text-xs text-slate-400">
                  Export JSON file with all accounts & ledger history
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <View className="flex-row items-center justify-between py-2.5">
            <View className="flex-row items-center gap-3">
              <CheckCircle size={18} color="#10b981" />
              <View>
                <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  100% Privacy Guarantee
                </Text>
                <Text className="text-xs text-slate-400">
                  No banking credentials or telemetry collected
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* App Info */}
        <Card className="mb-5">
          <Caption className="mb-2">ABOUT APPLICATION</Caption>
          <View className="flex-row justify-between py-1">
            <Text className="text-xs text-slate-500">App Name</Text>
            <Text className="text-xs font-semibold text-slate-800 dark:text-slate-200">Finn</Text>
          </View>
          <View className="flex-row justify-between py-1">
            <Text className="text-xs text-slate-500">Version</Text>
            <Text className="text-xs font-semibold text-slate-800 dark:text-slate-200">1.0.0 (Production Core)</Text>
          </View>
          <View className="flex-row justify-between py-1">
            <Text className="text-xs text-slate-500">Architecture</Text>
            <Text className="text-xs font-semibold text-slate-800 dark:text-slate-200">Modular Feature-Based</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
