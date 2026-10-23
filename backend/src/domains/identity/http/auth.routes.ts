import { Router } from "express";
import { getWorkspaceConfig } from "./auth.controller.js";

export const authRouter = Router();

authRouter.get("/workspace-config", getWorkspaceConfig);
