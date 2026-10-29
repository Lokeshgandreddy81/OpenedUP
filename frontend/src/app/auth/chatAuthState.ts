import { createContext } from "react";

export interface ChatIdentity {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface ChatAuthContextValue {
  user: ChatIdentity | null;
  loading: boolean;
  signInError: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

export const ChatAuthContext = createContext<ChatAuthContextValue | null>(null);

export const ANONYMOUS_CHAT_AUTH: ChatAuthContextValue = {
  user: null,
  loading: false,
  signInError: null,
  signIn: async () => {},
  signOut: async () => {},
  getIdToken: async () => null,
};
