import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../logger.ts";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    logger.warn(
      {
        path: req.path,
        validationErrors: err.errors,
      },
      "Request validation failed"
    );
    res.status(400).json({
      error: "Validation error",
      details: err.errors,
    });
    return;
  }

  const message = err instanceof Error ? err.message : "Internal Server Error";

  logger.error(
    {
      path: req.path,
      error: message,
      stack: err instanceof Error ? err.stack : undefined,
    },
    "Unhandled server error"
  );

  res.status(500).json({
    error: message,
  });
}
