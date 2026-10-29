import { SkillRepository, type SkillScope } from "../repositories/skillRepository.js";
import { parseSkillPackage, type RawFileInput } from "./skillParser.js";
import { createSkillStoragePath, persistSkillFiles } from "./skillStorage.js";
import { randomUUID } from "node:crypto";

const HELLO_FORMAT_MD = `---
name: hello-format
description: Used for formatting warm greetings, structured introductions, and conversational welcomes.
icon: MessageSquare
author: Charan Interiors Core
categories: [Productivity]
---
# Hello Format Instructions
For a greeting, reply with one brief, natural sentence. Do not print the skill name, input, output, JSON, or execution details. Do not list capabilities unless the user asks what you can help with.
`;

const CSV_SUMMARY_MD = `---
name: csv-summary
description: Used for analyzing, inspecting, and calculating summary statistics from CSV files.
icon: BarChart3
author: Data Science Guild
tools: [Bash, Read, SendUserFile]
categories: [Data, Analytics]
---
# CSV Summary Instructions
When provided with a CSV file or CSV data, run \`scripts/summarize.py <file>\` via the Bash tool.
Present the resulting statistical summary, column types, row counts, and missing value counts to the user.
`;

const CSV_SUMMARY_PY = `import sys
import csv

def summarize(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader, None)
            rows = list(reader)
        print(f"Columns ({len(header) if header else 0}): {', '.join(header) if header else 'None'}")
        print(f"Total Rows: {len(rows)}")
    except Exception as e:
        print(f"Error reading CSV: {e}", file=sys.stderr)

if __name__ == '__main__':
    if len(sys.argv) > 1:
        summarize(sys.argv[1])
    else:
        print("Usage: summarize.py <path-to-csv>")
`;

const WEB_RESEARCH_MD = `---
name: web-research-analyst
description: Used for comprehensive market research, competitor landscape analysis, and technology trend reports.
icon: Globe
author: Anthropic Community
source_label: from Directory
tools: [Bash, Read, Write]
categories: [Research, Productivity]
---
# Web Research Analyst Instructions
Synthesize findings into executive briefings with structured problem statements, quantitative metrics, and source attributions.
Use the dedicated sub-agent in \`agents/researcher.md\` when multi-step recursive investigation is requested.
`;

const RESEARCHER_AGENT_MD = `---
name: Research Specialist
description: Autonomous deep-dive agent specializing in recursive information gathering and citation verification.
tools: [Bash, Read, Write]
---
You are an autonomous research subagent. Follow strict factual verification standards.
Cross-reference multiple data points before formulating conclusions.
`;

const SQL_SCHEMA_MD = `---
name: sql-schema-architect
description: Used for designing relational database schemas, query optimization, indexing strategies, and migrations.
icon: Database
author: Data Architecture Guild
source_label: from Directory
categories: [Database, Architecture]
---
# SQL Schema Architect Instructions
Follow 3NF normalization principles by default unless performance denormalization is explicitly justified.
Always specify explicit column constraints (NOT NULL, CHECK, UNIQUE), foreign key cascade behaviors, and index strategies.
`;

const MARKDOWN_DOC_MD = `---
name: markdown-doc-writer
description: Used for authoring technical documentation, API guides, RFC specifications, and developer playbooks.
icon: FileText
author: Technical Writers Guild
source_label: from Directory
tools: [Read, Write]
categories: [Writing, Documentation]
---
# Markdown Documentation Writer Instructions
Format documentation strictly using GitHub-flavored Markdown.
Structure guides with Purpose, Prerequisites, Step-by-Step Walkthrough, Code Snippets, and Common Pitfalls.
`;

const FASTAPI_SCAFFOLD_MD = `---
name: fastapi-backend-scaffolder
description: Used for scaffolding enterprise-grade FastAPI microservices with Pydantic v2 schemas and async SQLAlchemy.
icon: Code
author: Backend Masters
source_label: from Directory
tools: [Bash, Write]
categories: [Development, Python]
---
# FastAPI Backend Scaffolder Instructions
Scaffold microservices using the layered domain architecture:
- routers/ for HTTP handlers
- services/ for business logic
- schemas/ for Pydantic v2 models
- models/ for SQLAlchemy ORM
`;

export async function seedBuiltinSkills(repo = new SkillRepository()): Promise<void> {
  const seedItems: Array<{
    name: string;
    scope: SkillScope;
    files: RawFileInput[];
  }> = [
    {
      name: "hello-format",
      scope: "builtin",
      files: [{ relativePath: "SKILL.md", content: Buffer.from(HELLO_FORMAT_MD, "utf8") }],
    },
    {
      name: "csv-summary",
      scope: "builtin",
      files: [
        { relativePath: "SKILL.md", content: Buffer.from(CSV_SUMMARY_MD, "utf8") },
        { relativePath: "scripts/summarize.py", content: Buffer.from(CSV_SUMMARY_PY, "utf8") },
      ],
    },
    {
      name: "web-research-analyst",
      scope: "directory",
      files: [
        { relativePath: "SKILL.md", content: Buffer.from(WEB_RESEARCH_MD, "utf8") },
        { relativePath: "agents/researcher.md", content: Buffer.from(RESEARCHER_AGENT_MD, "utf8") },
      ],
    },
    {
      name: "sql-schema-architect",
      scope: "directory",
      files: [{ relativePath: "SKILL.md", content: Buffer.from(SQL_SCHEMA_MD, "utf8") }],
    },
    {
      name: "markdown-doc-writer",
      scope: "directory",
      files: [{ relativePath: "SKILL.md", content: Buffer.from(MARKDOWN_DOC_MD, "utf8") }],
    },
    {
      name: "fastapi-backend-scaffolder",
      scope: "directory",
      files: [{ relativePath: "SKILL.md", content: Buffer.from(FASTAPI_SCAFFOLD_MD, "utf8") }],
    },
  ];

  for (const item of seedItems) {
    const existing = await repo.getByNameAndScope(item.name, item.scope);
    if (existing) continue;

    const parsed = parseSkillPackage(item.files);
    const id = randomUUID();
    const versionDir = createSkillStoragePath(id, 1);
    await persistSkillFiles(versionDir, parsed.files);

    const created = await repo.create({
      id,
      name: parsed.name,
      description: parsed.description,
      scope: item.scope,
      ownerId: null,
      orgId: null,
      storagePath: versionDir,
      version: 1,
      isActive: true,
      icon: parsed.icon,
      author: parsed.author,
      sourceLabel: item.scope === "directory" ? "from Directory" : "Built-in",
      changelog: parsed.changelog || "Initial release",
      toolsRequired: parsed.toolsRequired || [],
      approvalStatus: "approved",
    });

    const fileRecords = await repo.addFiles(
      created.id,
      parsed.files.map((f) => ({
        relativePath: f.relativePath,
        sizeBytes: f.sizeBytes,
        sha256: f.sha256,
      }))
    );

    // Save skill version
    await repo.recordSkillVersion(created.id, 1, "Initial release", fileRecords);

    // Save agents if parsed
    if (parsed.agents && parsed.agents.length > 0) {
      await repo.saveSkillAgents(created.id, parsed.agents);
    }

    // Link categories
    if (parsed.categories) {
      for (const catName of parsed.categories) {
        const catId = await repo.ensureCategory(catName);
        await repo.linkSkillCategory(created.id, catId);
      }
    }
  }
}
