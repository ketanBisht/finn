/**
 * lib/db-provider.tsx
 * ────────────────────
 * Wraps the app in expo-sqlite's SQLiteProvider and exposes the
 * database instance via a custom hook for non-component code.
 */

import React, { useCallback } from "react";
import { Text, View } from "react-native";
import { SQLiteProvider } from "expo-sqlite";
import { migrateDbIfNeeded } from "./db";

const DB_NAME = "wage.db";

/** Wrap your root layout children with this provider. */
export function WageDatabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const handleInit = useCallback(migrateDbIfNeeded, []);

  return (
    <SQLiteProvider
      databaseName={DB_NAME}
      onInit={handleInit}
      useSuspense={false}
    >
      {children}
    </SQLiteProvider>
  );
}

