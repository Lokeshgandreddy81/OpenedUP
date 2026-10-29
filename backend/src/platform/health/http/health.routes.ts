import { Router } from "express";
import { getHealthz, getReadyz } from "./health.controller.js";
import { asyncHandler } from "../../http/middleware/asyncHandler.js";

export const healthRouter = Router();

healthRouter.get("/healthz", getHealthz);
healthRouter.get("/health", getHealthz);
healthRouter.get("/api/health", getHealthz);
healthRouter.get("/readyz", asyncHandler(getReadyz));
healthRouter.get("/api/readyz", asyncHandler(getReadyz));
