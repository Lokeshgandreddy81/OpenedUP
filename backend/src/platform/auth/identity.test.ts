import assert from "node:assert/strict";
import test from "node:test";
import type { Request } from "express";
import { getRequestIdentity } from "./identity.js";

test("production request identity comes only from the verified Firebase principal", () => {
  const previousNodeEnv = process.env["NODE_ENV"];
  process.env["NODE_ENV"] = "production";
  try {
    const request = {
      headers: {
        "x-user-id": "attacker-user",
        "x-org-id": "attacker-org",
        "x-role": "admin",
      },
      principal: { uid: "firebase-user", orgId: "trusted-org", role: "user" as const },
    } as unknown as Request;

    assert.deepEqual(getRequestIdentity(request), {
      userId: "firebase-user",
      orgId: "trusted-org",
      role: "user",
    });
  } finally {
    if (previousNodeEnv === undefined) delete process.env["NODE_ENV"];
    else process.env["NODE_ENV"] = previousNodeEnv;
  }
});

test("production request identity refuses missing Firebase authentication", () => {
  const previousNodeEnv = process.env["NODE_ENV"];
  process.env["NODE_ENV"] = "production";
  try {
    assert.throws(
      () => getRequestIdentity({ headers: { "x-user-id": "attacker" } } as unknown as Request),
      /authenticated firebase identity is required/i
    );
  } finally {
    if (previousNodeEnv === undefined) delete process.env["NODE_ENV"];
    else process.env["NODE_ENV"] = previousNodeEnv;
  }
});
