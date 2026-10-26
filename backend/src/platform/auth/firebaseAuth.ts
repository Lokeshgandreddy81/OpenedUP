import { createPublicKey, verify as verifySignature } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { resolveFirebaseProjectId } from "../config/index.js";

export interface Principal {
  uid: string;
  email?: string;
  role?: "user" | "admin";
  orgId?: string;
}

interface FirebaseIdTokenClaims {
  aud: unknown;
  auth_time: unknown;
  exp: unknown;
  iat: unknown;
  iss: unknown;
  sub: unknown;
  email?: unknown;
  role?: unknown;
  orgId?: unknown;
}

interface FirebaseIdTokenHeader {
  alg?: unknown;
  kid?: unknown;
}

const CERTIFICATE_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
let certificateCache: { certificates: Record<string, string>; expiresAt: number } | null = null;

function decodeJsonPart<T>(part: string): T {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as T;
}

async function getFirebaseCertificates(): Promise<Record<string, string>> {
  if (certificateCache && certificateCache.expiresAt > Date.now()) {
    return certificateCache.certificates;
  }
  const response = await fetch(CERTIFICATE_URL, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error("Firebase signing certificates are unavailable.");
  const certificates = (await response.json()) as Record<string, string>;
  const cacheControl = response.headers.get("cache-control") || "";
  const maxAge = Number(cacheControl.match(/max-age=(\d+)/i)?.[1] || 3600);
  certificateCache = {
    certificates,
    expiresAt: Date.now() + Math.max(60, maxAge) * 1000,
  };
  return certificates;
}

export async function verifyFirebaseIdToken(
  token: string,
  dependencies: {
    projectId?: string | undefined;
    certificates?: (() => Promise<Record<string, string>>) | undefined;
    nowSeconds?: number | undefined;
  } = {}
): Promise<Principal> {
  const projectId = dependencies.projectId || resolveFirebaseProjectId();
  if (!projectId) throw new Error("Firebase project ID is not configured.");

  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((part) => !part)) throw new Error("Malformed token.");
  const header = decodeJsonPart<FirebaseIdTokenHeader>(parts[0]!);
  const claims = decodeJsonPart<FirebaseIdTokenClaims>(parts[1]!);
  if (header.alg !== "RS256" || typeof header.kid !== "string") {
    throw new Error("Unsupported Firebase token signature.");
  }

  const certificates = await (dependencies.certificates || getFirebaseCertificates)();
  const certificate = certificates[header.kid];
  if (!certificate) throw new Error("Unknown Firebase signing key.");
  const signingInput = Buffer.from(`${parts[0]}.${parts[1]}`);
  const signature = Buffer.from(parts[2]!, "base64url");
  const validSignature = verifySignature(
    "RSA-SHA256",
    signingInput,
    createPublicKey(certificate),
    signature
  );
  if (!validSignature) throw new Error("Invalid Firebase token signature.");

  const now = dependencies.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (
    claims.aud !== projectId ||
    claims.iss !== `https://securetoken.google.com/${projectId}` ||
    typeof claims.sub !== "string" ||
    claims.sub.length === 0 ||
    claims.sub.length > 128 ||
    typeof claims.exp !== "number" ||
    claims.exp <= now - 60 ||
    typeof claims.iat !== "number" ||
    claims.iat > now + 60 ||
    typeof claims.auth_time !== "number" ||
    claims.auth_time > now + 60
  ) {
    throw new Error("Firebase token claims are invalid.");
  }

  return {
    uid: claims.sub,
    ...(typeof claims.email === "string" ? { email: claims.email } : {}),
    ...(claims.role === "admin" || claims.role === "user" ? { role: claims.role } : {}),
    ...(typeof claims.orgId === "string" && claims.orgId.length <= 128
      ? { orgId: claims.orgId }
      : {}),
  };
}

export async function requireFirebaseUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) {
    res.setHeader("WWW-Authenticate", "Bearer");
    res.status(401).json({ error: "Sign in to access this resource.", requestId: req.id });
    return;
  }
  try {
    req.principal = await verifyFirebaseIdToken(token);
    next();
  } catch {
    res.setHeader("WWW-Authenticate", 'Bearer error="invalid_token"');
    res
      .status(401)
      .json({ error: "Your sign-in has expired. Please sign in again.", requestId: req.id });
  }
}

export async function attachOptionalFirebaseUser(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) {
    next();
    return;
  }
  try {
    req.principal = await verifyFirebaseIdToken(token);
    next();
  } catch {
    _res
      .status(401)
      .json({ error: "Your sign-in has expired. Please sign in again.", requestId: req.id });
  }
}
