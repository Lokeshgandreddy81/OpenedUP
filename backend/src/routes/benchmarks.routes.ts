import { Router } from "express";
import { getBenchmarkOverview } from "../controllers/benchmarks.controller.js";

export const benchmarksRouter = Router();

benchmarksRouter.get("/benchmarks", getBenchmarkOverview);
