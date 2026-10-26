import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import {
  getFirebaseIdToken,
  signInForChat,
  subscribeToChatAuth,
} from "../integrations/workspaceLiveSync";
import { ChatAuthContext, type ChatIdentity } from "./chatAuthState";

function toIdentity(user: User | null): ChatIdentity | null {
  return user ? { uid: user.uid, email: user.email, displayName: user.displayName } : null;
}

export const ChatAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ChatIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(
    () =>
      subscribeToChatAuth((firebaseUser) => {
        setUser(toIdentity(firebaseUser));
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

  const getIdToken = useCallback(() => getFirebaseIdToken(), []);
  const value = useMemo(
    () => ({ user, loading, signInError, signIn, getIdToken }),
    [user, loading, signInError, signIn, getIdToken]
  );

  return <ChatAuthContext.Provider value={value}>{children}</ChatAuthContext.Provider>;
};
