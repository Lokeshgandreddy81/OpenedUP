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
import { asyncHandler } from "../../../platform/http/middleware/asyncHandler.js";

export const analyticsRouter = Router();

analyticsRouter.post("/read-receipts", validateBody(ReadReceiptsRequestSchema), asyncHandler(handleReadReceipts));

analyticsRouter.post(
  "/check-duplicates",
  validateBody(CheckDuplicatesRequestSchema),
  asyncHandler(handleCheckDuplicates)
);

analyticsRouter.get("/logs", handleGetLogs);
