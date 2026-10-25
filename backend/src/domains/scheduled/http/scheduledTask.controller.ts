import type { NextFunction, Request, Response } from "express";
import type {
  ImportScheduledTasksRequest,
  ScheduledTaskInput,
  UpdateScheduledTaskRequest,
} from "@charan-interiors/contracts";
import { ScheduledTaskService } from "../application/scheduledTaskService.js";

const scheduledTasks = new ScheduledTaskService();
export const DEFAULT_USER_ID = "default";

function getUserId(req: Request): string {
  return req.principal?.uid || DEFAULT_USER_ID;
}

function handleKnownRequestError(error: unknown, req: Request, res: Response, next: NextFunction) {
  if (error instanceof Error && error.message.startsWith("UNKNOWN_MODEL:")) {
    res.status(400).json({ error: error.message, requestId: req.id });
    return;
  }
  next(error);
}

export function listScheduledTasks(req: Request, res: Response): void {
  res.json({ tasks: scheduledTasks.list(getUserId(req)) });
}

export function createScheduledTask(req: Request, res: Response, next: NextFunction): void {
  try {
    const task = scheduledTasks.create(getUserId(req), req.body as ScheduledTaskInput);
    res.status(201).json({ task });
  } catch (error) {
    handleKnownRequestError(error, req, res, next);
  }
}

export function updateScheduledTask(req: Request, res: Response, next: NextFunction): void {
  try {
    const task = scheduledTasks.update(
      getUserId(req),
      req.params["id"]!,
      req.body as UpdateScheduledTaskRequest
    );
    if (!task) {
      res.status(404).json({ error: "Scheduled task not found.", requestId: req.id });
      return;
    }
    res.json({ task });
  } catch (error) {
    handleKnownRequestError(error, req, res, next);
  }
}

export function deleteScheduledTask(req: Request, res: Response): void {
  if (!scheduledTasks.delete(getUserId(req), req.params["id"]!)) {
    res.status(404).json({ error: "Scheduled task not found.", requestId: req.id });
    return;
  }
  res.status(204).end();
}

export function importScheduledTasks(req: Request, res: Response, next: NextFunction): void {
  try {
    res.json(scheduledTasks.import(getUserId(req), req.body as ImportScheduledTasksRequest));
  } catch (error) {
    handleKnownRequestError(error, req, res, next);
  }
}

export function queueScheduledTaskRun(req: Request, res: Response): void {
  const headerKey =
    typeof req.headers["x-provider-key"] === "string" ? req.headers["x-provider-key"] : undefined;
  const headerBaseUrl =
    typeof req.headers["x-provider-base-url"] === "string"
      ? req.headers["x-provider-base-url"]
      : undefined;
  const run = scheduledTasks.runNow(
    getUserId(req),
    req.params["id"]!,
    headerKey
      ? { apiKey: headerKey, ...(headerBaseUrl ? { baseUrl: headerBaseUrl } : {}) }
      : undefined
  );
  if (!run) {
    res.status(404).json({ error: "Scheduled task not found.", requestId: req.id });
    return;
  }
  // Instantly trigger execution in the background so the user gets near-immediate results
  void scheduledTasks.executeNext().catch(() => {});
  res.status(202).json({ run });
}

export function getScheduledTaskRun(req: Request, res: Response): void {
  const run = scheduledTasks.getRun(getUserId(req), req.params["runId"]!);
  if (!run) {
    res.status(404).json({ error: "Scheduled task run not found.", requestId: req.id });
    return;
  }
  res.json({ run });
}

export function listScheduledTaskRuns(req: Request, res: Response): void {
  const runs = scheduledTasks.listRuns(getUserId(req), req.params["id"]!);
  if (!runs) {
    res.status(404).json({ error: "Scheduled task not found.", requestId: req.id });
    return;
  }
  res.json({ runs });
}

export { scheduledTasks as scheduledTaskService };
