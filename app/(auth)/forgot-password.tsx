import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Input } from "@/components/ui/input";
import { Caption } from "@/components/ui/typography";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react-native";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-[#F7F7F5] dark:bg-[#0E0E10]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center gap-2 mb-6"
        >
          <View className="w-8 h-8 rounded-full bg-white border border-[#EAEAE5] items-center justify-center">
            <ArrowLeft size={16} color="#121214" />
          </View>
          <Text className="text-sm text-[#121214] font-bold">Back</Text>
        </TouchableOpacity>

        <View className="mb-8">
          <Caption>PASSWORD RECOVERY</Caption>
          <Text className="text-3xl font-black text-[#121214] mt-1">
            Reset Password
          </Text>
          <Text className="text-sm font-bold text-[#71717A] mt-2">
            Enter your email and we will send you a password reset link.
          </Text>
        </View>

        <View className="bg-white rounded-[28px] p-6 mb-6 border border-[#EAEAE5] shadow-sm">
          {sent ? (
            <View className="items-center py-4">
              <View className="w-12 h-12 rounded-full bg-[#E6FBF2] items-center justify-center mb-3">
                <CheckCircle2 size={24} color="#10B981" />
              </View>
              <Text className="text-base font-black text-[#121214] text-center">
                Reset Link Sent!
              </Text>
              <Text className="text-xs text-[#71717A] text-center mt-1 mb-4">
                Check your inbox at {email} for instructions to reset your password.
              </Text>
              <TouchableOpacity
                onPress={() => router.replace("/(auth)/login")}
                style={{
                  backgroundColor: "#121214",
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 9999,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "900", color: "#FFFFFF" }}>
                  Return to Login
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Input
                label="Email Address"
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                leftElement={<Mail size={18} color="#71717A" />}
              />

              <TouchableOpacity
                onPress={() => setSent(true)}
                style={{
                  backgroundColor: "#121214",
                  paddingVertical: 14,
                  borderRadius: 9999,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 4,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "900", color: "#FFFFFF" }}>
                  Send Reset Link
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
