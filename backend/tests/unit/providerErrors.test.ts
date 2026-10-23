import { describe, expect, it } from "vitest";
import { actionableProviderError } from "../../src/domains/chat/providers/providerErrors.js";

describe("actionable provider errors", () => {
  it.each([401, 403])("explains how to fix rejected credentials (HTTP %i)", (status) => {
    expect(actionableProviderError(`Provider API error (${status}): sensitive response`)).toMatch(
      /rejected this API key.*Customize → Providers.*verify/i
    );
  });

  it("explains rate limits and quota", () => {
    expect(actionableProviderError("Provider API error (429): sensitive response")).toMatch(
      /rate limit or quota.*check your provider quota.*retry/i
    );
  });

  it.each(["Provider API error (408): timeout", "Gateway HTTP 504", "request timed out"])(
    "explains how to recover from timeouts: %s",
    (message) => {
      expect(actionableProviderError(message)).toMatch(/too long to respond.*Retry/i);
    }
  );

  it("suggests a model or endpoint correction for invalid model requests", () => {
    expect(actionableProviderError("Provider API error (400): private response")).toMatch(
      /model ID is valid.*provider and endpoint/i
    );
  });

  it("keeps missing-key and unknown-model guidance intact", () => {
    expect(actionableProviderError("MISSING_API_KEY:openai:Connect your key")).toBe(
      "MISSING_API_KEY:openai:Connect your key"
    );
    expect(actionableProviderError("UNKNOWN_MODEL:unknown")).toBe("UNKNOWN_MODEL:unknown");
  });

  it("does not expose raw provider response bodies", () => {
    expect(actionableProviderError("Provider API error (401): secret-token-value")).not.toContain(
      "secret-token-value"
    );
  });
});
