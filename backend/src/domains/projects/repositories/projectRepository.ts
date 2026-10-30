import type {
  ImportProjectsRequest,
  ProjectSnapshot,
  ReplaceProjectsRequest,
} from "@charan-interiors/contracts";
import type { Database as BetterSqliteDatabase } from "better-sqlite3";
import {
  asDatabaseClient,
  type DatabaseClient,
} from "../../../platform/database/databaseClient.js";

export class ProjectRepository {
  private readonly db: DatabaseClient;

  constructor(db?: DatabaseClient | BetterSqliteDatabase) {
    this.db = asDatabaseClient(db);
  }

  async list(userId: string): Promise<ProjectSnapshot[]> {
    const rows = await this.db.all<{ payload_json: string }>(
      "SELECT payload_json FROM project_snapshots WHERE user_id = ? ORDER BY updated_at DESC",
      [userId]
    );
    return rows.map(({ payload_json }) => JSON.parse(payload_json) as ProjectSnapshot);
  }

  async replace(userId: string, request: ReplaceProjectsRequest): Promise<ProjectSnapshot[]> {
    await this.db.transaction(async (tx) => {
      const retainedProjectIds = request.projects.map((project) => project.id);
      if (retainedProjectIds.length === 0) {
        await tx.run("DELETE FROM project_skills WHERE user_id = ?", [userId]);
      } else {
        const placeholders = retainedProjectIds.map(() => "?").join(", ");
        await tx.run(
          `DELETE FROM project_skills
           WHERE user_id = ? AND project_id NOT IN (${placeholders})`,
          [userId, ...retainedProjectIds]
        );
      }
      await tx.run("DELETE FROM project_snapshots WHERE user_id = ?", [userId]);
      for (const project of request.projects) {
        await tx.run(
          `INSERT INTO project_snapshots(user_id, project_id, payload_json, updated_at)
           VALUES (?, ?, ?, ?)`,
          [userId, project.id, JSON.stringify(project), project.updatedAt]
        );
      }
    })();
    return this.list(userId);
  }

  async import(
    userId: string,
    request: ImportProjectsRequest
  ): Promise<{ imported: number; skipped: number }> {
    let imported = 0;
    await this.db.transaction(async (tx) => {
      for (const project of request.projects) {
        const result = await tx.run(
          `INSERT INTO project_snapshots(user_id, project_id, payload_json, updated_at)
           VALUES (?, ?, ?, ?) ON CONFLICT(user_id, project_id) DO NOTHING`,
          [userId, project.id, JSON.stringify(project), project.updatedAt]
        );
        imported += Number(result.changes > 0);
      }
    })();
    return { imported, skipped: request.projects.length - imported };
  }
}
