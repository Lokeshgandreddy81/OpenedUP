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
