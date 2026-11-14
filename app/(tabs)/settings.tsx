import React from "react";
import { View, ScrollView, Text, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Heading, Caption, Body } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Shield, Moon, Database, LogOut } from "lucide-react-native";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 }}
      >
        <View className="mb-5">
          <Caption>PREFERENCES</Caption>
          <Heading className="text-xl">Settings</Heading>
        </View>

        <Card className="mb-4">
          <View className="flex-row items-center justify-between py-2 border-b border-slate-100">
            <View className="flex-row items-center gap-3">
              <Database size={18} color="#64748b" />
              <Body className="text-sm font-medium">Supabase Backend</Body>
            </View>
            <Text className="text-xs font-semibold text-emerald-600">
              {isSupabaseConfigured ? "Connected" : "Pending Config"}
            </Text>
          </View>

          <View className="flex-row items-center justify-between py-3 border-b border-slate-100">
            <View className="flex-row items-center gap-3">
              <Shield size={18} color="#64748b" />
              <Body className="text-sm font-medium">Default Currency</Body>
            </View>
            <Text className="text-xs font-semibold text-slate-800">INR (₹)</Text>
          </View>
        </Card>

        <Card className="mb-4">
          <Body className="text-xs text-slate-500 mb-2">Application Info</Body>
          <Text className="text-xs text-slate-700 font-medium">Version: 1.0.0 (Phase 1 Foundation)</Text>
          <Text className="text-xs text-slate-700 font-medium mt-1">Expo SDK: 58.0.25</Text>
          <Text className="text-xs text-slate-700 font-medium mt-1">Styling: NativeWind v4 (Tailwind CSS)</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

