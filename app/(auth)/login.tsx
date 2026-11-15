import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Input } from "@/components/ui/input";
import { Lock, Mail, ArrowRight, Upload, X } from "lucide-react-native";
import { WageLogo } from "@/components/ui/wage-logo";
import { loginAccount, updateStoredProfile } from "@/lib/local-auth";
import { useAuthStore } from "@/store/useAuthStore";
import { useFinanceStore } from "@/store/useFinanceStore";
import { pickAndDecryptBackup } from "@/lib/backup";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const setProfile = useAuthStore((s) => s.setProfile);
  const restoreFromBackup = useFinanceStore((s) => s.restoreFromBackup);

  // Restore State
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [restorePassword, setRestorePassword] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestoreFromLogin = async () => {
    if (!restorePassword.trim()) {
      Alert.alert("Passphrase Required", "Please enter your backup passphrase.");
      return;
    }
    try {
      setIsRestoring(true);
      const result = await pickAndDecryptBackup(restorePassword);
      if (!result) {
        setIsRestoring(false);
        return;
      }

      await restoreFromBackup(result.state);

      // If user metadata is in the backup, hydrate profile
      const rawMeta = (result.state as any).userMeta;
      const userName = rawMeta?.name || "User";
      const userEmail = rawMeta?.email || email.trim() || "user@wage.app";

      await updateStoredProfile(userName, userEmail);
      setProfile({ name: userName, email: userEmail });

      setRestoreModalVisible(false);
      setRestorePassword("");
      Alert.alert(
        "Welcome Back!",
        `Restored ${result.state.transactions?.length || 0} transactions and ${result.state.accounts?.length || 0} accounts.`,
        [
          {
            text: "Open Wage",
            onPress: () => router.replace("/(tabs)"),
          },
        ]
      );
    } catch (e: any) {
      Alert.alert(
        "Restore Failed",
        e?.message || "Could not decrypt backup. Please check your passphrase."
      );
    } finally {
      setIsRestoring(false);
    }
  };

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

        {/* Zero-Knowledge Restore for Phone Loss / New Device */}
        <TouchableOpacity
          onPress={() => {
            setRestorePassword("");
            setRestoreModalVisible(true);
          }}
          style={{
            marginTop: 24,
            alignItems: "center",
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 16,
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#EAEAE5",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Upload size={14} color="#B45309" />
          <Text style={{ fontSize: 12, fontWeight: "800", color: "#121214" }}>
            Switching devices? Restore from Backup
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Restore from Backup Modal ── */}
      <Modal
        visible={restoreModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!isRestoring) setRestoreModalVisible(false);
        }}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              padding: 24,
              paddingBottom: 36,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: "900", color: "#121214" }}>
                  Restore from Backup
                </Text>
                <Text style={{ fontSize: 11, color: "#71717A", marginTop: 2 }}>
                  Zero-Knowledge Decryption (.wage.json)
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setRestoreModalVisible(false)}
                disabled={isRestoring}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#F7F7F5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={16} color="#121214" />
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: "#F7F7F5", borderRadius: 16, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#EAEAE5" }}>
              <Text style={{ fontSize: 12, color: "#71717A", lineHeight: 18 }}>
                🔐 Pick your encrypted backup file from Google Drive, iCloud, or Files, then enter the passphrase you created it with.
              </Text>
            </View>

            <Text style={{ fontSize: 11, fontWeight: "800", color: "#71717A", textTransform: "uppercase", marginBottom: 6 }}>
              Backup Passphrase *
            </Text>
            <TextInput
              value={restorePassword}
              onChangeText={setRestorePassword}
              placeholder="Enter your backup passphrase"
              placeholderTextColor="#A1A1AA"
              secureTextEntry
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                padding: 14,
                fontSize: 15,
                fontWeight: "700",
                color: "#121214",
                borderWidth: 1,
                borderColor: "#EAEAE5",
                marginBottom: 20,
              }}
            />

            <TouchableOpacity
              onPress={handleRestoreFromLogin}
              disabled={isRestoring}
              style={{
                backgroundColor: "#B45309",
                paddingVertical: 14,
                borderRadius: 999,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
                {isRestoring ? "Decrypting & Restoring..." : "Choose File & Restore"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
