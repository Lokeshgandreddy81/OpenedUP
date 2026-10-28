import type { AuthChangeEvent, User } from "@supabase/supabase-js";
import { clearSavedWorkspaceSession } from "./workspaceSession";
import { requireSupabase, supabase } from "./supabaseClient";

function authCallbackUrl(nextPath: string): string {
  const url = new URL("/auth/callback", window.location.origin);
  url.searchParams.set("next", nextPath);
  return url.toString();
}

export function subscribeToChatAuth(
  callback: (user: User | null, event: AuthChangeEvent) => void
): () => void {
  if (!supabase) {
    callback(null, "INITIAL_SESSION");
    return () => undefined;
  }

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null, event);
    if (event === "SIGNED_OUT") clearSavedWorkspaceSession();
  });
  return () => data.subscription.unsubscribe();
}

export async function signInForChat(): Promise<void> {
  const { error } = await requireSupabase().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: authCallbackUrl("/chat"), scopes: "openid email profile" },
  });
  if (error) throw error;
}

export async function signInWithEmailForChat(email: string, password: string): Promise<User> {
  const { data, error } = await requireSupabase().auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  return data.user;
}

export async function createChatAccount(
  displayName: string,
  email: string,
  password: string
): Promise<boolean> {
  const { data, error } = await requireSupabase().auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { full_name: displayName.trim() },
      emailRedirectTo: authCallbackUrl("/chat"),
    },
  });
  if (error) throw error;
  return Boolean(data.user && !data.session);
}

export async function resendChatVerificationEmail(email?: string | null): Promise<void> {
  const targetEmail = email?.trim();
  if (!targetEmail) throw new Error("Enter your email address to resend the confirmation link.");
  const { error } = await requireSupabase().auth.resend({
    type: "signup",
    email: targetEmail,
    options: { emailRedirectTo: authCallbackUrl("/chat") },
  });
  if (error) throw error;
}

export async function refreshChatUser(): Promise<User | null> {
  const { data, error } = await requireSupabase().auth.getUser();
  if (error) {
    if (error.name === "AuthSessionMissingError") return null;
    throw error;
  }
  return data.user;
}

export async function sendChatPasswordReset(email: string): Promise<void> {
  const { error } = await requireSupabase().auth.resetPasswordForEmail(email.trim(), {
    redirectTo: authCallbackUrl("/reset-password"),
  });
  if (error) throw error;
}

export async function updateChatPassword(password: string): Promise<void> {
  const { error } = await requireSupabase().auth.updateUser({ password });
  if (error) throw error;
}

export async function getSupabaseAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.access_token ?? null;
}

export async function logout(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  clearSavedWorkspaceSession();
}
