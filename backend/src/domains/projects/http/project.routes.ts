import { Router } from "express";
import { z } from "zod";
import {
  ImportProjectsRequestSchema,
  ReplaceProjectsRequestSchema,
} from "@charan-interiors/contracts";
import { validateBody } from "../../../platform/http/middleware/validate.js";
import { asyncHandler } from "../../../platform/http/middleware/asyncHandler.js";
import { importProjects, listProjects, replaceProjects } from "./project.controller.js";

export const projectRouter = Router();
const ProjectSnapshotReferenceSchema = z.object({
  snapshotPath: z.string().trim().min(1).max(500),
});

projectRouter.get("/", asyncHandler(listProjects));
projectRouter.put(
  "/",
  validateBody(z.union([ReplaceProjectsRequestSchema, ProjectSnapshotReferenceSchema])),
  asyncHandler(replaceProjects)
);
projectRouter.post(
  "/import",
  validateBody(z.union([ImportProjectsRequestSchema, ProjectSnapshotReferenceSchema])),
  asyncHandler(importProjects)
);
