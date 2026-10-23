import type { Request, Response } from "express";
import type { ImportProjectsRequest, ReplaceProjectsRequest } from "@charan-interiors/contracts";
import { ProjectRepository } from "../repositories/projectRepository.js";

const projects = new ProjectRepository();

export function listProjects(req: Request, res: Response): void {
  res.json({ projects: projects.list(req.principal!.uid) });
}

export function replaceProjects(req: Request, res: Response): void {
  res.json({ projects: projects.replace(req.principal!.uid, req.body as ReplaceProjectsRequest) });
}

export function importProjects(req: Request, res: Response): void {
  res.json(projects.import(req.principal!.uid, req.body as ImportProjectsRequest));
}
