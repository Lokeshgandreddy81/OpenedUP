import type { Request, Response } from "express";
import { resolveFirebaseConfig } from "../../../platform/config/index.js";

export function getWorkspaceConfig(_req: Request, res: Response): void {
  const config = resolveFirebaseConfig();
  res.json(config);
}
