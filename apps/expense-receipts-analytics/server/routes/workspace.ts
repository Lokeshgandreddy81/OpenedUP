import { Router } from "express";
import fs from "fs";
import path from "path";
import { readDevEnvJson, isValidApiKey } from "../config.ts";
import { getRecentLogs } from "../logger.ts";

export const workspaceRouter = Router();

workspaceRouter.get("/api/workspace-config", (_req, res) => {
  const devEnv = readDevEnvJson();
  let firebaseConfig: Record<string, unknown> | null = null;
  const configCandidates = [
    path.join(process.cwd(), "firebase-applet-config.json"),
    path.join(import.meta.dirname, "..", "firebase-applet-config.json"),
    path.join(import.meta.dirname, "../..", "firebase-applet-config.json"),
  ];
  for (const candidatePath of configCandidates) {
    try {
      if (fs.existsSync(candidatePath)) {
        const parsed = JSON.parse(fs.readFileSync(candidatePath, "utf8")) as Record<
          string,
          unknown
        >;
        if (parsed && typeof parsed === "object") {
          const apiKey = typeof parsed.apiKey === "string" ? parsed.apiKey.trim() : "";
          const authDomain = typeof parsed.authDomain === "string" ? parsed.authDomain.trim() : "";
          const projectId = typeof parsed.projectId === "string" ? parsed.projectId.trim() : "";
          const isValidFb =
            apiKey.length > 0 &&
            isValidApiKey(apiKey) &&
            !apiKey.includes("remixed-") &&
            authDomain.length > 0 &&
            !authDomain.includes("remixed-") &&
            !projectId.includes("remixed-");
          if (isValidFb) {
            firebaseConfig = parsed;
            break;
          }
        }
      }
    } catch {
      // ignore unreadable firebase-applet-config.json
    }
  }

  const rawFbClientId =
    (typeof firebaseConfig?.oAuthClientId === "string"
      ? (firebaseConfig.oAuthClientId as string).trim()
      : null) ||
    (typeof firebaseConfig?.oauthClientId === "string"
      ? (firebaseConfig.oauthClientId as string).trim()
      : null);
  const fbClientId =
    rawFbClientId && isValidApiKey(rawFbClientId) && !rawFbClientId.includes("remixed-")
      ? rawFbClientId
      : null;

  const rawId =
    process.env.GOOGLE_CLIENT_ID ||
    process.env.VITE_GOOGLE_CLIENT_ID ||
    (typeof devEnv.GOOGLE_CLIENT_ID === "string" ? devEnv.GOOGLE_CLIENT_ID : null) ||
    (typeof devEnv.VITE_GOOGLE_CLIENT_ID === "string" ? devEnv.VITE_GOOGLE_CLIENT_ID : null) ||
    fbClientId;

  const cleanId =
    rawId && isValidApiKey(rawId.trim()) && !rawId.trim().includes("remixed-")
      ? rawId.trim()
      : null;

  res.json({
    firebaseConfig,
    googleClientId: cleanId,
  });
});

workspaceRouter.get("/api/logs", (_req, res) => {
  try {
    const content = getRecentLogs();
    res.type("text/plain").send(content);
  } catch (e) {
    res.status(500).send(String(e));
  }
});
