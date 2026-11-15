import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Input } from "@/components/ui/input";
import { Caption } from "@/components/ui/typography";
import { Lock, Mail } from "lucide-react-native";
import { WageLogo } from "@/components/ui/wage-logo";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-[#F7F7F5] dark:bg-[#0E0E10]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-8 items-center">
          <WageLogo size={90} style={{ marginBottom: 16 }} />
          <Text className="text-3xl font-black text-[#121214] dark:text-[#F4F4F5]">
            Welcome back
          </Text>
          <Text className="text-sm font-bold text-[#71717A] mt-1 text-center">
            Sign in to track your wealth, cash & budgets
          </Text>
        </View>

        <View className="bg-white rounded-[28px] p-6 mb-6 border border-[#EAEAE5] shadow-sm">
          <Input
            label="Email Address"
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            leftElement={<Mail size={18} color="#71717A" />}
          />
          <Input
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            leftElement={<Lock size={18} color="#71717A" />}
          />

          <TouchableOpacity
            onPress={() => router.push("/(auth)/forgot-password")}
            className="self-end mb-4"
          >
            <Text className="text-xs text-[#121214] dark:text-[#FFC83B] font-bold">
              Forgot password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            style={{
              backgroundColor: "#121214",
              paddingVertical: 14,
              borderRadius: 9999,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "900", color: "#FFFFFF" }}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center items-center gap-1.5">
          <Text className="text-sm font-semibold text-[#71717A]">Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text className="text-sm font-black text-[#121214] dark:text-[#FFC83B]">
              Register
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
