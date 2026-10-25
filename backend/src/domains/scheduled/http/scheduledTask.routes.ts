import { Router } from "express";
import {
  ImportScheduledTasksRequestSchema,
  ScheduledTaskInputSchema,
  UpdateScheduledTaskRequestSchema,
} from "@charan-interiors/contracts";
import { validateBody } from "../../../platform/http/middleware/validate.js";
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
scheduledTaskRouter.get("/", listScheduledTasks);
scheduledTaskRouter.post("/", validateBody(ScheduledTaskInputSchema), createScheduledTask);
scheduledTaskRouter.post(
  "/import",
  validateBody(ImportScheduledTasksRequestSchema),
  importScheduledTasks
);
scheduledTaskRouter.get("/runs/:runId", getScheduledTaskRun);
scheduledTaskRouter.get("/:id/runs", listScheduledTaskRuns);
scheduledTaskRouter.post("/:id/run", queueScheduledTaskRun);
scheduledTaskRouter.put(
  "/:id",
  validateBody(UpdateScheduledTaskRequestSchema),
  updateScheduledTask
);
scheduledTaskRouter.delete("/:id", deleteScheduledTask);
