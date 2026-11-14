import React from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Heading, Caption, Body } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { ArrowLeftRight } from "lucide-react-native";

export default function TransactionsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 }}
      >
        <View className="mb-5">
          <Caption>ALL TRANSACTIONS</Caption>
          <Heading className="text-xl">Transaction History</Heading>
        </View>

        <Card className="items-center py-12">
          <View className="w-14 h-14 rounded-full bg-slate-100 items-center justify-center mb-4">
            <ArrowLeftRight size={24} color="#64748b" />
          </View>
          <Heading className="text-base text-slate-800">Ready for Phase 4</Heading>
          <Body className="text-center text-xs text-slate-500 mt-1 max-w-[240px]">
            Transaction list, category filtering, search, and date filters will connect here.
          </Body>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

