import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
  Modal,
  TextInput,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ArrowLeft,
  User,
  Shield,
  Download,
  Trash2,
  CheckCircle,
  Database,
  HandCoins,
  Store,
  ChevronRight,
  Edit3,
  X,
  Sparkles,
  PieChart,
  Wallet,
  Receipt,
  Bell,
  Lock,
  LogOut,
} from "lucide-react-native";
import { logoutAccount } from "@/lib/local-auth";
import { Caption } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useFinanceStore } from "@/store/useFinanceStore";
import { WageLogo } from "@/components/ui/wage-logo";
import { WageLoadingScreen } from "@/components/ui/wage-loading-screen";
import { formatCurrencyFromPaise } from "@/lib/utils";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [showLoadingPreview, setShowLoadingPreview] = useState(false);

  // Profile Edit State
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [userName, setUserName] = useState("Ketan Bisht");
  const [userEmail, setUserEmail] = useState("ketan@wage.app");
  const [tempName, setTempName] = useState(userName);
  const [tempEmail, setTempEmail] = useState(userEmail);

  // Preference Toggles
  const [dailyReminders, setDailyReminders] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Store data
  const accounts = useFinanceStore((s) => s.accounts);
  const transactions = useFinanceStore((s) => s.transactions);
  const budgets = useFinanceStore((s) => s.budgets);
  const debts = useFinanceStore((s) => s.debts);
  const customPlatforms = useFinanceStore((s) => s.customPlatforms);
  const deletePlatform = useFinanceStore((s) => s.deletePlatform);

  // Custom Platforms Modal
  const [platformsModalVisible, setPlatformsModalVisible] = useState(false);

  const totalPaise = accounts.reduce(
    (sum, a) => sum + (a.is_active ? a.current_balance_paise : 0),
    0
  );

  const handleSaveProfile = () => {
    if (!tempName.trim()) {
      Alert.alert("Name Required", "Please enter your name.");
      return;
    }
    setUserName(tempName.trim());
    setUserEmail(tempEmail.trim());
    setProfileModalVisible(false);
  };

  const handleExportData = async () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      appName: "Wage",
      version: "1.0.0",
      user: { name: userName, email: userEmail },
      stats: {
        accountsCount: accounts.length,
        transactionsCount: transactions.length,
        budgetsCount: budgets.length,
        debtsCount: debts.length,
      },
      accounts,
      transactions,
      budgets,
      debts,
      customPlatforms,
    };

    try {
      await Share.share({
        title: "Wage Finance Export",
        message: JSON.stringify(backupData, null, 2),
      });
    } catch (e: any) {
      Alert.alert("Export Error", e?.message || "Failed to export data");
    }
  };

  const handleClearData = () => {
    Alert.alert(
      "Reset App Database",
      "Are you sure you want to clear your local ledger? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset All",
          style: "destructive",
          onPress: () => {
            Alert.alert("Notice", "To reset completely, reinstall or clear app storage.");
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F7F7F5" }}>
      {/* Header */}
      <View
        style={{
          paddingTop: Math.max(insets.top, Platform.OS === "android" ? 44 : 20),
          paddingHorizontal: 20,
          paddingBottom: 10,
          backgroundColor: "#F7F7F5",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#EAEAE5",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft size={18} color="#121214" />
          </TouchableOpacity>
          <View>
            <Caption>PREFERENCES & PROFILE</Caption>
            <Text style={{ fontSize: 20, fontWeight: "900", color: "#121214" }}>
              Profile & Settings
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setShowLoadingPreview(true)}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#EAEAE5",
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "800", color: "#71717A" }}>
            Brand Logo
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Profile Hero Card */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            padding: 18,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#EAEAE5",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 3,
            elevation: 1,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: "#FFC83B",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: "#E8BC52",
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "900", color: "#121214" }}>
                  {userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </Text>
              </View>

              <View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 16, fontWeight: "900", color: "#121214" }}>
                    {userName}
                  </Text>
                  <View
                    style={{
                      backgroundColor: "#FFF4D2",
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 999,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: "800", color: "#B45309" }}>
                      PRO
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: "#71717A", marginTop: 2 }}>
                  {userEmail}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                setTempName(userName);
                setTempEmail(userEmail);
                setProfileModalVisible(true);
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#F7F7F5",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#EAEAE5",
              }}
            >
              <Edit3 size={15} color="#121214" />
            </TouchableOpacity>
          </View>

          {/* Snapshot pills */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 16,
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: "#F0EFEA",
            }}
          >
            <View>
              <Text style={{ fontSize: 10, fontWeight: "800", color: "#71717A", textTransform: "uppercase" }}>
                Total Accounts
              </Text>
              <Text style={{ fontSize: 14, fontWeight: "900", color: "#121214", marginTop: 2 }}>
                {accounts.length}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 10, fontWeight: "800", color: "#71717A", textTransform: "uppercase" }}>
                Ledger Entries
              </Text>
              <Text style={{ fontSize: 14, fontWeight: "900", color: "#121214", marginTop: 2 }}>
                {transactions.length}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 10, fontWeight: "800", color: "#71717A", textTransform: "uppercase" }}>
                Net Liquidity
              </Text>
              <Text style={{ fontSize: 14, fontWeight: "900", color: "#059669", marginTop: 2 }}>
                {formatCurrencyFromPaise(totalPaise)}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Direct Feature Links */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#EAEAE5",
          }}
        >
          <Caption style={{ marginBottom: 10 }}>QUICK MODULES</Caption>

          {/* Debts / Loans Shortcut */}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/debts")}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#F0EFEA",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 14,
                  backgroundColor: "#FFF4D2",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <HandCoins size={18} color="#B45309" />
              </View>
              <View>
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#121214" }}>
                  Debts & Udhar
                </Text>
                <Text style={{ fontSize: 11, color: "#71717A", marginTop: 1 }}>
                  {debts.length} active records (Lent & Borrowed)
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color="#A1A1AA" />
          </TouchableOpacity>

          {/* Custom Platforms Shortcut */}
          <TouchableOpacity
            onPress={() => setPlatformsModalVisible(true)}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#F0EFEA",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 14,
                  backgroundColor: "#EBF4FF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Store size={18} color="#2563EB" />
              </View>
              <View>
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#121214" }}>
                  Online Platforms & Merchants
                </Text>
                <Text style={{ fontSize: 11, color: "#71717A", marginTop: 1 }}>
                  {customPlatforms.length} custom tags added
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color="#A1A1AA" />
          </TouchableOpacity>

          {/* Spend Intelligence */}
          <TouchableOpacity
            onPress={() => router.push("/analytics")}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 14,
                  backgroundColor: "#E6FBF2",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={18} color="#059669" />
              </View>
              <View>
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#121214" }}>
                  Spend Intelligence & Analytics
                </Text>
                <Text style={{ fontSize: 11, color: "#71717A", marginTop: 1 }}>
                  Platform breakdowns & ticket size
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color="#A1A1AA" />
          </TouchableOpacity>
        </View>

        {/* 3. App Preferences & Security */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#EAEAE5",
          }}
        >
          <Caption style={{ marginBottom: 10 }}>PREFERENCES & SECURITY</Caption>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#F0EFEA",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: "#F7F7F5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bell size={16} color="#121214" />
              </View>
              <View>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#121214" }}>
                  Daily Spending Check-in
                </Text>
                <Text style={{ fontSize: 11, color: "#71717A" }}>
                  Nightly reminder to log cash and UPI
                </Text>
              </View>
            </View>
            <Switch
              value={dailyReminders}
              onValueChange={setDailyReminders}
              trackColor={{ false: "#EAEAE5", true: "#FFC83B" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: "#F7F7F5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Lock size={16} color="#121214" />
              </View>
              <View>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#121214" }}>
                  Biometric App Lock
                </Text>
                <Text style={{ fontSize: 11, color: "#71717A" }}>
                  Require fingerprint or face on launch
                </Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: "#EAEAE5", true: "#FFC83B" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* 4. Database & Storage Status */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#EAEAE5",
          }}
        >
          <Caption style={{ marginBottom: 10 }}>STORAGE & DATABASE</Caption>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: "#F0EFEA",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Database size={16} color="#B45309" />
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#121214" }}>
                Active Database Engine
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "#E6FBF2",
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 999,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#059669" }}>
                SQLite WAL (Offline)
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: "#F0EFEA",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Shield size={16} color="#121214" />
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#121214" }}>
                Cloud Backup Link
              </Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#71717A" }}>
              {isSupabaseConfigured ? "Connected" : "Local Standalone"}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleExportData}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Download size={16} color="#121214" />
              <View>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#121214" }}>
                  Export JSON Backup
                </Text>
                <Text style={{ fontSize: 11, color: "#71717A" }}>
                  Share or save complete snapshot
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color="#A1A1AA" />
          </TouchableOpacity>
        </View>

        {/* 5. App Info & Logo */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: "#EAEAE5",
            alignItems: "center",
          }}
        >
          <WageLogo size={56} />
          <Text style={{ fontSize: 14, fontWeight: "900", color: "#121214", marginTop: 8 }}>
            Wage Intelligence
          </Text>
          <Text style={{ fontSize: 11, color: "#71717A", marginTop: 2 }}>
            Version 1.0.0 · Local-First Architecture
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
            <CheckCircle size={13} color="#10B981" />
            <Text style={{ fontSize: 11, color: "#059669", fontWeight: "700" }}>
              Zero telemetry · 100% On-Device Privacy
            </Text>
          </View>
        </View>

        {/* 6. Sign Out Button */}
        <TouchableOpacity
          onPress={() => {
            Alert.alert("Log Out", "Are you sure you want to sign out?", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Log Out",
                style: "destructive",
                onPress: async () => {
                  await logoutAccount();
                  router.replace("/(auth)/login");
                },
              },
            ]);
          }}
          activeOpacity={0.8}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 22,
            padding: 16,
            marginBottom: 24,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            borderWidth: 1,
            borderColor: "#FEECEB",
          }}
        >
          <LogOut size={16} color="#EF4444" />
          <Text style={{ fontSize: 13, fontWeight: "800", color: "#EF4444" }}>
            Sign Out of Wage
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={profileModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setProfileModalVisible(false)}
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
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#121214" }}>
                Edit Profile
              </Text>
              <TouchableOpacity
                onPress={() => setProfileModalVisible(false)}
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

            <Text style={{ fontSize: 11, fontWeight: "800", color: "#71717A", textTransform: "uppercase", marginBottom: 6 }}>
              Full Name
            </Text>
            <TextInput
              value={tempName}
              onChangeText={setTempName}
              placeholder="Your name"
              placeholderTextColor="#A1A1AA"
              style={{
                backgroundColor: "#F7F7F5",
                borderRadius: 16,
                padding: 14,
                fontSize: 15,
                fontWeight: "700",
                color: "#121214",
                borderWidth: 1,
                borderColor: "#EAEAE5",
                marginBottom: 16,
              }}
            />

            <Text style={{ fontSize: 11, fontWeight: "800", color: "#71717A", textTransform: "uppercase", marginBottom: 6 }}>
              Email Address
            </Text>
            <TextInput
              value={tempEmail}
              onChangeText={setTempEmail}
              placeholder="name@domain.com"
              placeholderTextColor="#A1A1AA"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                backgroundColor: "#F7F7F5",
                borderRadius: 16,
                padding: 14,
                fontSize: 15,
                fontWeight: "700",
                color: "#121214",
                borderWidth: 1,
                borderColor: "#EAEAE5",
                marginBottom: 24,
              }}
            />

            <TouchableOpacity
              onPress={handleSaveProfile}
              style={{
                backgroundColor: "#121214",
                paddingVertical: 14,
                borderRadius: 999,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
                Save Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Platforms Modal */}
      <Modal
        visible={platformsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPlatformsModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              padding: 24,
              paddingBottom: 36,
              maxHeight: "80%",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: "900", color: "#121214" }}>
                  Saved Platforms & Merchants
                </Text>
                <Caption>Platforms available when logging transactions</Caption>
              </View>
              <TouchableOpacity
                onPress={() => setPlatformsModalVisible(false)}
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

            <ScrollView style={{ marginBottom: 16 }}>
              {customPlatforms.length === 0 ? (
                <Text style={{ fontSize: 13, color: "#A1A1AA", textAlign: "center", paddingVertical: 20 }}>
                  No custom platforms yet. Add them directly while creating an expense!
                </Text>
              ) : (
                customPlatforms.map((platform) => (
                  <View
                    key={platform}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: "#F0EFEA",
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#121214" }}>
                      {platform}
                    </Text>
                    <TouchableOpacity
                      onPress={() => deletePlatform(platform)}
                      style={{ padding: 6 }}
                    >
                      <Trash2 size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setPlatformsModalVisible(false)}
              style={{
                backgroundColor: "#121214",
                paddingVertical: 14,
                borderRadius: 999,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Preview Loading Screen Modal */}
      {showLoadingPreview && (
        <WageLoadingScreen
          minDurationMs={2000}
          onFinish={() => setShowLoadingPreview(false)}
        />
      )}
    </View>
  );
}
