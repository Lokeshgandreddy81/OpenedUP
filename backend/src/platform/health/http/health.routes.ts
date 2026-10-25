import { Router } from "express";
import { getHealthz, getReadyz } from "./health.controller.js";

export const healthRouter = Router();

healthRouter.get("/healthz", getHealthz);
healthRouter.get("/health", getHealthz);
healthRouter.get("/api/health", getHealthz);
healthRouter.get("/readyz", getReadyz);
healthRouter.get("/api/readyz", getReadyz);
