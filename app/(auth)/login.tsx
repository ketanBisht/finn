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
import { Lock, Mail, ArrowRight } from "lucide-react-native";
import { WageLogo } from "@/components/ui/wage-logo";
import { loginAccount } from "@/lib/local-auth";
import { useAuthStore } from "@/store/useAuthStore";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const setProfile = useAuthStore((s) => s.setProfile);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert("Email Required", "Please enter your email address.");
      return;
    }
    if (!password) {
      Alert.alert("Password Required", "Please enter your password.");
      return;
    }

    setIsLoading(true);
    const result = await loginAccount(email, password);
    setIsLoading(false);

    if (!result.success) {
      Alert.alert("Sign In Failed", result.error || "Unable to sign in.");
      return;
    }

    if (result.user) {
      setProfile(result.user);
    }

    // Success -> proceed to app
    router.replace("/(tabs)");
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
            Welcome back
          </Text>
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#71717A", marginTop: 4, textAlign: "center" }}>
            Sign in to access your ledger, budgets & accounts
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
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            leftElement={<Lock size={16} color="#71717A" />}
          />

          <TouchableOpacity
            onPress={() => router.push("/(auth)/forgot-password")}
            style={{ alignSelf: "flex-end", marginBottom: 16 }}
          >
            <Text style={{ fontSize: 11, color: "#121214", fontWeight: "700" }}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            style={{
              backgroundColor: "#121214",
              paddingVertical: 14,
              borderRadius: 9999,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={{ fontSize: 14, fontWeight: "900", color: "#FFFFFF" }}>
                  Sign In
                </Text>
                <ArrowRight size={15} color="#FFFFFF" strokeWidth={2.4} />
              </>
            )}
          </TouchableOpacity>

          {/* Quick Offline Guest Entry */}
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            style={{ marginTop: 14, alignItems: "center" }}
          >
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#A1A1AA" }}>
              Continue as Local Guest →
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#71717A" }}>
            Don't have an account?
          </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text style={{ fontSize: 13, fontWeight: "900", color: "#D97706" }}>
              Register
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
