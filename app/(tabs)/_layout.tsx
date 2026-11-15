import React from "react";
import { Tabs } from "expo-router";
import {
  LayoutDashboard,
  ArrowLeftRight,
  HandCoins,
  PieChart,
  Wallet,
  User,
  Calendar,
} from "lucide-react-native";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "ios" ? Math.max(insets.bottom, 14) : 14,
          left: 12,
          right: 12,
          height: 64,
          backgroundColor: "#121214",
          borderRadius: 32,
          borderWidth: 1,
          borderColor: "rgba(255, 200, 59, 0.25)",
          elevation: 16,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: "#FFC83B",
        tabBarInactiveTintColor: "#71717A",
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: "800",
          marginTop: 2,
        },
      }}
    >
      {/* 1. Home / Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 32,
                height: 24,
                borderRadius: 12,
                backgroundColor: focused ? "#FFC83B" : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LayoutDashboard
                size={16}
                color={focused ? "#121214" : "#71717A"}
                strokeWidth={focused ? 2.6 : 2}
              />
            </View>
          ),
        }}
      />

      {/* 2. Ledger */}
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Ledger",
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 32,
                height: 24,
                borderRadius: 12,
                backgroundColor: focused ? "#FFC83B" : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowLeftRight
                size={16}
                color={focused ? "#121214" : "#71717A"}
                strokeWidth={focused ? 2.6 : 2}
              />
            </View>
          ),
        }}
      />

      {/* 3. Debts & Udhar (Explicit user request for dedicated nav bar section) */}
      <Tabs.Screen
        name="debts"
        options={{
          title: "Debts",
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 32,
                height: 24,
                borderRadius: 12,
                backgroundColor: focused ? "#FFC83B" : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <HandCoins
                size={16}
                color={focused ? "#121214" : "#71717A"}
                strokeWidth={focused ? 2.6 : 2}
              />
            </View>
          ),
        }}
      />

      {/* 4. Budgets */}
      <Tabs.Screen
        name="budgets"
        options={{
          title: "Budgets",
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 32,
                height: 24,
                borderRadius: 12,
                backgroundColor: focused ? "#FFC83B" : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PieChart
                size={16}
                color={focused ? "#121214" : "#71717A"}
                strokeWidth={focused ? 2.6 : 2}
              />
            </View>
          ),
        }}
      />

      {/* 5. Accounts & Wallets */}
      <Tabs.Screen
        name="accounts"
        options={{
          title: "Accounts",
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 32,
                height: 24,
                borderRadius: 12,
                backgroundColor: focused ? "#FFC83B" : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wallet
                size={16}
                color={focused ? "#121214" : "#71717A"}
                strokeWidth={focused ? 2.6 : 2}
              />
            </View>
          ),
        }}
      />

      {/* 6. Settings & Profile (Explicit user request for visible tab) */}
      <Tabs.Screen
        name="settings"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 32,
                height: 24,
                borderRadius: 12,
                backgroundColor: focused ? "#FFC83B" : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <User
                size={16}
                color={focused ? "#121214" : "#71717A"}
                strokeWidth={focused ? 2.6 : 2}
              />
            </View>
          ),
        }}
      />

      {/* Calendar Audit (accessible via Ledger & Dashboard) */}
      <Tabs.Screen
        name="calendar"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
