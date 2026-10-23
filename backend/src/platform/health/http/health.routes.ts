import { Router } from "express";
import { getHealthz, getReadyz } from "./health.controller.js";

export const healthRouter = Router();

healthRouter.get("/healthz", getHealthz);
healthRouter.get("/readyz", getReadyz);
