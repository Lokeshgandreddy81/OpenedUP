import express, { type Express } from "express";
import { requestLogger } from "./middleware/requestLogger.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { healthRouter } from "./routes/health.ts";
import { workspaceRouter } from "./routes/workspace.ts";
import { chatRouter } from "./routes/chat.ts";
import { receiptsRouter } from "./routes/receipts.ts";
import { pdfRouter } from "./routes/pdf.ts";

export function createApp(): Express {
  const app = express();

  // Support batches and large PDFs up to 100MB payload
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ extended: true, limit: "100mb" }));

  // Structured HTTP request logger
  app.use(requestLogger);

  // Mount API routers
  app.use(healthRouter);
  app.use(workspaceRouter);
  app.use(chatRouter);
  app.use(receiptsRouter);
  app.use(pdfRouter);

  // Global centralized error handler
  app.use(errorHandler);

  return app;
}
