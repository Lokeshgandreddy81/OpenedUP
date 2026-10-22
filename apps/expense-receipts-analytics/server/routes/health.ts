import { Router } from "express";
import { getActiveModelId } from "../services/geminiService.ts";

export const healthRouter = Router();

const startTime = Date.now();

healthRouter.get("/healthz", (_req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  res.status(200).json({
    status: "ok",
    uptime: `${uptimeSeconds}s`,
    timestamp: new Date().toISOString(),
    activeModel: getActiveModelId(),
    service: "@charan-interiors/expense-receipts-analytics",
    version: "0.1.0",
  });
});
