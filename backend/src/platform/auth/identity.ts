import type { Request } from "express";

export interface RequestIdentity {
  userId: string;
  orgId: string | null;
  role: "user" | "admin";
}

export function getRequestIdentity(req: Request): RequestIdentity {
  if (process.env["NODE_ENV"] === "production") {
    const principal = req.principal;
    if (!principal?.uid) throw new Error("An authenticated Firebase identity is required.");
    return {
      userId: principal.uid,
      orgId: principal.orgId || null,
      role: principal.role === "admin" ? "admin" : "user",
    };
  }

  // Development & testing identity resolution
  const userId =
    (req.headers["x-user-id"] as string) ||
    process.env["DEV_USER_ID"] ||
    req.principal?.uid ||
    "dev-user";

  const orgId =
    (req.headers["x-org-id"] as string) ||
    process.env["DEV_ORG_ID"] ||
    null;

  let role: "user" | "admin" = (process.env["DEV_ROLE"] as "user" | "admin") || "user";
  if (req.headers["x-is-admin"] === "true" || req.headers["x-role"] === "admin") {
    role = "admin";
  } else if (req.headers["x-is-admin"] === "false" || req.headers["x-role"] === "user") {
    role = "user";
  }

  return { userId, orgId, role };
}
