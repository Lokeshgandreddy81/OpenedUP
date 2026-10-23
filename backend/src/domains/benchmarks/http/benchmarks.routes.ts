import { Router } from "express";
import { getBenchmarkOverview } from "./benchmarks.controller.js";

export const benchmarksRouter = Router();

benchmarksRouter.get("/benchmarks", getBenchmarkOverview);
