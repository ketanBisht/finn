import React, { useState, useEffect } from "react";
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
  Repeat,
  Upload,
  KeyRound,
} from "lucide-react-native";
import { logoutAccount, updateStoredProfile } from "@/lib/local-auth";
import { useAuthStore } from "@/store/useAuthStore";
import { Caption } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useFinanceStore } from "@/store/useFinanceStore";
import { formatCurrencyFromPaise } from "@/lib/utils";
import { exportAndShareEncryptedBackup, pickAndDecryptBackup } from "@/lib/backup";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const authProfile = useAuthStore((s) => s.profile);
  const setAuthProfile = useAuthStore((s) => s.setProfile);

  // Profile State synced with signup/login
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [userName, setUserName] = useState(authProfile?.name || "User");
  const [userEmail, setUserEmail] = useState(authProfile?.email || "user@wage.app");
  const [tempName, setTempName] = useState(userName);
  const [tempEmail, setTempEmail] = useState(userEmail);

  useEffect(() => {
    if (authProfile) {
      setUserName(authProfile.name);
      setUserEmail(authProfile.email);
      setTempName(authProfile.name);
      setTempEmail(authProfile.email);
    }
  }, [authProfile]);

  // Preference Toggles
  const [dailyReminders, setDailyReminders] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Store data
  const accounts = useFinanceStore((s) => s.accounts);
  const transactions = useFinanceStore((s) => s.transactions);
  const budgets = useFinanceStore((s) => s.budgets);
  const debts = useFinanceStore((s) => s.debts);
  const subscriptions = useFinanceStore((s) => s.subscriptions);
  const customPlatforms = useFinanceStore((s) => s.customPlatforms);
  const deletePlatform = useFinanceStore((s) => s.deletePlatform);
  const categories = useFinanceStore((s) => s.categories);
  const overallMonthlyBudgets = useFinanceStore((s) => s.overallMonthlyBudgets);
  const restoreFromBackup = useFinanceStore((s) => s.restoreFromBackup);

  // Zero-Knowledge Backup / Restore State
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [backupPassword, setBackupPassword] = useState("");
  const [restorePassword, setRestorePassword] = useState("");
  const [isProcessingBackup, setIsProcessingBackup] = useState(false);

  // Custom Platforms Modal
  const [platformsModalVisible, setPlatformsModalVisible] = useState(false);

  const totalPaise = accounts.reduce(
    (sum, a) => sum + (a.is_active ? a.current_balance_paise : 0),
    0
  );

  const handleSaveProfile = async () => {
    if (!tempName.trim()) {
      Alert.alert("Name Required", "Please enter your name.");
      return;
    }
    const cleanName = tempName.trim();
    const cleanEmail = tempEmail.trim() || userEmail;

    setUserName(cleanName);
    setUserEmail(cleanEmail);
    setAuthProfile({ name: cleanName, email: cleanEmail });
    await updateStoredProfile(cleanName, cleanEmail);
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
        subscriptionsCount: subscriptions.length,
      },
      accounts,
      transactions,
      budgets,
      debts,
      subscriptions,
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

  const handleCreateEncryptedBackup = async () => {
    if (backupPassword.trim().length < 4) {
      Alert.alert(
        "Passphrase Required",
        "Please enter a passphrase of at least 4 characters to encrypt your backup."
      );
      return;
    }
    try {
      setIsProcessingBackup(true);
      await exportAndShareEncryptedBackup(
        {
          accounts,
          categories,
          transactions,
          budgets,
          overallMonthlyBudgets,
          customPlatforms,
          debts,
          subscriptions,
        },
        backupPassword,
        { name: userName, email: userEmail }
      );
      setBackupModalVisible(false);
      setBackupPassword("");
    } catch (e: any) {
      Alert.alert("Backup Failed", e?.message || "Failed to create encrypted backup.");
    } finally {
      setIsProcessingBackup(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!restorePassword.trim()) {
      Alert.alert(
        "Passphrase Required",
        "Please enter the passphrase used when creating this backup."
      );
      return;
    }
    try {
      setIsProcessingBackup(true);
      const result = await pickAndDecryptBackup(restorePassword);
      if (!result) {
        setIsProcessingBackup(false);
        return;
      }

      await restoreFromBackup(result.state);
      setRestoreModalVisible(false);
      setRestorePassword("");

      Alert.alert(
        "Backup Restored Successfully!",
        `Restored from "${result.fileName}":\n• ${result.state.transactions?.length || 0} transactions\n• ${result.state.accounts?.length || 0} accounts\n• ${result.state.debts?.length || 0} debts\n• ${result.state.subscriptions?.length || 0} subscriptions`,
        [{ text: "OK" }]
      );
    } catch (e: any) {
      Alert.alert(
        "Restore Failed",
        e?.message || "Could not decrypt backup. Verify your passphrase."
      );
    } finally {
      setIsProcessingBackup(false);
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
            <Caption>ACCOUNT & PREFERENCES</Caption>
            <Text style={{ fontSize: 20, fontWeight: "900", color: "#121214" }}>
              Profile & Settings
            </Text>
          </View>
        </View>
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

          {/* Subscriptions & Bills Shortcut */}
          <TouchableOpacity
            onPress={() => router.push("/subscriptions")}
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
                  backgroundColor: "#EEF2FF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Repeat size={18} color="#4F46E5" />
              </View>
              <View>
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#121214" }}>
                  Subscriptions & Bills
                </Text>
                <Text style={{ fontSize: 11, color: "#71717A", marginTop: 1 }}>
                  {subscriptions.length} recurring commitments
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
                Zero-Knowledge Privacy
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "#FEF3C7",
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "800", color: "#B45309" }}>
                Client-Side AES-256
              </Text>
            </View>
          </View>

          {/* 1. Create Encrypted Backup */}
          <TouchableOpacity
            onPress={() => {
              setBackupPassword("");
              setBackupModalVisible(true);
            }}
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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: "#E6FBF2",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Lock size={15} color="#059669" />
              </View>
              <View>
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#121214" }}>
                  Create Encrypted Backup
                </Text>
                <Text style={{ fontSize: 11, color: "#71717A" }}>
                  Save to Google Drive, iCloud, or Files
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color="#A1A1AA" />
          </TouchableOpacity>

          {/* 2. Restore from Backup */}
          <TouchableOpacity
            onPress={() => {
              setRestorePassword("");
              setRestoreModalVisible(true);
            }}
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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: "#FFF4D2",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Upload size={15} color="#B45309" />
              </View>
              <View>
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#121214" }}>
                  Restore from Backup
                </Text>
                <Text style={{ fontSize: 11, color: "#71717A" }}>
                  Restore data on any phone with your passphrase
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color="#A1A1AA" />
          </TouchableOpacity>

          {/* 3. Export Raw JSON (Audit) */}
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
              <Download size={16} color="#71717A" />
              <View>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#71717A" }}>
                  Export Raw JSON (Audit)
                </Text>
                <Text style={{ fontSize: 11, color: "#A1A1AA" }}>
                  Unencrypted developer snapshot
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color="#A1A1AA" />
          </TouchableOpacity>
        </View>

        {/* 5. App Info */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 22,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#EAEAE5",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 13, fontWeight: "800", color: "#121214" }}>
              Wage Finance
            </Text>
            <Text style={{ fontSize: 11, fontWeight: "800", color: "#71717A" }}>
              v1.0.0
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
            <CheckCircle size={13} color="#10B981" />
            <Text style={{ fontSize: 11, color: "#059669", fontWeight: "700" }}>
              100% On-Device Storage · Zero Telemetry
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

      {/* ── Create Encrypted Backup Modal ── */}
      <Modal
        visible={backupModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!isProcessingBackup) setBackupModalVisible(false);
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
                  Create Encrypted Backup
                </Text>
                <Caption>Zero-Knowledge AES-256 Protection</Caption>
              </View>
              <TouchableOpacity
                onPress={() => setBackupModalVisible(false)}
                disabled={isProcessingBackup}
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
                🔐 Your financial records will be encrypted with this passphrase before leaving your phone. You can safely save this file to Google Drive, iCloud, or email it to yourself.
              </Text>
            </View>

            <Text style={{ fontSize: 11, fontWeight: "800", color: "#71717A", textTransform: "uppercase", marginBottom: 6 }}>
              Set a Backup Passphrase *
            </Text>
            <TextInput
              value={backupPassword}
              onChangeText={setBackupPassword}
              placeholder="Min 4 characters (e.g. MySecretPIN2026)"
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
              onPress={handleCreateEncryptedBackup}
              disabled={isProcessingBackup}
              style={{
                backgroundColor: "#121214",
                paddingVertical: 14,
                borderRadius: 999,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
                {isProcessingBackup ? "Encrypting..." : "Encrypt & Share Backup"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Restore from Backup Modal ── */}
      <Modal
        visible={restoreModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!isProcessingBackup) setRestoreModalVisible(false);
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
                <Caption>Restore data from .wage.json</Caption>
              </View>
              <TouchableOpacity
                onPress={() => setRestoreModalVisible(false)}
                disabled={isProcessingBackup}
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

            <View style={{ backgroundColor: "#FFFBEB", borderRadius: 16, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#FDE68A" }}>
              <Text style={{ fontSize: 12, color: "#92400E", lineHeight: 18 }}>
                ⚠️ Restoring will overwrite existing ledger data on this device with records from your backup file.
              </Text>
            </View>

            <Text style={{ fontSize: 11, fontWeight: "800", color: "#71717A", textTransform: "uppercase", marginBottom: 6 }}>
              Enter Backup Passphrase *
            </Text>
            <TextInput
              value={restorePassword}
              onChangeText={setRestorePassword}
              placeholder="Passphrase used when creating backup"
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
              onPress={handleRestoreBackup}
              disabled={isProcessingBackup}
              style={{
                backgroundColor: "#B45309",
                paddingVertical: 14,
                borderRadius: 999,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
                {isProcessingBackup ? "Decrypting & Restoring..." : "Choose File & Restore"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
