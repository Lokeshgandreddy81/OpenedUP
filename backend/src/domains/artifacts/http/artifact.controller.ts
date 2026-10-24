import type { Request, Response } from "express";
import type {
  ArtifactOrganizationRequest,
  ArtifactRequest,
  ImportArtifactsRequest,
} from "@charan-interiors/contracts";
import { ArtifactRepository } from "../repositories/artifactRepository.js";

const artifacts = new ArtifactRepository();

export function listArtifacts(req: Request, res: Response): void {
  res.json({ artifacts: artifacts.list(req.principal!.uid) });
}

export function createArtifact(req: Request, res: Response): void {
  const artifact = artifacts.create(req.principal!.uid, req.body as ArtifactRequest);
  res.status(201).json({ artifact });
}

export function updateArtifact(req: Request, res: Response): void {
  const artifact = artifacts.update(
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

export function updateArtifactOrganization(req: Request, res: Response): void {
  const artifact = artifacts.updateOrganization(
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

export function listArtifactVersions(req: Request, res: Response): void {
  const versions = artifacts.versions(req.principal!.uid, req.params["id"]!);
  if (!versions) {
    res.status(404).json({ error: "Artifact not found.", requestId: req.id });
    return;
  }
  res.json({ versions });
}

export function importArtifacts(req: Request, res: Response): void {
  const result = artifacts.import(req.principal!.uid, req.body as ImportArtifactsRequest);
  res.json(result);
}

export function setArtifactShared(req: Request, res: Response): void {
  const isShared = (req.body as { isShared: boolean }).isShared;
  if (!artifacts.setShared(req.principal!.uid, req.params["id"]!, isShared)) {
    res.status(404).json({ error: "Artifact not found.", requestId: req.id });
    return;
  }
  res.json({ ok: true, isShared });
}

export function deleteArtifact(req: Request, res: Response): void {
  artifacts.delete(req.principal!.uid, req.params["id"]!);
  res.status(204).end();
}
