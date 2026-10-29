import { Router } from "express";
import {
  ArtifactRequestSchema,
  ArtifactOrganizationRequestSchema,
  ImportArtifactsRequestSchema,
  SetArtifactSharingRequestSchema,
} from "@charan-interiors/contracts";
import { validateBody } from "../../../platform/http/middleware/validate.js";
import { asyncHandler } from "../../../platform/http/middleware/asyncHandler.js";
import {
  createArtifact,
  deleteArtifact,
  importArtifacts,
  listArtifacts,
  setArtifactShared,
  updateArtifact,
  updateArtifactOrganization,
  listArtifactVersions,
} from "./artifact.controller.js";

export const artifactRouter = Router();
artifactRouter.get("/", asyncHandler(listArtifacts));
artifactRouter.post("/", validateBody(ArtifactRequestSchema), asyncHandler(createArtifact));
artifactRouter.put("/:id", validateBody(ArtifactRequestSchema), asyncHandler(updateArtifact));
artifactRouter.patch(
  "/:id/organization",
  validateBody(ArtifactOrganizationRequestSchema),
  asyncHandler(updateArtifactOrganization)
);
artifactRouter.get("/:id/versions", asyncHandler(listArtifactVersions));
artifactRouter.post("/import", validateBody(ImportArtifactsRequestSchema), asyncHandler(importArtifacts));
artifactRouter.put("/:id/share", validateBody(SetArtifactSharingRequestSchema), asyncHandler(setArtifactShared));
artifactRouter.delete("/:id", asyncHandler(deleteArtifact));
