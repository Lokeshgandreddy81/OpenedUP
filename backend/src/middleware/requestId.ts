/* eslint-disable @typescript-eslint/no-namespace */
import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const headerId = req.header("x-request-id");
  const id = (Array.isArray(headerId) ? headerId[0] : headerId) || crypto.randomUUID();
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
}
