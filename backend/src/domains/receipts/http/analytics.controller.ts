import fs from "node:fs";
import type { Request, Response, NextFunction } from "express";
import type { ReadReceiptsRequest, CheckDuplicatesRequest } from "@charan-interiors/contracts";
import { checkDuplicates } from "../application/duplicate.service.js";
import { readReceipts } from "../application/receipt.service.js";
import { LOG_FILE } from "../../../platform/observability/logger.js";

export async function handleReadReceipts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const payload = req.body as ReadReceiptsRequest;
    const result = await readReceipts(payload.photos);
    res.json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function handleCheckDuplicates(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const payload = req.body as CheckDuplicatesRequest;
    const result = await checkDuplicates(payload.rows);
    res.json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export function handleGetLogs(_req: Request, res: Response): void {
  try {
    const content = fs.existsSync(LOG_FILE) ? fs.readFileSync(LOG_FILE, "utf8") : "No logs yet.";
    res.type("text/plain").send(content);
  } catch (err: unknown) {
    res.status(500).send(String(err));
  }
}
