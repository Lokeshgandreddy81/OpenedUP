import crypto from "node:crypto";
import { SkillRepository } from "../repositories/skillRepository.js";
import {
  parseSkillPackage,
  type RawFileInput,
} from "./skillParser.js";
import {
  resolveSkillVersionDir,
  writeSkillFilesToDisk,
} from "./skillStorage.js";

const HELLO_FORMAT_MD = `---
name: hello-format
description: Use this skill when asked to format greetings, user welcomes, or structured conversational introductions.
---
# Hello Format Instructions
Always greet the user warmly with their preferred title or name.
Provide a clean bulleted breakdown of how you can assist them today.
End with a supportive, professional closing.
`;

const CSV_SUMMARY_MD = `---
name: csv-summary
description: Use this skill when asked to analyze, summarize, or compute summary statistics from CSV files.
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

export function seedBuiltinSkills(repo = new SkillRepository()): void {
  const builtinSkills: Array<{ name: string; files: RawFileInput[] }> = [
    {
      name: "hello-format",
      files: [
        {
          relativePath: "SKILL.md",
          content: Buffer.from(HELLO_FORMAT_MD, "utf8"),
        },
      ],
    },
    {
      name: "csv-summary",
      files: [
        {
          relativePath: "SKILL.md",
          content: Buffer.from(CSV_SUMMARY_MD, "utf8"),
        },
        {
          relativePath: "scripts/summarize.py",
          content: Buffer.from(CSV_SUMMARY_PY, "utf8"),
        },
      ],
    },
  ];

  for (const item of builtinSkills) {
    const existing = repo.getByNameAndScope(item.name, "builtin");
    if (existing) continue;

    const parsed = parseSkillPackage(item.files);
    const versionDir = resolveSkillVersionDir("builtin", parsed.name, 1);
    writeSkillFilesToDisk(versionDir, parsed.files);

    const created = repo.create({
      name: parsed.name,
      description: parsed.description,
      scope: "builtin",
      ownerId: null,
      orgId: null,
      storagePath: versionDir,
      version: 1,
      isActive: true,
    });

    repo.addFiles(
      created.id,
      parsed.files.map((f) => ({
        relativePath: f.relativePath,
        sizeBytes: f.sizeBytes,
        sha256: f.sha256,
      }))
    );
  }
}
