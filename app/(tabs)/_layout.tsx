import React from "react";
import { Tabs } from "expo-router";
import {
  LayoutDashboard,
  Calendar,
  ArrowLeftRight,
  PieChart,
  Wallet,
} from "lucide-react-native";
import { Platform, View } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "ios" ? 28 : 16,
          left: 20,
          right: 20,
          backgroundColor: "#121214",
          borderRadius: 38,
          height: 64,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: "#27272a",
          elevation: 12,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
          paddingHorizontal: 6,
          paddingBottom: 0,
          paddingTop: 0,
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
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: focused ? "#FFC83B" : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LayoutDashboard
                size={20}
                color={focused ? "#121214" : "#A1A1AA"}
                strokeWidth={focused ? 2.4 : 2}
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
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: focused ? "#FFC83B" : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Calendar
                size={20}
                color={focused ? "#121214" : "#A1A1AA"}
                strokeWidth={focused ? 2.4 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: focused ? "#FFC83B" : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowLeftRight
                size={20}
                color={focused ? "#121214" : "#A1A1AA"}
                strokeWidth={focused ? 2.4 : 2}
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
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: focused ? "#FFC83B" : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PieChart
                size={20}
                color={focused ? "#121214" : "#A1A1AA"}
                strokeWidth={focused ? 2.4 : 2}
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
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: focused ? "#FFC83B" : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wallet
                size={20}
                color={focused ? "#121214" : "#A1A1AA"}
                strokeWidth={focused ? 2.4 : 2}
              />
            </View>
          ),
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

