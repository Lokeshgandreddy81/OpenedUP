import { createContext } from "react";

export interface ChatIdentity {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

export interface ChatAuthContextValue {
  user: ChatIdentity | null;
  loading: boolean;
  signInError: string | null;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  createAccount: (displayName: string, email: string, password: string) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerificationEmail: (email?: string | null) => Promise<void>;
  refreshUser: () => Promise<ChatIdentity | null>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

export const ChatAuthContext = createContext<ChatAuthContextValue | null>(null);

export const ANONYMOUS_CHAT_AUTH: ChatAuthContextValue = {
  user: null,
  loading: false,
  signInError: null,
  signIn: async () => {},
  signInWithEmail: async () => {},
  createAccount: async () => false,
  sendPasswordReset: async () => {},
  resendVerificationEmail: async () => {},
  refreshUser: async () => null,
  signOut: async () => {},
  getIdToken: async () => null,
};
