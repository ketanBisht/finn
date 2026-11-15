import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Input } from "@/components/ui/input";
import { Caption } from "@/components/ui/typography";
import { Lock, Mail, User } from "lucide-react-native";
import { WageLogo } from "@/components/ui/wage-logo";

export default function RegisterScreen() {
  const [name, setName] = useState("");
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
          <Text className="text-3xl font-black text-[#121214]">
            Create Account
          </Text>
          <Text className="text-sm font-bold text-[#71717A] mt-1 text-center">
            Take control of your personal finances with Wage
          </Text>
        </View>

        <View className="bg-white rounded-[28px] p-6 mb-6 border border-[#EAEAE5] shadow-sm">
          <Input
            label="Full Name"
            placeholder="Ketan Bisht"
            value={name}
            onChangeText={setName}
            leftElement={<User size={18} color="#71717A" />}
          />
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
            placeholder="Minimum 8 characters"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            leftElement={<Lock size={18} color="#71717A" />}
          />

          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            style={{
              backgroundColor: "#121214",
              paddingVertical: 14,
              borderRadius: 9999,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 6,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "900", color: "#FFFFFF" }}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center items-center gap-1.5">
          <Text className="text-sm font-semibold text-[#71717A]">Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text className="text-sm font-black text-[#121214] dark:text-[#FFC83B]">
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
