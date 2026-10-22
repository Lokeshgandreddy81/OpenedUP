import { describe, it, expect, beforeEach } from "vitest";
import {
  getSavedGoogleClientId,
  saveGoogleClientId,
  getSavedWorkspaceSession,
  saveWorkspaceSession,
  clearSavedWorkspaceSession,
  parseDriveFolderId,
  resolveReceiptMimeType,
} from "../utils/workspaceLiveSync.ts";

describe("workspaceLiveSync utils", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Client ID persistence", () => {
    it("saves and retrieves Google Client ID from localStorage", () => {
      expect(getSavedGoogleClientId()).toBe("");
      saveGoogleClientId("12345-abcde.apps.googleusercontent.com");
      expect(getSavedGoogleClientId()).toBe("12345-abcde.apps.googleusercontent.com");
    });
  });

  describe("Workspace Session persistence", () => {
    it("persists, reads, and clears auth sessions cleanly", () => {
      expect(getSavedWorkspaceSession()).toBeNull();

      const session = {
        accessToken: "ya29.sample-token",
        expiresAt: Date.now() + 3600000,
        accountEmail: "audit@charan-interiors.com",
        grantedScopes: { drive: true, gmail: true },
      };

      saveWorkspaceSession(session);
      const retrieved = getSavedWorkspaceSession();
      expect(retrieved).not.toBeNull();
      expect(retrieved?.accountEmail).toBe("audit@charan-interiors.com");
      expect(retrieved?.accessToken).toBe("ya29.sample-token");

      clearSavedWorkspaceSession();
      expect(getSavedWorkspaceSession()).toBeNull();
    });
  });

  describe("parseDriveFolderId", () => {
    it("extracts folder ID from complete Google Drive URLs", () => {
      const url = "https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ";
      expect(parseDriveFolderId(url)).toBe("1aBcDeFgHiJkLmNoPqRsTuVwXyZ");
    });

    it("returns trimmed ID when given raw folder ID string", () => {
      expect(parseDriveFolderId("  1aBcDeFgHiJkLmNoPqRsTuVwXyZ  ")).toBe(
        "1aBcDeFgHiJkLmNoPqRsTuVwXyZ"
      );
    });
  });

  describe("resolveReceiptMimeType", () => {
    it("identifies MIME type from filename extension or raw MIME", () => {
      expect(resolveReceiptMimeType("receipt.pdf", "application/pdf")).toBe("application/pdf");
      expect(resolveReceiptMimeType("scan.jpg")).toBe("image/jpeg");
      expect(resolveReceiptMimeType("invoice.png")).toBe("image/png");
      expect(resolveReceiptMimeType("photo.webp")).toBe("image/webp");
    });
  });
});
