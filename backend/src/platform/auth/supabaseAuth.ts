import type { NextFunction, Request, Response } from "express";
import { resolveSupabaseConfig } from "../config/index.js";

export interface Principal {
  uid: string;
  email?: string;
  role?: "user" | "admin";
  orgId?: string;
}

interface SupabaseUser {
  id?: unknown;
  email?: unknown;
  email_confirmed_at?: unknown;
  app_metadata?: unknown;
}

export class SupabaseAuthUnavailableError extends Error {
  constructor(message = "Supabase Auth is unavailable.") {
    super(message);
    this.name = "SupabaseAuthUnavailableError";
  }
}

export class InvalidSupabaseAccessTokenError extends Error {
  constructor(message = "Supabase access token is invalid or the email is unverified.") {
    super(message);
    this.name = "InvalidSupabaseAccessTokenError";
  }
}

export async function verifySupabaseAccessToken(
  token: string,
  dependencies: {
    url?: string | null;
    publishableKey?: string | null;
    fetcher?: typeof fetch;
  } = {}
): Promise<Principal> {
  const config = resolveSupabaseConfig();
  const url = dependencies.url ?? config.url;
  const publishableKey = dependencies.publishableKey ?? config.publishableKey;
  if (!url || !publishableKey) {
    throw new SupabaseAuthUnavailableError("Supabase URL and publishable key are not configured.");
  }

  let response: globalThis.Response;
  try {
    response = await (dependencies.fetcher ?? fetch)(`${url}/auth/v1/user`, {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new SupabaseAuthUnavailableError();
  }

  if (response.status === 401 || response.status === 403) {
    throw new InvalidSupabaseAccessTokenError();
  }
  if (!response.ok) throw new SupabaseAuthUnavailableError();

  let user: SupabaseUser;
  try {
    user = (await response.json()) as SupabaseUser;
  } catch {
    throw new SupabaseAuthUnavailableError("Supabase Auth returned an invalid response.");
  }

  if (
    typeof user.id !== "string" ||
    !user.id ||
    user.id.length > 128 ||
    typeof user.email_confirmed_at !== "string" ||
    !user.email_confirmed_at
  ) {
    throw new InvalidSupabaseAccessTokenError();
  }

  const appMetadata =
    user.app_metadata && typeof user.app_metadata === "object"
      ? (user.app_metadata as Record<string, unknown>)
      : {};
  const orgId = appMetadata["orgId"] ?? appMetadata["org_id"];

  return {
    uid: user.id,
    ...(typeof user.email === "string" ? { email: user.email } : {}),
    ...(appMetadata["role"] === "admin" || appMetadata["role"] === "user"
      ? { role: appMetadata["role"] }
      : {}),
    ...(typeof orgId === "string" && orgId.length <= 128 ? { orgId } : {}),
  };
}

function authorizationToken(req: Request): string {
  const authorization = req.headers.authorization;
  return authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

function replyAuthFailure(error: unknown, req: Request, res: Response): void {
  if (error instanceof SupabaseAuthUnavailableError) {
    res.status(503).json({
      error: "Authentication service is temporarily unavailable.",
      requestId: req.id,
    });
    return;
  }
  res.setHeader("WWW-Authenticate", 'Bearer error="invalid_token"');
  res.status(401).json({
    error: "Your sign-in has expired or your email is not verified. Please sign in again.",
    requestId: req.id,
  });
}

export async function requireSupabaseUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (req.principal?.uid) {
    next();
    return;
  }
  const token = authorizationToken(req);
  if (!token) {
    res.setHeader("WWW-Authenticate", "Bearer");
    res.status(401).json({ error: "Sign in to access this resource.", requestId: req.id });
    return;
  }
  try {
    req.principal = await verifySupabaseAccessToken(token);
    next();
  } catch (error) {
    replyAuthFailure(error, req, res);
  }
}

export async function attachOptionalSupabaseUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = authorizationToken(req);
  if (!token) {
    next();
    return;
  }
  try {
    req.principal = await verifySupabaseAccessToken(token);
    next();
  } catch (error) {
    replyAuthFailure(error, req, res);
  }
}
