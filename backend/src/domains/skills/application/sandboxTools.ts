import {
  initSandbox,
  executeRead,
  executeWrite,
  executeBash,
  executeSendUserFile,
  type SandboxPaths,
} from "./sandboxManager.js";
import { SkillRepository } from "../repositories/skillRepository.js";

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
  description:
    "Write text content to a file inside the sandbox workspace directory.",
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
  description:
    "Send a file from the sandbox workspace to the user as a downloadable attachment.",
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
  repo: SkillRepository = new SkillRepository()
): Promise<{ content: string; isError?: boolean }> {
  const sandboxPaths =
    paths ||
    initSandbox(
      conversationId,
      repo.getConversationSkills(conversationId)
    );

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
