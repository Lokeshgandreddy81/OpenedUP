import assert from "node:assert/strict";
import test from "node:test";
import AdmZip from "adm-zip";
import {
  parseSkillMd,
  parseSkillPackage,
  parseSkillZip,
  validateRelativePath,
  SkillValidationError,
  MAX_SKILL_MD_BYTES,
} from "./skillParser.js";

test("SkillParser - parseSkillMd: succeeds for valid frontmatter and body", () => {
  const content = `---
name: csv-summary
description: Use this skill when asked to analyze, summarize, or calculate statistics on CSV files.
---
# CSV Summary
Follow these instructions to inspect and summarize CSV datasets.
`;

  const parsed = parseSkillMd(content);
  assert.equal(parsed.name, "csv-summary");
  assert.equal(
    parsed.description,
    "Use this skill when asked to analyze, summarize, or calculate statistics on CSV files."
  );
  assert.ok(parsed.body.includes("# CSV Summary"));
});

test("SkillParser - parseSkillMd: rejects missing frontmatter", () => {
  const content = `# Just markdown
No frontmatter at all.`;

  assert.throws(
    () => parseSkillMd(content),
    (err: Error) => err instanceof SkillValidationError && err.message.includes("YAML frontmatter")
  );
});

test("SkillParser - parseSkillMd: rejects missing name or description", () => {
  const missingName = `---
description: Some valid description
---
Body text`;

  assert.throws(
    () => parseSkillMd(missingName),
    (err: Error) => err instanceof SkillValidationError && err.message.includes("name")
  );

  const missingDesc = `---
name: valid-name
---
Body text`;

  assert.throws(
    () => parseSkillMd(missingDesc),
    (err: Error) => err instanceof SkillValidationError && err.message.includes("description")
  );
});

test("SkillParser - parseSkillMd: rejects invalid name formats", () => {
  const invalidNames = [
    "UpperCaseName",
    "name_with_underscores",
    "name with spaces",
    "-leading-hyphen",
    "trailing-hyphen-",
    "double--hyphen",
    "a".repeat(65),
    "special$char",
  ];

  for (const name of invalidNames) {
    const md = `---
name: ${name}
description: Valid description
---
Body text`;
    assert.throws(
      () => parseSkillMd(md),
      (err: Error) => err instanceof SkillValidationError,
      `Should have rejected name: ${name}`
    );
  }
});

test("SkillParser - parseSkillMd: rejects oversize description (>1024 chars)", () => {
  const longDesc = "a".repeat(1025);
  const md = `---
name: valid-name
description: ${longDesc}
---
Body text`;

  assert.throws(
    () => parseSkillMd(md),
    (err: Error) => err instanceof SkillValidationError && err.message.includes("1024")
  );
});

test("SkillParser - parseSkillMd: rejects SKILL.md over 200KB", () => {
  const hugeContent = `---
name: valid-name
description: Valid description
---
` + "x".repeat(MAX_SKILL_MD_BYTES + 100);

  assert.throws(
    () => parseSkillMd(hugeContent),
    (err: Error) => err instanceof SkillValidationError && err.message.includes("200KB")
  );
});

test("SkillParser - validateRelativePath: rejects path traversals", () => {
  const traversals = [
    "../secret.txt",
    "folder/../../etc/passwd",
    "/absolute/path/file.txt",
    "C:\\windows\\system32",
    "folder/sub/../../../escape",
    "file\0nullbyte.txt",
    "~/.ssh/id_rsa",
  ];

  for (const p of traversals) {
    assert.throws(
      () => validateRelativePath(p),
      (err: Error) => err instanceof SkillValidationError,
      `Should have rejected traversal path: ${p}`
    );
  }
});

test("SkillParser - parseSkillPackage: parses package and calculates hashes", () => {
  const skillMdContent = Buffer.from(`---
name: hello-format
description: Formats user greetings and responses with clean styling.
---
# Hello Format Instructions
Always greet the user warmly.`);

  const scriptContent = Buffer.from("echo 'Hello World'");

  const pkg = parseSkillPackage([
    { relativePath: "SKILL.md", content: skillMdContent },
    { relativePath: "scripts/greet.sh", content: scriptContent },
  ]);

  assert.equal(pkg.name, "hello-format");
  assert.equal(pkg.files.length, 2);
  const scriptFile = pkg.files.find((f) => f.relativePath === "scripts/greet.sh");
  assert.ok(scriptFile);
  assert.ok(scriptFile.sha256);
  assert.equal(scriptFile.sizeBytes, scriptContent.length);
});

test("SkillParser - parseSkillPackage: rejects package missing SKILL.md", () => {
  assert.throws(
    () =>
      parseSkillPackage([
        { relativePath: "scripts/run.py", content: Buffer.from("print('hi')") },
      ]),
    (err: Error) => err instanceof SkillValidationError && err.message.includes("SKILL.md")
  );
});

test("SkillParser - parseSkillZip: unpacks and parses zip package", () => {
  const zip = new AdmZip();
  zip.addFile(
    "SKILL.md",
    Buffer.from(`---
name: zip-skill
description: Skill packaged as a zip file.
---
# Instructions inside zip
Do something helpful.`)
  );
  zip.addFile("templates/response.txt", Buffer.from("Template response"));

  const zipBuffer = zip.toBuffer();
  const parsed = parseSkillZip(zipBuffer);

  assert.equal(parsed.name, "zip-skill");
  assert.equal(parsed.files.length, 2);
  assert.ok(parsed.files.some((f) => f.relativePath === "templates/response.txt"));
});

test("SkillParser - parseSkillZip: un-nests top-level skill folder wrapper", () => {
  const zip = new AdmZip();
  zip.addFile(
    "nested-skill/SKILL.md",
    Buffer.from(`---
name: nested-skill
description: Skill inside a root folder.
---
# Nested instructions`)
  );
  zip.addFile("nested-skill/scripts/test.py", Buffer.from("print(1)"));

  const zipBuffer = zip.toBuffer();
  const parsed = parseSkillZip(zipBuffer);

  assert.equal(parsed.name, "nested-skill");
  assert.ok(parsed.files.some((f) => f.relativePath === "SKILL.md"));
  assert.ok(parsed.files.some((f) => f.relativePath === "scripts/test.py"));
});

test("SkillParser - parseSkillPackage: rejects binary files outside scripts/ or templates/", () => {
  const skillMdContent = Buffer.from(`---
name: bad-binary-skill
description: Skill with binary in forbidden root folder.
---
# Instructions`);

  assert.throws(
    () =>
      parseSkillPackage([
        { relativePath: "SKILL.md", content: skillMdContent },
        { relativePath: "malicious.exe", content: Buffer.from("fake binary") },
      ]),
    (err: Error) => err instanceof SkillValidationError && err.message.includes("Binary files")
  );
});
