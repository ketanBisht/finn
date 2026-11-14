import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Heading, Body, Caption } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { Lock, Mail, User } from "lucide-react-native";

export default function RegisterScreen() {
  const [name, setName] = useState("");
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
          <Caption>GET STARTED</Caption>
          <Heading className="text-3xl mt-1">Create Account</Heading>
          <Body className="text-slate-500 mt-2">Take control of your personal finances</Body>
        </View>

        <Card className="mb-6">
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={name}
            onChangeText={setName}
            leftElement={<User size={18} color="#94a3b8" />}
          />
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
            placeholder="Minimum 8 characters"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            leftElement={<Lock size={18} color="#94a3b8" />}
          />

          <Button
            title="Create Account"
            variant="primary"
            isLoading={isLoading}
            onPress={() => router.replace("/(tabs)")}
          />
        </Card>

        <View className="flex-row justify-center items-center gap-1">
          <Body className="text-sm">Already have an account?</Body>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text className="text-sm font-bold text-emerald-600">Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

