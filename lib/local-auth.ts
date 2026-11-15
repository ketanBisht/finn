/**
 * lib/local-auth.ts
 * ─────────────────
 * Handles on-device authentication via Expo SecureStore when Supabase
 * is not configured, or supplements it with local credential management.
 */

import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { isSupabaseConfigured, supabase } from "./supabase";

const LOCAL_USER_KEY = "wage_registered_user";
const LOCAL_SESSION_KEY = "wage_active_session";

export interface LocalUser {
  name: string;
  email: string;
  passwordHash: string;
  registeredAt: string;
}

// Simple deterministic hash for local offline storage (not plaintext)
function hashPassword(pw: string): string {
  let hash = 0;
  for (let i = 0; i < pw.length; i++) {
    const char = pw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash)}_${pw.length}`;
}

async function getStorageItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function setStorageItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (e) {
    console.warn("SecureStore setItem failed:", e);
  }
}

async function removeStorageItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key);
    }
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (e) {
    console.warn("SecureStore removeItem failed:", e);
  }
}

export async function registerAccount(
  name: string,
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();

  if (!trimmedName) {
    return { success: false, error: "Please enter your full name." };
  }
  if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { success: false, error: "Please enter a valid email address." };
  }
  if (!password || password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  // If Supabase is connected, register with Supabase
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: { full_name: trimmedName },
      },
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  // Otherwise, use local SecureStore
  const user: LocalUser = {
    name: trimmedName,
    email: trimmedEmail,
    passwordHash: hashPassword(password),
    registeredAt: new Date().toISOString(),
  };

  await setStorageItem(LOCAL_USER_KEY, JSON.stringify(user));
  await setStorageItem(LOCAL_SESSION_KEY, JSON.stringify({ email: trimmedEmail, name: trimmedName }));
  return { success: true };
}

export async function loginAccount(
  email: string,
  password: string
): Promise<{ success: boolean; user?: { name: string; email: string }; error?: string }> {
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { success: false, error: "Please enter a valid email address." };
  }
  if (!password || password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  // If Supabase is connected, authenticate with Supabase
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return {
      success: true,
      user: {
        name: data.user?.user_metadata?.full_name ?? "User",
        email: data.user?.email ?? trimmedEmail,
      },
    };
  }

  // Otherwise, verify against local SecureStore
  const rawUser = await getStorageItem(LOCAL_USER_KEY);
  if (!rawUser) {
    return {
      success: false,
      error: "No account registered on this device yet. Please tap 'Register' to create your account.",
    };
  }

  try {
    const storedUser: LocalUser = JSON.parse(rawUser);
    if (storedUser.email !== trimmedEmail) {
      return {
        success: false,
        error: "Email not found. Please check your email or register a new account.",
      };
    }
    if (storedUser.passwordHash !== hashPassword(password)) {
      return {
        success: false,
        error: "Incorrect password. Please try again.",
      };
    }

    await setStorageItem(
      LOCAL_SESSION_KEY,
      JSON.stringify({ email: storedUser.email, name: storedUser.name })
    );

    return {
      success: true,
      user: { name: storedUser.name, email: storedUser.email },
    };
  } catch {
    return { success: false, error: "Failed to parse local account data." };
  }
}

export async function logoutAccount(): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
  await removeStorageItem(LOCAL_SESSION_KEY);
}

export async function getActiveLocalSession(): Promise<{ name: string; email: string } | null> {
  const raw = await getStorageItem(LOCAL_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
