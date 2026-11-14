import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Heading, Body, Caption } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { Mail, ArrowLeft } from "lucide-react-native";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center gap-2 mb-6"
        >
          <ArrowLeft size={20} color="#64748b" />
          <Text className="text-sm text-slate-600 font-medium">Back</Text>
        </TouchableOpacity>

        <View className="mb-8">
          <Caption>PASSWORD RECOVERY</Caption>
          <Heading className="text-3xl mt-1">Reset Password</Heading>
          <Body className="text-slate-500 mt-2">
            Enter your email and we will send you a password reset link.
          </Body>
        </View>

        <Card className="mb-6">
          <Input
            label="Email Address"
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            leftElement={<Mail size={18} color="#94a3b8" />}
          />

          <Button
            title="Send Reset Link"
            variant="primary"
            isLoading={isLoading}
            onPress={() => setSent(true)}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

