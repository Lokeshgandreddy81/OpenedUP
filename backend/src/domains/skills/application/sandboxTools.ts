import {
  initSandbox,
  executeRead,
  executeWrite,
  executeBash,
  executeSendUserFile,
  type SandboxPaths,
} from "./sandboxManager.js";
import { SkillRepository } from "../repositories/skillRepository.js";
import path from "node:path";
import { VercelSandboxExecutor } from "./sandboxExecutor.js";
import { resolveSandboxPath, MAX_READ_BYTES } from "./sandboxManager.js";
import { readSkillFile } from "./skillStorage.js";
import { storeGeneratedFile } from "../../../platform/storage/supabaseStorage.js";

export const READ_TOOL_DEFINITION = {
  name: "Read",
  description:
    "Read the contents of a file inside the sandbox workspace or from /mnt/skills/{scope}/{name}/.",
  input_schema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Relative path in workspace or absolute path in /mnt/skills/.",
      },
    },
    required: ["path"],
  },
} as const;

export const WRITE_TOOL_DEFINITION = {
  name: "Write",
  description: "Write text content to a file inside the sandbox workspace directory.",
  input_schema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Path relative to the workspace.",
      },
      content: {
        type: "string",
        description: "Text content to write.",
      },
    },
    required: ["path", "content"],
  },
} as const;

export const BASH_TOOL_DEFINITION = {
  name: "Bash",
  description:
    "Execute a shell command inside the isolated sandbox workspace. Commands are capped at 60s timeout.",
  input_schema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The shell command line string to run.",
      },
    },
    required: ["command"],
  },
} as const;

export const SEND_USER_FILE_TOOL_DEFINITION = {
  name: "SendUserFile",
  description: "Send a file from the sandbox workspace to the user as a downloadable attachment.",
  input_schema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Relative path of file in workspace.",
      },
      title: {
        type: "string",
        description: "Optional title or label for the file.",
      },
    },
    required: ["path"],
  },
} as const;

export const SANDBOX_TOOLS = [
  READ_TOOL_DEFINITION,
  WRITE_TOOL_DEFINITION,
  BASH_TOOL_DEFINITION,
  SEND_USER_FILE_TOOL_DEFINITION,
];

/**
 * Dispatches any sandbox tool call.
 */
export async function executeSandboxTool(
  toolName: string,
  input: Record<string, unknown>,
  conversationId: string,
  paths?: SandboxPaths,
  repo: SkillRepository = new SkillRepository(),
  userId?: string | null
): Promise<{ content: string; isError?: boolean }> {
  const sandboxPaths =
    paths || initSandbox(conversationId, await repo.getConversationSkills(conversationId));

  if (process.env["VERCEL"] === "1") {
    return executeOnVercelSandbox(toolName, input, conversationId, sandboxPaths, repo, userId);
  }

  switch (toolName) {
    case "Read": {
      const p = String(input["path"] || "");
      return executeRead(p, sandboxPaths);
    }
    case "Write": {
      const p = String(input["path"] || "");
      const c = String(input["content"] || "");
      return executeWrite(p, c, sandboxPaths);
    }
    case "Bash": {
      const cmd = String(input["command"] || "");
      return await executeBash(cmd, sandboxPaths);
    }
    case "SendUserFile": {
      const p = String(input["path"] || "");
      const title = input["title"] ? String(input["title"]) : undefined;
      return executeSendUserFile(p, conversationId, sandboxPaths, title);
    }
    default:
      return { content: `Error: Unknown tool '${toolName}'.`, isError: true };
  }
}

