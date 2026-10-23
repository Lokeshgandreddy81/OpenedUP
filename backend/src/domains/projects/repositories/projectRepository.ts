import type {
  ImportProjectsRequest,
  ProjectSnapshot,
  ReplaceProjectsRequest,
} from "@charan-interiors/contracts";
import { getChatDatabase, type ChatDatabase } from "../../../platform/database/chatDatabase.js";

export class ProjectRepository {
  constructor(private readonly db: ChatDatabase = getChatDatabase()) {}

  list(userId: string): ProjectSnapshot[] {
    const rows = this.db
      .prepare(
        "SELECT payload_json FROM project_snapshots WHERE user_id = ? ORDER BY updated_at DESC"
      )
      .all(userId) as Array<{ payload_json: string }>;
    return rows.map(({ payload_json }) => JSON.parse(payload_json) as ProjectSnapshot);
  }

  replace(userId: string, request: ReplaceProjectsRequest): ProjectSnapshot[] {
    const replace = this.db.transaction(() => {
      this.db.prepare("DELETE FROM project_snapshots WHERE user_id = ?").run(userId);
      const insert = this.db.prepare(
        "INSERT INTO project_snapshots(user_id, project_id, payload_json, updated_at) VALUES (?, ?, ?, ?)"
      );
      for (const project of request.projects) {
        insert.run(userId, project.id, JSON.stringify(project), project.updatedAt);
      }
    });
    replace();
    return this.list(userId);
  }

  import(userId: string, request: ImportProjectsRequest): { imported: number; skipped: number } {
    const insert = this.db.prepare(
      `INSERT INTO project_snapshots(user_id, project_id, payload_json, updated_at)
       VALUES (?, ?, ?, ?) ON CONFLICT(user_id, project_id) DO NOTHING`
    );
    let imported = 0;
    const importProjects = this.db.transaction(() => {
      for (const project of request.projects) {
        const result = insert.run(userId, project.id, JSON.stringify(project), project.updatedAt);
        imported += Number(result.changes > 0);
      }
    });
    importProjects();
    return { imported, skipped: request.projects.length - imported };
  }
}
