import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { logout, signInForChat, subscribeToChatAuth, getSupabaseAccessToken } from "../integrations/supabaseAuth";
import { ChatAuthContext, type ChatIdentity } from "./chatAuthState";

function toIdentity(user: User | null): ChatIdentity | null {
  return user
    ? {
        uid: user.id,
        email: user.email ?? null,
        displayName:
          typeof user.user_metadata["full_name"] === "string"
            ? user.user_metadata["full_name"]
            : typeof user.user_metadata["name"] === "string"
              ? user.user_metadata["name"]
              : null,
      }
    : null;
}

export const ChatAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ChatIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(
    () =>
      subscribeToChatAuth((supabaseUser) => {
        setUser(toIdentity(supabaseUser));
        setLoading(false);
      }),
    []
  );

  const signIn = useCallback(async () => {
    try {
      setSignInError(null);
      await signInForChat();
    } catch (error) {
      setSignInError(error instanceof Error ? error.message : "Sign-in failed. Please try again.");
    }
  }, []);

  const signOut = useCallback(async () => {
    setSignInError(null);
    await logout();
  }, []);

  const getIdToken = useCallback(() => getSupabaseAccessToken(), []);
  const value = useMemo(
    () => ({
      user,
      loading,
      signInError,
      signIn,
      signOut,
      getIdToken,
    }),
    [
      user,
      loading,
      signInError,
      signIn,
      signOut,
      getIdToken,
    ]
  );

  return <ChatAuthContext.Provider value={value}>{children}</ChatAuthContext.Provider>;
};