async function executeOnVercelSandbox(
  toolName: string,
  input: Record<string, unknown>,
  conversationId: string,
  paths: SandboxPaths,
  repo: SkillRepository,
  userId?: string | null
): Promise<{ content: string; isError?: boolean }> {
  const executor = new VercelSandboxExecutor();
  const sandbox = await (async () => {
    // The SDK's named workspace keeps files between function invocations.
    const { Sandbox } = await import("@vercel/sandbox");
    return Sandbox.getOrCreate({
      name: `openedup-${conversationId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48)}`,
      runtime: "node24",
      timeout: 5 * 60 * 1000,
    });
  })();

  // Mirror approved skill package files into the isolated workspace. The only
  // credentials available here are those needed to fetch skill bytes server-side.
  const skills = await repo.getConversationSkills(conversationId);
  const mounts: Array<{ path: string; content: Buffer; mode: number }> = [];
  for (const skill of skills) {
    if (!skill.storagePath) continue;
    for (const file of await repo.listFiles(skill.id)) {
      const content = await readSkillFile(skill.storagePath, file.relativePath);
      if (!content) continue;
      mounts.push({
        path: `/vercel/sandbox/mnt/skills/${skill.scope}/${skill.name}/${file.relativePath}`,
        content,
        mode: 0o444,
      });
    }
  }
  if (mounts.length) await sandbox.writeFiles(mounts);

  const rawPath = String(input["path"] || "");
  if (toolName === "Read" || toolName === "Write") {
    const resolved = resolveSandboxPath(rawPath, paths, true);
    const remotePath = resolved.isSkillMount
      ? `/vercel/sandbox/mnt/skills/${path.relative(paths.skillsMountDir, resolved.fullPath).split(path.sep).join(path.posix.sep)}`
      : `/vercel/sandbox/workspace/${path.relative(paths.workspaceDir, resolved.fullPath).split(path.sep).join(path.posix.sep)}`;
    if (toolName === "Write") {
      if (resolved.isSkillMount)
        return {
          content: "Error: /mnt/skills is mounted read-only and cannot be modified.",
          isError: true,
        };
      const content = String(input["content"] || "");
      await sandbox.mkDir(path.posix.dirname(remotePath));
      await sandbox.writeFiles([{ path: remotePath, content }]);
      return {
        content: `Successfully wrote ${Buffer.byteLength(content, "utf8")} bytes to ${rawPath}`,
      };
    }
    const content = await sandbox.readFileToBuffer({ path: remotePath });
    if (!content) return { content: `Error: File not found: ${rawPath}`, isError: true };
    if (content.byteLength > MAX_READ_BYTES)
      return {
        content: `Error: File exceeds maximum readable size of 5MB: ${rawPath}`,
        isError: true,
      };
    return { content: content.toString("utf8") };
  }
  if (toolName === "Bash") {
    return executeBash(String(input["command"] || ""), paths, { executor, conversationId });
  }
  if (toolName === "SendUserFile") {
    if (!userId)
      return { content: "Cannot attach a file without an authenticated user.", isError: true };
    const resolved = resolveSandboxPath(rawPath, paths, false);
    const relative = path
      .relative(paths.workspaceDir, resolved.fullPath)
      .split(path.sep)
      .join(path.posix.sep);
    const sourcePath = `/vercel/sandbox/workspace/${relative}`;
    const bytes = await sandbox.readFileToBuffer({ path: sourcePath });
    if (!bytes) return { content: `Error: File not found in workspace: ${rawPath}`, isError: true };
    const stored = await storeGeneratedFile({
      userId,
      conversationId,
      fileName: path.posix.basename(rawPath),
      bytes,
    });
    const displayTitle = input["title"]
      ? String(input["title"]).trim().slice(0, 120)
      : path.posix.basename(rawPath);
    const downloadUrl = `/api/conversations/${encodeURIComponent(conversationId)}/files/${encodeURIComponent(stored.objectKey)}`;
    return {
      content: `File prepared for user: ${displayTitle} (${path.posix.basename(rawPath)}, ${stored.sizeBytes} bytes). Download URL: ${downloadUrl}`,
    };
  }
  return { content: `Error: Unknown tool '${toolName}'.`, isError: true };
}
