import express, { type Express } from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { healthRouter } from "./routes/health.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { analyticsRouter } from "./routes/analytics.routes.js";
import { pdfRouter } from "./routes/pdf.routes.js";
import { chatRouter } from "./routes/chat.routes.js";
import { benchmarksRouter } from "./routes/benchmarks.routes.js";

export function createApp(): Express {
  const app = express();

  // Support batches and large PDFs up to 100MB payload
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ extended: true, limit: "100mb" }));

  // Observability & logging middleware
  app.use(requestIdMiddleware);
  app.use(requestLogger);

  // Health check routes at root
  app.use(healthRouter);

  // API domain routes
  app.use("/api", authRouter);
  app.use("/api", analyticsRouter);
  app.use("/api", pdfRouter);
  app.use("/api", chatRouter);
  app.use("/api", benchmarksRouter);

  // Serve built frontend (if present) for production/E2E
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const frontendDist = path.resolve(__dirname, "..", "..", "frontend", "dist");
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api") || req.path === "/healthz") return next();
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
