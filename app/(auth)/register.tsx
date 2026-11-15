import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Input } from "@/components/ui/input";
import { Lock, Mail, User, ArrowRight } from "lucide-react-native";
import { WageLogo } from "@/components/ui/wage-logo";
import { registerAccount } from "@/lib/local-auth";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert("Name Required", "Please enter your full name.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert("Valid Email Required", "Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert("Password Too Short", "Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    const result = await registerAccount(name, email, password);
    setIsLoading(false);

    if (!result.success) {
      Alert.alert("Registration Failed", result.error || "Unable to create account.");
      return;
    }

    Alert.alert("Account Created", "Your Wage account is ready!", [
      { text: "Continue", onPress: () => router.replace("/(tabs)") },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F7F5" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: 28, alignItems: "center" }}>
          <WageLogo size={80} style={{ marginBottom: 14 }} />
          <Text style={{ fontSize: 26, fontWeight: "900", color: "#121214" }}>
            Create Account
          </Text>
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#71717A", marginTop: 4, textAlign: "center" }}>
            Take control of your personal finances with Wage
          </Text>
        </View>

        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 28,
            padding: 22,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: "#EAEAE5",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}
        >
          <Input
            label="Full Name"
            placeholder="Ketan Bisht"
            value={name}
            onChangeText={setName}
            leftElement={<User size={16} color="#71717A" />}
          />

          <Input
            label="Email Address"
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            leftElement={<Mail size={16} color="#71717A" />}
          />

          <Input
            label="Password"
            placeholder="Minimum 6 characters"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            leftElement={<Lock size={16} color="#71717A" />}
          />

          <TouchableOpacity
            onPress={handleRegister}
            disabled={isLoading}
            style={{
              backgroundColor: "#121214",
              paddingVertical: 14,
              borderRadius: 9999,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              marginTop: 6,
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={{ fontSize: 14, fontWeight: "900", color: "#FFFFFF" }}>
                  Create Account
                </Text>
                <ArrowRight size={15} color="#FFFFFF" strokeWidth={2.4} />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#71717A" }}>
            Already have an account?
          </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text style={{ fontSize: 13, fontWeight: "900", color: "#D97706" }}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
