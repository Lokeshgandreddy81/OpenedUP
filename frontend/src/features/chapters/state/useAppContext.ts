import { useContext } from "react";
import { AppContext, DEFAULT_APP_CONTEXT } from "./appContextState";
import type { AppContextType } from "./appContextState";

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (context) return context;
  if (typeof window !== "undefined" && window.__SHOBOX_APP_CONTEXT_VALUE__) {
    return window.__SHOBOX_APP_CONTEXT_VALUE__;
  }
  return DEFAULT_APP_CONTEXT;
}
