import { Router } from "express";
import { ReadReceiptsRequestSchema, CheckDuplicatesRequestSchema } from "@charan-interiors/shared";
import {
  handleReadReceipts,
  handleCheckDuplicates,
  handleGetLogs,
} from "../controllers/analytics.controller.js";
import { validateBody } from "../middleware/validate.js";

export const analyticsRouter = Router();

analyticsRouter.post("/read-receipts", validateBody(ReadReceiptsRequestSchema), handleReadReceipts);

analyticsRouter.post(
  "/check-duplicates",
  validateBody(CheckDuplicatesRequestSchema),
  handleCheckDuplicates
);

analyticsRouter.get("/logs", handleGetLogs);
