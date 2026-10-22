import { Router } from "express";
import { getHealthz, getReadyz } from "../controllers/health.controller.js";

export const healthRouter = Router();

healthRouter.get("/healthz", getHealthz);
healthRouter.get("/readyz", getReadyz);
