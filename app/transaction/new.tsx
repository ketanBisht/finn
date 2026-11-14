import React, { useState } from "react";
import { View, ScrollView, Text } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Heading, Body } from "@/components/ui/typography";
import { TransactionType } from "@/types";

export default function NewTransactionScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const [type, setType] = useState<TransactionType>(
    params.type === "income" ? "income" : "expense"
  );
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type toggle */}
        <View className="flex-row p-1 bg-slate-200 dark:bg-slate-800 rounded-2xl mb-6">
          <Button
            title="Expense"
            variant={type === "expense" ? "danger" : "ghost"}
            size="sm"
            className="flex-1"
            onPress={() => setType("expense")}
          />
          <Button
            title="Income"
            variant={type === "income" ? "primary" : "ghost"}
            size="sm"
            className="flex-1"
            onPress={() => setType("income")}
          />
        </View>

        <Card className="mb-6">
          <Input
            label="Amount (₹)"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <Input
            label="Description"
            placeholder="e.g. Grocery shopping, Salary"
            value={description}
            onChangeText={setDescription}
          />
        </Card>

        <Button
          title="Save Transaction"
          variant="primary"
          onPress={() => router.back()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

