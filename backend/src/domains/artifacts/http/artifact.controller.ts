import type { Request, Response } from "express";
import type {
  ArtifactOrganizationRequest,
  ArtifactRequest,
  ImportArtifactsRequest,
} from "@charan-interiors/contracts";
import { ArtifactRepository } from "../repositories/artifactRepository.js";
import { asyncHandler } from "../../../platform/http/middleware/asyncHandler.js";

const artifacts = new ArtifactRepository();

export async function listArtifacts(req: Request, res: Response): Promise<void> {
  res.json({ artifacts: await artifacts.list(req.principal!.uid) });
}

export async function createArtifact(req: Request, res: Response): Promise<void> {
  const artifact = await artifacts.create(req.principal!.uid, req.body as ArtifactRequest);
  res.status(201).json({ artifact });
}

export async function updateArtifact(req: Request, res: Response): Promise<void> {
  const artifact = await artifacts.update(
    req.principal!.uid,
    req.params["id"]!,
    req.body as ArtifactRequest
  );
  if (!artifact) {
    res.status(404).json({ error: "Artifact not found.", requestId: req.id });
    return;
  }
  res.json({ artifact });
}

export async function updateArtifactOrganization(req: Request, res: Response): Promise<void> {
  const artifact = await artifacts.updateOrganization(
    req.principal!.uid,
    req.params["id"]!,
    req.body as ArtifactOrganizationRequest
  );
  if (!artifact) {
    res.status(404).json({ error: "Artifact not found.", requestId: req.id });
    return;
  }
  res.json({ artifact });
}

export async function listArtifactVersions(req: Request, res: Response): Promise<void> {
  const versions = await artifacts.versions(req.principal!.uid, req.params["id"]!);
  if (!versions) {
    res.status(404).json({ error: "Artifact not found.", requestId: req.id });
    return;
  }
  res.json({ versions });
}

export async function importArtifacts(req: Request, res: Response): Promise<void> {
  const result = await artifacts.import(req.principal!.uid, req.body as ImportArtifactsRequest);
  res.json(result);
}

export async function setArtifactShared(req: Request, res: Response): Promise<void> {
  const isShared = (req.body as { isShared: boolean }).isShared;
  if (!await artifacts.setShared(req.principal!.uid, req.params["id"]!, isShared)) {
    res.status(404).json({ error: "Artifact not found.", requestId: req.id });
    return;
  }
  res.json({ ok: true, isShared });
}

export async function deleteArtifact(req: Request, res: Response): Promise<void> {
  await artifacts.delete(req.principal!.uid, req.params["id"]!);
  res.status(204).end();
}
