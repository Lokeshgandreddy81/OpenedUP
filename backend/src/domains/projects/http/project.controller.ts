import type { Request, Response } from "express";
import type { ImportProjectsRequest, ReplaceProjectsRequest } from "@charan-interiors/contracts";
import { ProjectRepository } from "../repositories/projectRepository.js";

const projects = new ProjectRepository();

export async function listProjects(req: Request, res: Response): Promise<void> {
  res.json({ projects: await projects.list(req.principal!.uid) });
}

export async function replaceProjects(req: Request, res: Response): Promise<void> {
  res.json({ projects: await projects.replace(req.principal!.uid, req.body as ReplaceProjectsRequest) });
}

export async function importProjects(req: Request, res: Response): Promise<void> {
  res.json(await projects.import(req.principal!.uid, req.body as ImportProjectsRequest));
}
