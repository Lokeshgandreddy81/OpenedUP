import { Router } from "express";
import {
  ImportScheduledTasksRequestSchema,
  ScheduledTaskInputSchema,
  UpdateScheduledTaskRequestSchema,
} from "@charan-interiors/contracts";
import { validateBody } from "../../../platform/http/middleware/validate.js";
import { asyncHandler } from "../../../platform/http/middleware/asyncHandler.js";
import {
  createScheduledTask,
  deleteScheduledTask,
  getScheduledTaskRun,
  importScheduledTasks,
  listScheduledTaskRuns,
  listScheduledTasks,
  queueScheduledTaskRun,
  updateScheduledTask,
} from "./scheduledTask.controller.js";

export const scheduledTaskRouter = Router();
scheduledTaskRouter.get("/", asyncHandler(listScheduledTasks));
scheduledTaskRouter.post("/", validateBody(ScheduledTaskInputSchema), asyncHandler(createScheduledTask));
scheduledTaskRouter.post(
  "/import",
  validateBody(ImportScheduledTasksRequestSchema),
  asyncHandler(importScheduledTasks)
);
scheduledTaskRouter.get("/runs/:runId", asyncHandler(getScheduledTaskRun));
scheduledTaskRouter.get("/:id/runs", asyncHandler(listScheduledTaskRuns));
scheduledTaskRouter.post("/:id/run", asyncHandler(queueScheduledTaskRun));
scheduledTaskRouter.put(
  "/:id",
  validateBody(UpdateScheduledTaskRequestSchema),
  asyncHandler(updateScheduledTask)
);
scheduledTaskRouter.delete("/:id", asyncHandler(deleteScheduledTask));
