import type { Request, Response, NextFunction } from "express";
import type { ZodSchema, ZodError } from "zod";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const err = result.error as ZodError;
      res.status(400).json({
        error: "Validation failed",
        details: err.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
        requestId: req.id,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const err = result.error as ZodError;
      res.status(400).json({
        error: "Invalid query parameters",
        details: err.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
        requestId: req.id,
      });
      return;
    }
    req.query = result.data as Record<string, unknown> as typeof req.query;
    next();
  };
}
