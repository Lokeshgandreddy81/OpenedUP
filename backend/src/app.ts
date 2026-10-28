import express, { type Express } from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { requestIdMiddleware } from "./platform/http/middleware/requestId.js";
import { requestLogger } from "./platform/http/middleware/requestLogger.js";
import { errorHandler } from "./platform/http/middleware/errorHandler.js";
import { healthRouter } from "./platform/health/http/health.routes.js";
import { authRouter } from "./domains/identity/http/auth.routes.js";
import { analyticsRouter } from "./domains/receipts/http/analytics.routes.js";
import { pdfRouter } from "./domains/documents/http/pdf.routes.js";
import { chatRouter } from "./domains/chat/http/chat.routes.js";
import { benchmarksRouter } from "./domains/benchmarks/http/benchmarks.routes.js";
import { attachOptionalSupabaseUser, requireSupabaseUser } from "./platform/auth/supabaseAuth.js";
import { conversationRouter } from "./domains/conversations/http/conversation.routes.js";
import { artifactRouter } from "./domains/artifacts/http/artifact.routes.js";
import { credentialRouter } from "./domains/credentials/http/credential.routes.js";
import { projectRouter } from "./domains/projects/http/project.routes.js";
import { scheduledTaskRouter } from "./domains/scheduled/http/scheduledTask.routes.js";
import { skillRouter } from "./domains/skills/http/skill.routes.js";
import { seedBuiltinSkills } from "./domains/skills/application/seedBuiltinSkills.js";
import { uploadRouter } from "./platform/storage/upload.routes.js";

export function createApp(): Express {
  // Seed builtin skills if not already present
  try {
    seedBuiltinSkills();
  } catch {
    // Non-fatal if seeding runs in restricted test sandbox
  }

  const app = express();
  app.disable("x-powered-by");

  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  // File bytes go directly to Supabase Storage. Keep API payloads below Vercel's
  // function request limit and send only metadata/storage paths through Express.
  app.use(express.json({ limit: "4mb" }));
  app.use(express.urlencoded({ extended: true, limit: "4mb" }));

  // Observability & logging middleware
  app.use(requestIdMiddleware);
  app.use(requestLogger);

  // Health check routes at root
  app.use(healthRouter);

  // API domain routes
  if (process.env["NODE_ENV"] === "production") {
    app.use("/api", requireSupabaseUser);
  } else {
    app.use("/api", attachOptionalSupabaseUser);
  }
  app.use("/api", authRouter);
  app.use("/api", uploadRouter);
  app.use("/api", analyticsRouter);
  app.use("/api", pdfRouter);
  app.use("/api", chatRouter);
  app.use("/api", benchmarksRouter);
  app.use("/api", skillRouter);
  app.use("/api/scheduled-tasks", scheduledTaskRouter);
  app.use("/api/conversations", requireSupabaseUser, conversationRouter);
  app.use("/api/artifacts", requireSupabaseUser, artifactRouter);
  app.use("/api/credentials", requireSupabaseUser, credentialRouter);
  app.use("/api/projects", requireSupabaseUser, projectRouter);

  // Serve built frontend (if present) for production/E2E
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const frontendDist = path.resolve(__dirname, "..", "..", "frontend", "dist");
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get("*", (req, res, next) => {
      if (
        req.path.startsWith("/api") ||
        req.path === "/healthz" ||
        req.path.startsWith("/assets/") ||
        Boolean(path.extname(req.path))
      ) {
        return next();
      }
      res.sendFile(path.join(frontendDist, "index.html"));
    });
  }

  // 404 Handler for undefined routes
  app.use((req, res) => {
    res.status(404).json({
      error: `Route not found: ${req.method} ${req.originalUrl}`,
      requestId: req.id,
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
