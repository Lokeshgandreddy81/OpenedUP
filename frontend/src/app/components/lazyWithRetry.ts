import { lazy, type ComponentType } from "react";

/**
 * Wraps dynamic component imports with automatic recovery.
 * If a module fails to load (e.g. after a rebuild/deployment or MIME type mismatch),
 * it reloads the page once to pull the updated HTML and new chunk hashes.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const sessionKey = "chunk_load_retried";
    const alreadyRetried =
      typeof window !== "undefined" && window.sessionStorage.getItem(sessionKey) === "true";

    try {
      const component = await componentImport();
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(sessionKey);
      }
      return component;
    } catch (error: any) {
      const errorMessage = String(error?.message || error || "");
      const isChunkOrMimeError =
        errorMessage.includes("MIME type") ||
        errorMessage.includes("Failed to fetch dynamically imported module") ||
        errorMessage.includes("Importing a module script failed") ||
        errorMessage.includes("error loading dynamically imported module") ||
        error?.name === "ChunkLoadError";

      if (typeof window !== "undefined" && !alreadyRetried && isChunkOrMimeError) {
        window.sessionStorage.setItem(sessionKey, "true");
        window.location.reload();
        return new Promise(() => {}); // Suspend execution while reloading
      }

      throw error;
    }
  });
}
