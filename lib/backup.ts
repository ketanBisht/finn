/**
 * lib/backup.ts
 * ─────────────
 * Zero-Knowledge Private Backup & Restore Engine for Wage.
 *
 * Security Model:
 *  • Client-side AES-256 encryption using a user-chosen Passphrase / Master PIN.
 *  • Zero-Knowledge: Neither the developer, Google, Apple, nor third-parties can
 *    read or decrypt the financial data without the secret passphrase.
 *  • Portability: Backup is encapsulated in an open, versioned `.wage.json` file
 *    that can be safely stored on Google Drive, iCloud, local storage, or emailed.
 */

import CryptoJS from "crypto-js";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Share, Platform } from "react-native";
import { HydratedState } from "@/lib/db";

export interface BackupEnvelope {
  app: "Wage";
  format: "wage_zk_backup";
  version: number;
  exported_at: string;
  meta: {
    accounts_count: number;
    transactions_count: number;
    debts_count: number;
    budgets_count: number;
    subscriptions_count: number;
  };
  payload: string; // AES-256 encrypted ciphertext
}

/**
 * Encrypts a full snapshot of the user's financial database with a user passphrase.
 */
export function createEncryptedBackupPayload(
  data: HydratedState,
  passphrase: string,
  userMeta?: { name?: string; email?: string }
): string {
  const cleanKey = passphrase.trim();
  if (cleanKey.length < 4) {
    throw new Error("Backup passphrase must be at least 4 characters long.");
  }

  const rawSnapshot = JSON.stringify({
    accounts: data.accounts || [],
    categories: data.categories || [],
    transactions: data.transactions || [],
    budgets: data.budgets || [],
    overallMonthlyBudgets: data.overallMonthlyBudgets || {},
    customPlatforms: data.customPlatforms || [],
    debts: data.debts || [],
    subscriptions: data.subscriptions || [],
    userMeta: userMeta || {},
    exported_at: new Date().toISOString(),
  });

  const ciphertext = CryptoJS.AES.encrypt(rawSnapshot, cleanKey).toString();

  const envelope: BackupEnvelope = {
    app: "Wage",
    format: "wage_zk_backup",
    version: 1,
    exported_at: new Date().toISOString(),
    meta: {
      accounts_count: data.accounts?.length || 0,
      transactions_count: data.transactions?.length || 0,
      debts_count: data.debts?.length || 0,
      budgets_count: data.budgets?.length || 0,
      subscriptions_count: data.subscriptions?.length || 0,
    },
    payload: ciphertext,
  };

  return JSON.stringify(envelope, null, 2);
}

/**
 * Creates an encrypted backup file and opens the system Share sheet
 * (allowing 1-tap save to Google Drive, iCloud, WhatsApp, Email, etc.).
 */
export async function exportAndShareEncryptedBackup(
  data: HydratedState,
  passphrase: string,
  userMeta?: { name?: string; email?: string }
): Promise<void> {
  const envelopeJson = createEncryptedBackupPayload(data, passphrase, userMeta);

  const dateTag = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const fileName = `wage_backup_${dateTag}.wage.json`;

  if (Platform.OS === "web") {
    // For web preview, download as a file
    if (typeof window !== "undefined") {
      const blob = new Blob([envelopeJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
    return;
  }

  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, envelopeJson, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: "application/json",
      dialogTitle: "Save Zero-Knowledge Wage Backup",
      UTI: "public.json",
    });
  } else {
    await Share.share({
      title: "Wage Encrypted Backup",
      message: envelopeJson,
    });
  }
}

/**
 * Decrypts a backup envelope using the user's secret passphrase.
 * Throws a clear error if the passphrase is wrong or the file is invalid.
 */
export function decryptBackupEnvelope(
  rawContent: string,
  passphrase: string
): HydratedState {
  const cleanKey = passphrase.trim();
  if (!cleanKey) {
    throw new Error("Please enter your backup passphrase.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    throw new Error("Invalid backup file: Not a valid JSON document.");
  }

  const envelope = parsed as Partial<BackupEnvelope>;

  // Check if it's our encrypted envelope
  if (!envelope.payload || typeof envelope.payload !== "string") {
    // Check if it's an unencrypted legacy JSON export
    const legacy = parsed as Record<string, unknown>;
    if (Array.isArray(legacy.accounts) && Array.isArray(legacy.transactions)) {
      return legacy as unknown as HydratedState;
    }
    throw new Error("Unsupported backup format. Please select a valid .wage.json file.");
  }

  let decryptedUtf8: string;
  try {
    const bytes = CryptoJS.AES.decrypt(envelope.payload, cleanKey);
    decryptedUtf8 = bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    throw new Error("Incorrect passphrase or corrupted backup file.");
  }

  if (!decryptedUtf8) {
    throw new Error("Incorrect passphrase. Could not decrypt your backup.");
  }

  let snapshot: HydratedState;
  try {
    snapshot = JSON.parse(decryptedUtf8);
  } catch {
    throw new Error("Decrypted data is corrupted or invalid.");
  }

  if (!Array.isArray(snapshot.accounts) || !Array.isArray(snapshot.transactions)) {
    throw new Error("Backup file is missing required financial records.");
  }

  return snapshot;
}

/**
 * Opens system document picker to pick a backup file and decrypts it.
 */
export async function pickAndDecryptBackup(
  passphrase: string
): Promise<{ state: HydratedState; fileName: string } | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["*/*", "application/json", "text/plain"],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  const fileContent = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const state = decryptBackupEnvelope(fileContent, passphrase);
  return { state, fileName: asset.name };
}
