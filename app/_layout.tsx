import "../global.css";
import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { queryClient } from "@/lib/query-client";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { useFinanceStore } from "@/store/useFinanceStore";
import { WageLoadingScreen } from "@/components/ui/wage-loading-screen";
import { migrateDbIfNeeded } from "@/lib/db";
import { getActiveLocalSession } from "@/lib/local-auth";

const DB_NAME = "wage.db";

/**
 * DbHydrator lives *inside* SQLiteProvider so it can call useSQLiteContext().
 * It hydrates the Zustand store once the DB is ready.
 */
function DbHydrator({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const hydrateFromDb = useFinanceStore((s) => s.hydrateFromDb);
  const isHydrated = useFinanceStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) {
      hydrateFromDb(db).catch((e) =>
        console.error("[DB] Hydration failed:", e)
      );
    }
  }, [db, hydrateFromDb, isHydrated]);

  return <>{children}</>;
}

/**
 * AppShell handles auth listening and the loading screen.
 * Separated so we can keep the SQLiteProvider at the outermost layer.
 */
function AppShell() {
  const setSession = useAuthStore((state) => state.setSession);
  const setProfile = useAuthStore((state) => state.setProfile);
  const setLoading = useAuthStore((state) => state.setLoading);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Load local offline session first
    getActiveLocalSession().then((localUser) => {
      if (localUser) {
        setProfile(localUser);
      }
    });

    // Initialize Supabase session listener
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, setProfile, setLoading]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen
          name="transaction/new"
          options={{
            presentation: "modal",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="analytics/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="subscriptions"
          options={{
            headerShown: false,
          }}
        />
      </Stack>

      {!appReady && (
        <WageLoadingScreen
          minDurationMs={900}
          onFinish={() => setAppReady(true)}
        />
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SQLiteProvider databaseName={DB_NAME} onInit={migrateDbIfNeeded}>
          <DbHydrator>
            <AppShell />
          </DbHydrator>
        </SQLiteProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
