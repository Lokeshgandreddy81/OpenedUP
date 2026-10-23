import { describe, it, expect } from "vitest";
import {
  AppError,
  isTransientError,
  isQuotaExhaustedError,
  isModelCascadeError,
  extractHumanErrorMessage,
  parseJsonSafely,
  withTimeout,
} from "../../src/platform/errors/errors.js";

describe("errors utils", () => {
  describe("AppError", () => {
    it("creates an AppError with status and operational flag", () => {
      const err = new AppError("Invalid input", 400);
      expect(err.message).toBe("Invalid input");
      expect(err.statusCode).toBe(400);
      expect(err.isOperational).toBe(true);
    });
  });

  describe("error matchers", () => {
    it("detects transient errors", () => {
      expect(isTransientError("503 Service Unavailable")).toBe(true);
      expect(isTransientError("Rate limit exceeded 429")).toBe(true);
      expect(isTransientError("fetch failed ECONNRESET")).toBe(true);
      expect(isTransientError("syntax error in prompt")).toBe(false);
    });

    it("detects quota exhausted errors", () => {
      expect(isQuotaExhaustedError("Resource_exhausted: quota exceeded")).toBe(true);
      expect(isQuotaExhaustedError("credit balance insufficient")).toBe(true);
      expect(isQuotaExhaustedError("500 internal error")).toBe(false);
    });

    it("detects cascade errors", () => {
      expect(isModelCascadeError("404 model not found")).toBe(true);
      expect(isModelCascadeError("model no longer available")).toBe(true);
      expect(isModelCascadeError("503 high demand")).toBe(true);
    });
  });

  describe("extractHumanErrorMessage", () => {
    it("extracts clean messages from Error and JSON objects", () => {
      expect(extractHumanErrorMessage(new Error("Simple error"), "fallback")).toBe("Simple error");
      expect(
        extractHumanErrorMessage(
          JSON.stringify({ error: { message: "Inner message" } }),
          "fallback"
        )
      ).toBe("Inner message");
      expect(extractHumanErrorMessage(null, "fallback")).toBe("fallback");
    });
  });

  describe("parseJsonSafely", () => {
    it("parses valid json and extracts json from code blocks or loose braces", () => {
      expect(parseJsonSafely('{"a": 1}', {})).toEqual({ a: 1 });
      expect(parseJsonSafely('```json\n{"b": 2}\n```', {})).toEqual({ b: 2 });
      expect(parseJsonSafely('prefix {"c": 3} suffix', {})).toEqual({ c: 3 });
      expect(parseJsonSafely("[1, 2, 3]", [])).toEqual([1, 2, 3]);
      expect(parseJsonSafely("invalid string", { fallback: true })).toEqual({ fallback: true });
    });
  });

  describe("withTimeout", () => {
    it("resolves before timeout", async () => {
      const result = await withTimeout(Promise.resolve("ok"), 1000, "Timed out");
      expect(result).toBe("ok");
    });

    it("rejects on timeout", async () => {
      const slow = new Promise((resolve) => setTimeout(resolve, 500));
      await expect(withTimeout(slow, 50, "Timed out")).rejects.toThrow("Timed out");
    });
  });
});
