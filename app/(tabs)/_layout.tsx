import React from "react";
import { Tabs } from "expo-router";
import {
  LayoutDashboard,
  Calendar,
  ArrowLeftRight,
  PieChart,
  Wallet,
} from "lucide-react-native";
import { Platform, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: "#121214",
          borderTopColor: "#27272a",
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 82 + insets.bottom : 64 + Math.max(insets.bottom, 6),
          paddingBottom: Platform.OS === "ios" ? insets.bottom + 2 : Math.max(insets.bottom, 6),
          paddingTop: 6,
          elevation: 10,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
        },
        tabBarActiveTintColor: "#FFC83B",
        tabBarInactiveTintColor: "#71717A",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "800",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 36,
                height: 26,
                borderRadius: 13,
                backgroundColor: focused ? "#FFC83B" : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LayoutDashboard
                size={17}
                color={focused ? "#121214" : "#71717A"}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 36,
                height: 26,
                borderRadius: 13,
                backgroundColor: focused ? "#FFC83B" : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Calendar
                size={17}
                color={focused ? "#121214" : "#71717A"}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Ledger",
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 36,
                height: 26,
                borderRadius: 13,
                backgroundColor: focused ? "#FFC83B" : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowLeftRight
                size={17}
                color={focused ? "#121214" : "#71717A"}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: "Budgets",
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 36,
                height: 26,
                borderRadius: 13,
                backgroundColor: focused ? "#FFC83B" : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PieChart
                size={17}
                color={focused ? "#121214" : "#71717A"}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: "Accounts",
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 36,
                height: 26,
                borderRadius: 13,
                backgroundColor: focused ? "#FFC83B" : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wallet
                size={17}
                color={focused ? "#121214" : "#71717A"}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="debts"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // Accessible via top settings icon
        }}
      />
    </Tabs>
  );
}
