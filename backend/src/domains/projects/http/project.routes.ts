import { Router } from "express";
import {
  ImportProjectsRequestSchema,
  ReplaceProjectsRequestSchema,
} from "@charan-interiors/contracts";
import { validateBody } from "../../../platform/http/middleware/validate.js";
import {
  importProjects,
  listProjects,
  replaceProjects,
} from "./project.controller.js";

export const projectRouter = Router();
projectRouter.get("/", listProjects);
projectRouter.put("/", validateBody(ReplaceProjectsRequestSchema), replaceProjects);
projectRouter.post("/import", validateBody(ImportProjectsRequestSchema), importProjects);
