import type { Request, Response } from "express";
import { resolveGoogleClientId } from "../../../platform/config/index.js";

export function getWorkspaceConfig(_req: Request, res: Response): void {
  res.json({ googleClientId: resolveGoogleClientId() });
}
