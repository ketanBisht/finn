import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Heading, Body, Caption } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { Lock, Mail } from "lucide-react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-8">
          <Caption>FINN PERSONAL FINANCE</Caption>
          <Heading className="text-3xl mt-1">Welcome back</Heading>
          <Body className="text-slate-500 mt-2">Sign in to manage your finances</Body>
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
          <Input
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            leftElement={<Lock size={18} color="#94a3b8" />}
          />

          <TouchableOpacity
            onPress={() => router.push("/(auth)/forgot-password")}
            className="self-end mb-4"
          >
            <Text className="text-xs text-emerald-600 font-semibold">Forgot password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            variant="primary"
            isLoading={isLoading}
            onPress={() => router.replace("/(tabs)")}
          />
        </Card>

        <View className="flex-row justify-center items-center gap-1">
          <Body className="text-sm">Don't have an account?</Body>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text className="text-sm font-bold text-emerald-600">Register</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

