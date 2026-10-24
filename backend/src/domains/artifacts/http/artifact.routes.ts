import { Router } from "express";
import {
  ArtifactRequestSchema,
  ArtifactOrganizationRequestSchema,
  ImportArtifactsRequestSchema,
  SetArtifactSharingRequestSchema,
} from "@charan-interiors/contracts";
import { validateBody } from "../../../platform/http/middleware/validate.js";
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
artifactRouter.get("/", listArtifacts);
artifactRouter.post("/", validateBody(ArtifactRequestSchema), createArtifact);
artifactRouter.put("/:id", validateBody(ArtifactRequestSchema), updateArtifact);
artifactRouter.patch(
  "/:id/organization",
  validateBody(ArtifactOrganizationRequestSchema),
  updateArtifactOrganization
);
artifactRouter.get("/:id/versions", listArtifactVersions);
artifactRouter.post("/import", validateBody(ImportArtifactsRequestSchema), importArtifacts);
artifactRouter.put("/:id/share", validateBody(SetArtifactSharingRequestSchema), setArtifactShared);
artifactRouter.delete("/:id", deleteArtifact);
