import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { LoginFormData, RegisterFormData } from "./types";

export async function loginWithEmail({ email, password }: LoginFormData) {
  if (!isSupabaseConfigured) {
    // In unconfigured / local offline mode, return simulated session
    return {
      data: {
        user: { id: "local-user-id", email },
        session: { access_token: "mock-token", user: { id: "local-user-id", email } },
      },
      error: null,
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

export async function registerWithEmail({ email, password, fullName }: RegisterFormData) {
  if (!isSupabaseConfigured) {
    return {
      data: {
        user: { id: "local-user-id", email, user_metadata: { full_name: fullName } },
        session: { access_token: "mock-token", user: { id: "local-user-id", email } },
      },
      error: null,
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  return { data, error };
}

export async function sendPasswordResetEmail(email: string) {
  if (!isSupabaseConfigured) {
    return { data: {}, error: null };
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  return { data, error };
}

export async function logoutUser() {
  if (!isSupabaseConfigured) {
    return { error: null };
  }
  const { error } = await supabase.auth.signOut();
  return { error };
}

