import { Router } from "express";
import {
  ReadReceiptsRequestSchema,
  CheckDuplicatesRequestSchema,
} from "@charan-interiors/contracts";
import {
  handleReadReceipts,
  handleCheckDuplicates,
  handleGetLogs,
} from "./analytics.controller.js";
import { validateBody } from "../../../platform/http/middleware/validate.js";

export const analyticsRouter = Router();

analyticsRouter.post("/read-receipts", validateBody(ReadReceiptsRequestSchema), handleReadReceipts);

analyticsRouter.post(
  "/check-duplicates",
  validateBody(CheckDuplicatesRequestSchema),
  handleCheckDuplicates
);

analyticsRouter.get("/logs", handleGetLogs);
