import { Router } from "express";
import {
  ImportProjectsRequestSchema,
  ReplaceProjectsRequestSchema,
} from "@charan-interiors/contracts";
import { validateBody } from "../../../platform/http/middleware/validate.js";
import { asyncHandler } from "../../../platform/http/middleware/asyncHandler.js";
import { importProjects, listProjects, replaceProjects } from "./project.controller.js";

export const projectRouter = Router();
projectRouter.get("/", asyncHandler(listProjects));
projectRouter.put("/", validateBody(ReplaceProjectsRequestSchema), asyncHandler(replaceProjects));
projectRouter.post("/import", validateBody(ImportProjectsRequestSchema), asyncHandler(importProjects));
