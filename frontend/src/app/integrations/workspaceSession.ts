export interface SavedWorkspaceSession {
  accessToken: string;
  accountEmail: string;
  grantedScopes: {
    drive: boolean;
    gmail: boolean;
  };
  expiresAt: number;
}

let cachedAccessToken: string | null = null;
let cachedWorkspaceSession: SavedWorkspaceSession | null = null;

export function getSavedWorkspaceSession(): SavedWorkspaceSession | null {
  if (!cachedWorkspaceSession || !cachedAccessToken) return null;
  if (Date.now() + 15_000 >= cachedWorkspaceSession.expiresAt) {
    clearSavedWorkspaceSession();
    return null;
  }
  return cachedWorkspaceSession;
}

export function saveWorkspaceSession(session: SavedWorkspaceSession): void {
  cachedAccessToken = session.accessToken;
  cachedWorkspaceSession = session;
}

export function clearSavedWorkspaceSession(): void {
  cachedAccessToken = null;
  cachedWorkspaceSession = null;
}
