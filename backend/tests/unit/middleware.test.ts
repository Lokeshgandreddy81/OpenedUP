import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { errorHandler } from "../../src/middleware/errorHandler.js";
import { validateBody, validateQuery } from "../../src/middleware/validate.js";
import { requestIdMiddleware } from "../../src/middleware/requestId.js";
import { AppError } from "../../src/utils/errors.js";

describe("backend middleware unit tests", () => {
  describe("errorHandler", () => {
    it("handles AppError with custom status code", () => {
      const req = { id: "req-123", method: "GET", originalUrl: "/test" } as unknown as Request;
      const statusSpy = vi.fn().mockReturnThis();
      const jsonSpy = vi.fn().mockReturnThis();
      const res = { status: statusSpy, json: jsonSpy } as unknown as Response;
      const next = vi.fn() as NextFunction;

      const appError = new AppError("Invalid resource", 404);
      errorHandler(appError, req, res, next);

      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Invalid resource",
          requestId: "req-123",
          statusCode: 404,
        })
      );
    });

    it("handles generic Error with fallback 500 status", () => {
      const req = { id: "req-456", method: "POST", originalUrl: "/error" } as unknown as Request;
      const statusSpy = vi.fn().mockReturnThis();
      const jsonSpy = vi.fn().mockReturnThis();
      const res = { status: statusSpy, json: jsonSpy } as unknown as Response;
      const next = vi.fn() as NextFunction;

      const error = new Error("Database timeout");
      errorHandler(error, req, res, next);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Database timeout",
          requestId: "req-456",
          statusCode: 500,
        })
      );
    });

    it("handles non-Error objects with unknown status and message", () => {
      const req = {} as Request;
      const statusSpy = vi.fn().mockReturnThis();
      const jsonSpy = vi.fn().mockReturnThis();
      const res = { status: statusSpy, json: jsonSpy } as unknown as Response;
      const next = vi.fn() as NextFunction;

      errorHandler({ status: 503 }, req, res, next);

      expect(statusSpy).toHaveBeenCalledWith(503);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Internal Server Error",
          statusCode: 503,
        })
      );
    });
  });

  describe("validate middleware", () => {
    const testSchema = z.object({
      name: z.string().min(2),
      count: z.number().int().positive(),
    });

    it("passes validateBody when input is valid", () => {
      const req = { body: { name: "Audit", count: 5 } } as Request;
      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      const middleware = validateBody(testSchema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body).toEqual({ name: "Audit", count: 5 });
    });

    it("returns 400 on validateBody failure", () => {
      const req = { body: { name: "" }, id: "req-test" } as Request;
      const statusSpy = vi.fn().mockReturnThis();
      const jsonSpy = vi.fn().mockReturnThis();
      const res = { status: statusSpy, json: jsonSpy } as unknown as Response;
      const next = vi.fn() as NextFunction;

      const middleware = validateBody(testSchema);
      middleware(req, res, next);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Validation failed",
          requestId: "req-test",
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("passes validateQuery when query params are valid", () => {
      const querySchema = z.object({ page: z.string() });
      const req = { query: { page: "1" } } as unknown as Request;
      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      const middleware = validateQuery(querySchema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("returns 400 on validateQuery failure", () => {
      const querySchema = z.object({ page: z.string() });
      const req = { query: {}, id: "query-err" } as unknown as Request;
      const statusSpy = vi.fn().mockReturnThis();
      const jsonSpy = vi.fn().mockReturnThis();
      const res = { status: statusSpy, json: jsonSpy } as unknown as Response;
      const next = vi.fn() as NextFunction;

      const middleware = validateQuery(querySchema);
      middleware(req, res, next);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Invalid query parameters",
          requestId: "query-err",
        })
      );
    });
  });

  describe("requestIdMiddleware", () => {
    it("uses existing x-request-id if provided", () => {
      const req = {
        header: vi.fn().mockReturnValue("existing-uuid-123"),
      } as unknown as Request;
      const setHeaderSpy = vi.fn();
      const res = { setHeader: setHeaderSpy } as unknown as Response;
      const next = vi.fn() as NextFunction;

      requestIdMiddleware(req, res, next);

      expect(req.id).toBe("existing-uuid-123");
      expect(setHeaderSpy).toHaveBeenCalledWith("X-Request-Id", "existing-uuid-123");
      expect(next).toHaveBeenCalled();
    });

    it("generates random UUID when no x-request-id header exists", () => {
      const req = {
        header: vi.fn().mockReturnValue(undefined),
      } as unknown as Request;
      const setHeaderSpy = vi.fn();
      const res = { setHeader: setHeaderSpy } as unknown as Response;
      const next = vi.fn() as NextFunction;

      requestIdMiddleware(req, res, next);

      expect(typeof req.id).toBe("string");
      expect(req.id?.length).toBeGreaterThan(10);
      expect(setHeaderSpy).toHaveBeenCalledWith("X-Request-Id", req.id);
      expect(next).toHaveBeenCalled();
    });
  });
});
