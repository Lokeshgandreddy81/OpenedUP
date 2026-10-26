import { useContext } from "react";
import { ANONYMOUS_CHAT_AUTH, ChatAuthContext } from "./chatAuthState";

export function useChatAuth() {
  return useContext(ChatAuthContext) ?? ANONYMOUS_CHAT_AUTH;
}
