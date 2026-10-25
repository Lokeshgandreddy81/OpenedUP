import type { NextFunction, Request, Response } from "express";
import type {
  ImportScheduledTasksRequest,
  ScheduledTaskInput,
  UpdateScheduledTaskRequest,
} from "@charan-interiors/contracts";
import { ScheduledTaskService } from "../application/scheduledTaskService.js";
import { sanitizeApiKey, sanitizeBaseUrl } from "../../../platform/config/index.js";
import { redactSecretsString } from "../../../platform/observability/logger.js";

const scheduledTasks = new ScheduledTaskService();
export const DEFAULT_USER_ID = "default";

function getUserId(req: Request): string {
  return req.principal?.uid || DEFAULT_USER_ID;
}

function handleKnownRequestError(error: unknown, req: Request, res: Response, next: NextFunction) {
  if (error instanceof Error && error.message.startsWith("UNKNOWN_MODEL:")) {
    res.status(400).json({ error: redactSecretsString(error.message), requestId: req.id });
    return;
  }
  next(error);
}

function extractHeaderCredential(req: Request): {
  headerApiKey: string | undefined;
  headerBaseUrl: string | undefined;
} {
  const rawKey = Array.isArray(req.headers["x-provider-key"])
    ? req.headers["x-provider-key"][0]
    : req.headers["x-provider-key"];
  const headerApiKey = sanitizeApiKey(rawKey);

  const rawUrl = Array.isArray(req.headers["x-provider-base-url"])
    ? req.headers["x-provider-base-url"][0]
    : req.headers["x-provider-base-url"];
  const headerBaseUrl = sanitizeBaseUrl(rawUrl);

  return { headerApiKey, headerBaseUrl };
}

export function listScheduledTasks(req: Request, res: Response): void {
  res.json({ tasks: scheduledTasks.list(getUserId(req)) });
}

export function createScheduledTask(req: Request, res: Response, next: NextFunction): void {
  try {
    const { headerBaseUrl } = extractHeaderCredential(req);
    const task = scheduledTasks.create(
      getUserId(req),
      req.body as ScheduledTaskInput,
      headerBaseUrl
    );
    res.status(201).json({ task });
  } catch (error) {
    handleKnownRequestError(error, req, res, next);
  }
}

export function updateScheduledTask(req: Request, res: Response, next: NextFunction): void {
  try {
    const { headerBaseUrl } = extractHeaderCredential(req);
    const task = scheduledTasks.update(
      getUserId(req),
      req.params["id"]!,
      req.body as UpdateScheduledTaskRequest,
      headerBaseUrl
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
  const { headerApiKey, headerBaseUrl } = extractHeaderCredential(req);

  try {
    const run = scheduledTasks.runNow(
      getUserId(req),
      req.params["id"]!,
      headerApiKey || headerBaseUrl
        ? {
            ...(headerApiKey ? { apiKey: headerApiKey } : {}),
            ...(headerBaseUrl ? { baseUrl: headerBaseUrl } : {}),
          }
        : undefined
    );
    if (!run) {
      res.status(404).json({ error: "Scheduled task not found.", requestId: req.id });
      return;
    }
    // Instantly trigger execution in the background so the user gets near-immediate results
    void scheduledTasks.executeNext().catch(() => {});
    res.status(202).json({ run });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Scheduled task execution failed.";
    const safeMessage = redactSecretsString(rawMessage);
    if (safeMessage.startsWith("MISSING_API_KEY:")) {
      res.status(401).json({ error: safeMessage, requestId: req.id });
      return;
    }
    res.status(400).json({ error: safeMessage, requestId: req.id });
  }
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
