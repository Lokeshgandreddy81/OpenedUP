import type { Request, Response } from "express";
import {
  ImportProjectsRequestSchema,
  ReplaceProjectsRequestSchema,
  type ImportProjectsRequest,
  type ReplaceProjectsRequest,
} from "@charan-interiors/contracts";
import type { ZodType } from "zod";
import { AppError } from "../../../platform/errors/errors.js";
import {
  deleteUserUploads,
  downloadUserUpload,
  storeProjectSnapshotResponse,
} from "../../../platform/storage/supabaseStorage.js";
import { ProjectRepository } from "../repositories/projectRepository.js";

const projects = new ProjectRepository();
const INLINE_PROJECT_RESPONSE_MAX_BYTES = 3 * 1024 * 1024;
type ProjectSnapshotReference = { snapshotPath: string };

async function projectResponse(
  userId: string,
  projectList: Awaited<ReturnType<ProjectRepository["list"]>>
) {
  const payload = { projects: projectList };
  const bytes = Buffer.from(JSON.stringify(payload), "utf8");
  if (bytes.byteLength <= INLINE_PROJECT_RESPONSE_MAX_BYTES) return payload;
  return { snapshotUrl: await storeProjectSnapshotResponse(userId, bytes) };
}

async function resolveProjectRequest<T>(
  userId: string,
  request: T | ProjectSnapshotReference,
  schema: ZodType<T>
): Promise<T> {
  if (!request || typeof request !== "object" || !("snapshotPath" in request)) {
    return request as T;
  }

  const snapshotPath = request.snapshotPath;
  try {
    const bytes = await downloadUserUpload(userId, snapshotPath, "project-snapshot");
    let payload: unknown;
    try {
      payload = JSON.parse(bytes.toString("utf8")) as unknown;
    } catch {
      throw new AppError("The uploaded project snapshot is not valid JSON.", 400);
    }
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const details = parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      throw new AppError(`The uploaded project snapshot is invalid: ${details}`, 400);
    }
    return parsed.data;
  } finally {
    await deleteUserUploads(userId, [snapshotPath]);
  }
}

export async function listProjects(req: Request, res: Response): Promise<void> {
  const userId = req.principal!.uid;
  res.json(await projectResponse(userId, await projects.list(userId)));
}

export async function replaceProjects(req: Request, res: Response): Promise<void> {
  const userId = req.principal!.uid;
  const request = await resolveProjectRequest(
    userId,
    req.body as ReplaceProjectsRequest | ProjectSnapshotReference,
    ReplaceProjectsRequestSchema
  );
  res.json(await projectResponse(userId, await projects.replace(userId, request)));
}

export async function importProjects(req: Request, res: Response): Promise<void> {
  const userId = req.principal!.uid;
  const request = await resolveProjectRequest(
    userId,
    req.body as ImportProjectsRequest | ProjectSnapshotReference,
    ImportProjectsRequestSchema
  );
  res.json(await projects.import(userId, request));
}
